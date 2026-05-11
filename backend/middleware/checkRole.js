// ================================================
// FUELO V2 — Middleware checkRole
// Vérifie que l'utilisateur a le bon rôle
// ================================================

// Hiérarchie des rôles (du plus bas au plus haut)
const ROLES = {
  pompiste:   1,
  manager:    2,
  owner:      3,
  superadmin: 4,
}

// ── checkRole(roles) ─────────────────────────────────
// Exemple : checkRole(['manager', 'owner', 'superadmin'])
// Bloque si le rôle de l'utilisateur est insuffisant
const checkRole = (rolesAutorises) => {
  return (req, res, next) => {
    const userRole = req.user?.role

    if (!userRole) {
      return res.status(401).json({ error: 'Non authentifié' })
    }

    if (!rolesAutorises.includes(userRole)) {
      return res.status(403).json({
        error: 'Accès refusé',
        message: `Cette action nécessite un rôle : ${rolesAutorises.join(' ou ')}`,
        votre_role: userRole
      })
    }

    next()
  }
}

// ── Raccourcis pratiques ─────────────────────────────
const isPompiste   = checkRole(['pompiste', 'manager', 'owner', 'superadmin'])
const isManager    = checkRole(['manager', 'owner', 'superadmin'])
const isOwner      = checkRole(['owner', 'superadmin'])
const isSuperAdmin = checkRole(['superadmin'])

module.exports = { checkRole, isPompiste, isManager, isOwner, isSuperAdmin }