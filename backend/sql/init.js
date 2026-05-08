const fs = require('fs')
const path = require('path')
const pool = require('../config/database')

const initDB = async () => {
  try {
   const sql = fs.readFileSync(path.resolve('sql', 'schema.sql'), 'utf8')
    await pool.query(sql)
    console.log('✅ Tables créées avec succès')
    process.exit(0)
  } catch (err) {
    console.error('❌ Erreur:', err.message)
    process.exit(1)
      }
}

initDB()