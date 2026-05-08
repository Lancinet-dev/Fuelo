const express = require('express')
const cors = require('cors')
require('dotenv').config()
require('./config/database')

const { limiterGeneral, limiterAuth } = require('./middleware/rateLimit')
const errorHandler = require('./middleware/errorHandler')
const authRoutes = require('./routes/auth')
const stockRoutes = require('./routes/stock')
const venteRoutes = require('./routes/ventes')
const alerteRoutes = require('./routes/alertes')
const statsRoutes = require('./routes/stats')

const app = express()

// Middlewares globaux
app.use(cors())
app.use(express.json())
app.use(limiterGeneral)

// Routes
app.use('/api/auth', limiterAuth, authRoutes)
app.use('/api/stock', limiterGeneral, stockRoutes)
app.use('/api/ventes', venteRoutes)
app.use('/api/alertes', alerteRoutes)
app.use('/api/stats', statsRoutes)

// Route test
app.get('/', (req, res) => {
  res.json({ message: '⛽ Fuelo API — En ligne', status: 'OK' })
})

// Gestion erreurs — toujours en dernier
app.use(errorHandler)

const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`⛽ Fuelo démarré sur le port ${PORT}`)
})