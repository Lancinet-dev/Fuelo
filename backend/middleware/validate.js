const validateRegister = (req, res, next) => {
  const { nom, email, password } = req.body

  if (!nom || nom.trim() === '') {
    return res.status(400).json({ error: 'Le nom est obligatoire' })
  }
  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Email invalide' })
  }
  if (!password || password.length < 6) {
    return res.status(400).json({ error: 'Mot de passe minimum 6 caractères' })
  }
  next()
}

const validateVente = (req, res, next) => {
  const { type, litres, montant_gnf } = req.body

  if (!['essence', 'gasoil'].includes(type)) {
    return res.status(400).json({ error: 'Type doit être essence ou gasoil' })
  }
  if (!litres || litres <= 0) {
    return res.status(400).json({ error: 'Litres doit être supérieur à 0' })
  }
  if (!montant_gnf || montant_gnf <= 0) {
    return res.status(400).json({ error: 'Montant doit être supérieur à 0' })
  }
  next()
}

const validateLivraison = (req, res, next) => {
  const { type, quantite } = req.body

  if (!['essence', 'gasoil'].includes(type)) {
    return res.status(400).json({ error: 'Type doit être essence ou gasoil' })
  }
  if (!quantite || quantite <= 0) {
    return res.status(400).json({ error: 'Quantité doit être supérieure à 0' })
  }
  next()
}

module.exports = { validateRegister, validateVente, validateLivraison }