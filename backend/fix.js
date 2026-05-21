const pool = require('./config/database')
async function fix() {
  await pool.query("UPDATE users SET role = 'manager' WHERE id = 15")
  console.log('OK thierno → manager')
  process.exit(0)
}
fix()