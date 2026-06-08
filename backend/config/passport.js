// ================================================
// FUELO V2 — Google OAuth avec Passport
// Fichier : backend/config/passport.js
// ================================================

const passport     = require('passport')
const GoogleStrategy = require('passport-google-oauth20').Strategy
const pool         = require('./database')
const logger       = require('../utils/logger')

passport.use(new GoogleStrategy({
  clientID:     process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL:  `${process.env.BACKEND_URL}/api/auth/google/callback`,
},
async (accessToken, refreshToken, profile, done) => {
  try {
    const email  = String(profile.emails?.[0]?.value ?? '').trim().toLowerCase()
    const nom    = profile.displayName
    const avatar = profile.photos?.[0]?.value
    const googleId = profile.id

    if (!email) return done(null, false)

    // Comparaison insensible à la casse — un compte créé en local avec
    // "Jean@Gmail.com" doit être retrouvé même si Google renvoie "jean@gmail.com"
    let result = await pool.query(
      'SELECT * FROM users WHERE LOWER(email) = LOWER($1) AND deleted_at IS NULL',
      [email]
    )

    let user

    if (result.rows.length > 0) {
      // Mettre à jour google_id et avatar si pas encore fait
      user = result.rows[0]
      await pool.query(
        'UPDATE users SET google_id = $1, avatar = $2 WHERE id = $3',
        [googleId, avatar, user.id]
      )
    } else {
      // Créer nouveau compte owner
      const newUser = await pool.query(
        `INSERT INTO users (nom, email, password, role, google_id, avatar)
         VALUES ($1, $2, '', 'owner', $3, $4)
         RETURNING *`,
        [nom, email, googleId, avatar]
      )
      user = newUser.rows[0]

      // Créer station par défaut
      const station = await pool.query(
        `INSERT INTO stations (owner_id, nom)
         VALUES ($1, $2) RETURNING id`,
        [user.id, `Station de ${nom}`]
      )

      await pool.query(
        `INSERT INTO station_users (station_id, user_id)
         VALUES ($1, $2)`,
        [station.rows[0].id, user.id]
      )

      await pool.query(
        `INSERT INTO stocks (station_id, type, quantite)
         VALUES ($1, 'essence', 0), ($1, 'gasoil', 0)`,
        [station.rows[0].id]
      )
    }

    logger.info(`Google OAuth — connexion ${email}`)
    return done(null, user)
  } catch (err) {
    logger.error('Google OAuth error', err)
    return done(err, null)
  }
}))

module.exports = passport