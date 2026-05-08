const express = require('express')
const cors = require('cors')
require('dotenv').config()
require('./config/database')

const authRoutes = require('./routes/auth')

const app = express()

app.use(cors())
app.use(express.json())

app.get('/', (req, res) => {
  res.json({ message: '⛽ Fuelo API — En ligne', status: 'OK' })
})

app.use('/api/auth', authRoutes)

const stockRoutes = require('./routes/stock') 

app.use('/api/stock', stockRoutes)

const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`⛽ Fuelo démarré sur le port ${PORT}`)
})