const pool = require('./config/database')
pool.query("UPDATE users SET role = 'manager' WHERE id = 15")
  .then(() => { console.log('✅ Thierno est maintenant Gérant'); process.exit(0) })
  .catch(e => { console.error(e.message); process.exit(1) })