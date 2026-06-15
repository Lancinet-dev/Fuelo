// ================================================
// FUELO — Service Layer : Messagerie interne
// ================================================
// Privacité : toute lecture/écriture exige que l'utilisateur soit MEMBRE de la
// conversation (table conversation_membres). Les conversations directes (2
// membres) sont donc strictement privées entre ces deux personnes.

const pool = require('../config/database')

// ── Garde-fou : l'utilisateur est-il membre de la conversation ? ──
const assertMembre = async (conversationId, userId) => {
  const r = await pool.query(
    `SELECT 1 FROM conversation_membres WHERE conversation_id = $1 AND user_id = $2`,
    [conversationId, userId]
  )
  if (!r.rows[0]) throw new Error('Conversation introuvable ou accès non autorisé')
}

// ── IDs des membres d'une conversation (pour les emits Socket.IO) ──
const getMembreIds = async (conversationId) => {
  const r = await pool.query(
    `SELECT user_id FROM conversation_membres WHERE conversation_id = $1`,
    [conversationId]
  )
  return r.rows.map(x => x.user_id)
}

// ── Liste des conversations de l'utilisateur (avec dernier message + non lus) ──
const getConversations = async (userId) => {
  const r = await pool.query(
    `SELECT
       c.id, c.type, c.nom, c.station_id, c.created_at,
       lm.contenu      AS dernier_contenu,
       lm.type         AS dernier_type,
       lm.created_at   AS dernier_at,
       lm.sender_id    AS dernier_sender_id,
       su.nom          AS dernier_sender_nom,
       (SELECT COUNT(*) FROM messages mx
          WHERE mx.conversation_id = c.id
            AND mx.sender_id <> $1
            AND mx.created_at > me.derniere_lecture) AS non_lus,
       am.user_id      AS autre_id,
       au.nom          AS autre_nom,
       au.role         AS autre_role,
       au.avatar       AS autre_avatar,
       (SELECT COUNT(*) FROM conversation_membres cm WHERE cm.conversation_id = c.id) AS nb_membres,
       (SELECT ARRAY_AGG(cm2.user_id) FROM conversation_membres cm2 WHERE cm2.conversation_id = c.id) AS membre_ids
     FROM conversations c
     JOIN conversation_membres me ON me.conversation_id = c.id AND me.user_id = $1
     LEFT JOIN LATERAL (
       SELECT contenu, type, created_at, sender_id
       FROM messages m WHERE m.conversation_id = c.id
       ORDER BY m.created_at DESC LIMIT 1
     ) lm ON true
     LEFT JOIN users su ON su.id = lm.sender_id
     LEFT JOIN LATERAL (
       SELECT user_id FROM conversation_membres cm
       WHERE cm.conversation_id = c.id AND cm.user_id <> $1 LIMIT 1
     ) am ON c.type = 'direct'
     LEFT JOIN users au ON au.id = am.user_id
     ORDER BY COALESCE(lm.created_at, c.created_at) DESC`,
    [userId]
  )
  return r.rows.map(c => ({
    ...c,
    non_lus:    parseInt(c.non_lus) || 0,
    nb_membres: parseInt(c.nb_membres) || 0,
  }))
}

// ── Messages d'une conversation (paginés, ordre chronologique) ──
const getMessages = async (conversationId, userId, { page = 1, limit = 30 } = {}) => {
  await assertMembre(conversationId, userId)
  const lim    = Math.min(parseInt(limit) || 30, 100)
  const offset = (Math.max(parseInt(page) || 1, 1) - 1) * lim

  const [msgRes, lectureRes] = await Promise.all([
    pool.query(
      `SELECT m.id, m.conversation_id, m.sender_id, m.contenu, m.type, m.fichier_url, m.created_at,
              u.nom AS sender_nom, u.role AS sender_role, u.avatar AS sender_avatar
       FROM messages m LEFT JOIN users u ON u.id = m.sender_id
       WHERE m.conversation_id = $1
       ORDER BY m.created_at DESC
       LIMIT $2 OFFSET $3`,
      [conversationId, lim + 1, offset]
    ),
    // Plus petite "dernière lecture" parmi les AUTRES membres → un message est
    // "lu" (✓✓) si tous les autres l'ont vu (created_at <= cette valeur)
    pool.query(
      `SELECT MIN(derniere_lecture) AS min_lecture
       FROM conversation_membres WHERE conversation_id = $1 AND user_id <> $2`,
      [conversationId, userId]
    ),
  ])

  const hasMore  = msgRes.rows.length > lim
  const rows     = hasMore ? msgRes.rows.slice(0, lim) : msgRes.rows
  const minLect  = lectureRes.rows[0]?.min_lecture ? new Date(lectureRes.rows[0].min_lecture) : null

  // Remettre en ordre chronologique (ancien → récent) + flag de lecture
  const messages = rows.reverse().map(m => ({
    ...m,
    lu: minLect ? new Date(m.created_at) <= minLect : false,
  }))

  return { messages, has_more: hasMore }
}

