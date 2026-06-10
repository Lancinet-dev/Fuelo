// ================================================
// FUELO V2 — Middleware checkRole
// ================================================

const ROLE_LEVELS = Object.freeze({
  pompiste:     1,
  chauffeur:    1,
  logisticien:  1,
  comptable:    1,  // rôle isolé — accès via canAccessComptable uniquement, pas via checkRole hiérarchique
  gerant:       2,
  owner:        4,
  superadmin:   5,
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

const checkExactRole = (rolesAutorises = []) => {
  const normalizedRoles = Array.isArray(rolesAutorises)
    ? rolesAutorises.map(normalizeRole).filter(Boolean)
    : []

  return (req, res, next) => {
    const userRole = normalizeRole(req.user?.role)
    if (!userRole) return res.status(401).json({ error: 'Non authentifié' })

    if (!normalizedRoles.includes(userRole)) {
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

const isPompiste    = checkExactRole(['pompiste'])
const isManager     = checkRole(['gerant'])
const isOwner       = checkRole(['owner'])
const isAdmin       = checkRole(['superadmin'])
const isChauffeur   = checkExactRole(['chauffeur'])
const isComptable   = checkExactRole(['comptable'])

// Accès module comptable : comptable + owner + superadmin
const canAccessComptable = (req, res, next) => {
  const userRole = normalizeRole(req.user?.role)
  if (!userRole) return res.status(401).json({ error: 'Non authentifié' })
  if (!['comptable', 'owner', 'superadmin'].includes(userRole)) {
    return res.status(403).json({
      error: 'Accès refusé',
      message: 'Réservé aux comptables et propriétaires',
      votre_role: userRole,
    })
  }
  req.user.role = userRole
  next()
}

// Accès transport : logisticien + owner UNIQUEMENT (gerant exclu)
const isTransport = (req, res, next) => {
  const userRole = normalizeRole(req.user?.role)
  if (!userRole) return res.status(401).json({ error: 'Non authentifié' })
  const allowed = ['logisticien', 'owner', 'superadmin'].includes(userRole)
  if (!allowed) {
    return res.status(403).json({
      error: 'Accès refusé',
      message: 'Réservé aux logisticiens et propriétaires',
      votre_role: userRole,
    })
  }
  req.user.role = userRole
  next()
}

// Gestion des employés : owner (gérants/logisticiens) + gérant (pompistes) + logisticien (chauffeurs)
const canManageEmployes = (req, res, next) => {
  const userRole = normalizeRole(req.user?.role)
  if (!userRole) return res.status(401).json({ error: 'Non authentifié' })
  if (!['owner', 'gerant', 'logisticien', 'superadmin'].includes(userRole)) {
    return res.status(403).json({
      error: 'Accès refusé',
      message: 'Réservé aux propriétaires, gérants et logisticiens',
      votre_role: userRole,
    })
  }
  req.user.role = userRole
  next()
}

module.exports = {
  checkRole,
  checkExactRole,
  isPompiste,
  isManager,
  isOwner,
  isAdmin,
  isChauffeur,
  isComptable,
  isTransport,
  canManageEmployes,
  canAccessComptable,
}
