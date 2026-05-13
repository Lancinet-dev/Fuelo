// ================================================
// FUELO V2 — Logger Winston (production ready)
// ================================================

const winston = require('winston')
const path    = require('path')

const { combine, timestamp, printf, colorize, errors } = winston.format

// Format console
const consoleFormat = printf(({ level, message, timestamp, stack }) => {
  return `${timestamp} [${level}] ${stack || message}`
})

// Format fichier
const fileFormat = printf(({ level, message, timestamp, stack, ...meta }) => {
  return JSON.stringify({ timestamp, level, message, stack, ...meta })
})

const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'warn' : 'debug',
  format: combine(
    errors({ stack: true }),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' })
  ),
  transports: [
    // Console — couleurs en dev
    new winston.transports.Console({
      format: combine(colorize(), consoleFormat)
    }),
    // Fichier erreurs
    new winston.transports.File({
      filename: path.join(__dirname, '../logs/error.log'),
      level: 'error',
      format: fileFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // Fichier toutes les logs
    new winston.transports.File({
      filename: path.join(__dirname, '../logs/combined.log'),
      format: fileFormat,
      maxsize: 5242880,
      maxFiles: 5,
    }),
  ],
})

module.exports = logger