// ── Créer une conversation (directe ou groupe) ──
const createConversation = async (user, { type = 'direct', membres = [], nom = null }) => {
  const { id: userId, station_id } = user

  const autres = [...new Set((membres || []).map(Number).filter(id => id && id !== userId))]
  if (autres.length === 0) throw new Error('Sélectionnez au moins un destinataire')

  // Privacité : on ne peut écrire qu'à des membres de SA station (via station_users)
  const check = await pool.query(
    `SELECT DISTINCT u.id FROM users u
     JOIN station_users su ON su.user_id = u.id
     WHERE u.id = ANY($1) AND su.station_id = $2 AND u.deleted_at IS NULL`,
    [autres, station_id]
  )
  if (check.rows.length !== autres.length) {
    throw new Error('Certains destinataires ne font pas partie de votre station')
  }

  const estGroupe = type === 'groupe' || autres.length > 1
  if (estGroupe && !nom?.trim()) throw new Error('Un nom est requis pour un groupe')

  // Conversation directe : réutiliser celle qui existe déjà entre les 2 personnes
  if (!estGroupe) {
    const autreId = autres[0]
    const existant = await pool.query(
      `SELECT c.id FROM conversations c
       JOIN conversation_membres m1 ON m1.conversation_id = c.id AND m1.user_id = $1
       JOIN conversation_membres m2 ON m2.conversation_id = c.id AND m2.user_id = $2
       WHERE c.type = 'direct'
         AND (SELECT COUNT(*) FROM conversation_membres mm WHERE mm.conversation_id = c.id) = 2
       LIMIT 1`,
      [userId, autreId]
    )
    if (existant.rows[0]) return existant.rows[0].id
  }

  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const conv = await client.query(
      `INSERT INTO conversations (station_id, type, nom, created_by)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [station_id, estGroupe ? 'groupe' : 'direct', estGroupe ? nom.trim() : null, userId]
    )
    const convId = conv.rows[0].id
    const tous   = [userId, ...autres]
    // Insère tous les membres
    const values = tous.map((_, i) => `($1, $${i + 2})`).join(', ')
    await client.query(
      `INSERT INTO conversation_membres (conversation_id, user_id) VALUES ${values}`,
      [convId, ...tous]
    )
    await client.query('COMMIT')
    return convId
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}

// ── Envoyer un message ──
const sendMessage = async (user, conversationId, { contenu, type = 'texte', fichier_url = null }) => {
  await assertMembre(conversationId, user.id)
  const texte = (contenu ?? '').toString().trim()
  if (type === 'texte' && !texte) throw new Error('Message vide')
  if (type !== 'texte' && !fichier_url) throw new Error('Fichier manquant')

  const r = await pool.query(
    `INSERT INTO messages (conversation_id, sender_id, contenu, type, fichier_url, lu_par)
     VALUES ($1, $2, $3, $4, $5, ARRAY[$2]::int[]) RETURNING *`,
    [conversationId, user.id, texte || null, type, fichier_url]
  )
  const message = r.rows[0]
  return {
    ...message,
    sender_nom:  user.nom,
    sender_role: user.role,
  }
}

// ── Marquer une conversation comme lue ──
const markRead = async (user, conversationId) => {
  await assertMembre(conversationId, user.id)
  await pool.query(
    `UPDATE conversation_membres SET derniere_lecture = NOW()
     WHERE conversation_id = $1 AND user_id = $2`,
    [conversationId, user.id]
  )
  // Accusés de lecture (lu_par) sur les messages des autres
  await pool.query(
    `UPDATE messages SET lu_par = array_append(lu_par, $2)
     WHERE conversation_id = $1 AND sender_id <> $2 AND NOT ($2 = ANY(lu_par))`,
    [conversationId, user.id]
  )
}

// ── Total des messages non lus (badge sidebar) ──
const getTotalNonLus = async (userId) => {
  const r = await pool.query(
    `SELECT COUNT(*) AS total
     FROM messages m
     JOIN conversation_membres me ON me.conversation_id = m.conversation_id AND me.user_id = $1
     WHERE m.sender_id <> $1 AND m.created_at > me.derniere_lecture`,
    [userId]
  )
  return parseInt(r.rows[0].total) || 0
}

// ── Employés de la station (pour la nouvelle conversation) ──
const getStationUsers = async (user) => {
  // L'appartenance station passe par la table de liaison station_users
  // (la table users n'a pas de colonne station_id)
  const r = await pool.query(
    `SELECT DISTINCT u.id, u.nom, u.role, u.avatar
     FROM users u
     JOIN station_users su ON su.user_id = u.id
     WHERE su.station_id = $1 AND u.deleted_at IS NULL
       AND COALESCE(u.actif, true) = true AND u.id <> $2
     ORDER BY u.nom ASC`,
    [user.station_id, user.id]
  )
  return r.rows
}

module.exports = {
  assertMembre, getMembreIds, getConversations, getMessages,
  createConversation, sendMessage, markRead, getTotalNonLus, getStationUsers,
}
