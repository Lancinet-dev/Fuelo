// ================================================
// FUELO V2 — Middleware checkRole
// ================================================

const ROLE_LEVELS = Object.freeze({
  pompiste: 1,
  gerant: 2,
  owner: 4,
  superadmin: 5,
})

const normalizeRole = (value = '') => {
  const role = String(value).trim().toLowerCase()
  return role === 'manager' ? 'gerant' : role
}

const checkRole = (rolesAutorises = []) => {
  const normalizedRoles = Array.isArray(rolesAutorises)
    ? rolesAutorises.map(normalizeRole).filter(Boolean)
    : []

  return (req, res, next) => {
    if (normalizedRoles.length === 0) {
      return res.status(500).json({ error: 'Configuration de rôle invalide' })
    }

    const userRole = normalizeRole(req.user?.role)

    if (!userRole) {
      return res.status(401).json({ error: 'Non authentifié' })
    }

    const userLevel = ROLE_LEVELS[userRole]
    if (userLevel == null) {
      return res.status(403).json({ error: 'Rôle inconnu', votre_role: userRole })
    }

    const allowed = normalizedRoles.some((role) => {
      const roleLevel = ROLE_LEVELS[role]
      return roleLevel != null && userLevel >= roleLevel
    })

    if (!allowed) {
      return res.status(403).json({
        error: 'Accès refusé',
        message: `Rôle requis : ${normalizedRoles.join(' ou ')}`,
        votre_role: userRole,
      })
    }

    req.user.role = userRole
    next()
  }
}

const isPompiste = checkRole(['pompiste'])
const isManager = checkRole(['gerant'])
const isOwner = checkRole(['owner'])
const isAdmin = checkRole(['superadmin'])

module.exports = {
  checkRole,
  isPompiste,
  isManager,
  isOwner,
  isAdmin,
}