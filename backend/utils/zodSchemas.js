// ================================================
// FUELO V2 — Schémas de validation Zod
// ================================================

const { z } = require('zod')

// ── Schémas ──────────────────────────────────────────

const registerSchema = z.object({
  nom:         z.string().min(2,  'Nom minimum 2 caractères').max(100),
  email:       z.string().email('Email invalide'),
  password:    z.string().min(6,  'Mot de passe minimum 6 caractères').max(100),
  nom_station: z.string().min(2,  'Nom station minimum 2 caractères').max(150).optional(),
})

const loginSchema = z.object({
  email:    z.string().email('Email invalide'),
  password: z.string().min(1, 'Mot de passe requis'),
})

const venteSchema = z.object({
  type:        z.enum(['essence', 'gasoil'], { errorMap: () => ({ message: 'Type doit être essence ou gasoil' }) }),
  litres:      z.number({ invalid_type_error: 'Litres doit être un nombre' }).positive('Litres doit être supérieur à 0'),
  montant_gnf: z.number({ invalid_type_error: 'Montant doit être un nombre' }).positive('Montant doit être supérieur à 0'),
})

const livraisonSchema = z.object({
  type:     z.enum(['essence', 'gasoil'], { errorMap: () => ({ message: 'Type doit être essence ou gasoil' }) }),
  quantite: z.number({ invalid_type_error: 'Quantité doit être un nombre' }).positive('Quantité doit être supérieure à 0'),
})

const employeSchema = z.object({
  nom:      z.string().min(2, 'Nom minimum 2 caractères').max(100),
  email:    z.string().email('Email invalide'),
  password: z.string().min(6, 'Mot de passe minimum 6 caractères').max(100),
  role:     z.enum(['pompiste', 'gerant', 'manager', 'owner', 'superadmin']).optional(),
})

const stationSchema = z.object({
  nom:           z.string().min(2).max(150).optional(),
  adresse:       z.string().max(255).optional(),
  ville:         z.string().max(100).optional(),
  pays:          z.string().max(100).optional(),
  seuil_essence: z.number().positive().optional(),
  seuil_gasoil:  z.number().positive().optional(),
})

const nouvelleStationSchema = z.object({
  nom:           z.string().min(2, 'Nom minimum 2 caractères').max(150),
  adresse:       z.string().max(255).optional(),
  ville:         z.string().max(100).default('Conakry'),
  pays:          z.string().max(100).default('Guinée'),
  seuil_essence: z.number().positive().default(300),
  seuil_gasoil:  z.number().positive().default(300),
})

const changerStationSchema = z.object({
  station_id: z.number({ invalid_type_error: 'station_id doit être un nombre' }).positive(),
})

// ── Middleware validate ───────────────────────────────
const validate = (schema) => (req, res, next) => {
  try {
    req.body = schema.parse(req.body)
    next()
  } catch (err) {
    const details = err.errors?.map(e => ({
      champ:   e.path.join('.'),
      message: e.message,
    }))
    return res.status(400).json({
      error:   'Données invalides',
      details,
    })
  }
}

module.exports = {
  validate,
  registerSchema,
  loginSchema,
  venteSchema,
  livraisonSchema,
  employeSchema,
  stationSchema,
  nouvelleStationSchema,
  changerStationSchema,
}
