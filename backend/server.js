// ================================================
// FUELO V2 — Serveur principal
// ================================================

const express = require('express')
const cors    = require('cors')
require('dotenv').config()
require('./config/database')

const app = express()

app.use(cors())
app.use(express.json())

const {  limiterAuth } = require('./middleware/rateLimit')
app.use(limiterAuth)

const authRoutes    = require('./routes/auth')
const stockRoutes   = require('./routes/stock')
const  ventes_v2Routes   = require('./routes/ventes_v2')
const alerteRoutes  = require('./routes/alertes')
const statsRoutes   = require('./routes/stats')
const stationRoutes = require('./routes/station')
const employeRoutes = require('./routes/employes')

app.use('/api/auth',     limiterAuth, authRoutes)
app.use('/api/stock',    stockRoutes)
app.use('/api/ventes',   ventes_v2Routes)
app.use('/api/alertes',  alerteRoutes)
app.use('/api/stats',    statsRoutes)
app.use('/api/station',  stationRoutes)
app.use('/api/employes', employeRoutes)

app.get('/', (req, res) => {
  res.json({ message: '⛽ Fuelo API V2 — En ligne', version: '2.0.0', status: 'OK' })
})

const errorHandler = require('./middleware/errorHandler')
app.use(errorHandler)

const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`⛽ Fuelo V2 démarré sur le port ${PORT}`)
})