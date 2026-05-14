// ================================================
// FUELO V2.1 — Validation variables d'environnement
// Le serveur refuse de démarrer si une var manque
// ================================================

const REQUIRED_VARS = [
  'PORT',
  'DB_HOST',
  'DB_PORT',
  'DB_NAME',
  'DB_USER',
  'DB_PASSWORD',
  'JWT_SECRET',
  'JWT_EXPIRE',
]

const checkEnv = () => {
  const missing = REQUIRED_VARS.filter(v => !process.env[v])

  if (missing.length > 0) {
    console.error('❌ Variables d\'environnement manquantes :')
    missing.forEach(v => console.error(`   → ${v}`))
    console.error('Ajoutez-les dans votre fichier .env et redémarrez.')
    process.exit(1)
  }

  console.log('✅ Variables d\'environnement OK')
}

module.exports = checkEnv