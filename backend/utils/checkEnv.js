// ================================================
// FUELO V2.1 — Validation variables d'environnement
// ================================================

const checkEnv = () => {
  const missing = []

  // Accepte soit DATABASE_URL (Render) soit les variables séparées (local)
  if (!process.env.DATABASE_URL) {
    const dbVars = ['DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER', 'DB_PASSWORD']
    dbVars.forEach(v => { if (!process.env[v]) missing.push(v) })
  }

  // Variables toujours requises
  const required = ['JWT_SECRET', 'JWT_EXPIRE']
  required.forEach(v => { if (!process.env[v]) missing.push(v) })

  if (missing.length > 0) {
    console.error('❌ Variables d\'environnement manquantes :')
    missing.forEach(v => console.error(`   → ${v}`))
    console.error('Ajoutez-les dans votre fichier .env et redémarrez.')
    process.exit(1)
  }

  // Optionnelle — sans elle, l'Assistant IA répond avec une erreur 503 mais le reste de l'app fonctionne
  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn('⚠️  ANTHROPIC_API_KEY absente — l\'Assistant IA Fuelo sera indisponible.')
  }

  console.log('✅ Variables d\'environnement OK')
}

module.exports = checkEnv