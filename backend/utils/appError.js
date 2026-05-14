// ================================================
// FUELO V2.1 — AppError + asyncHandler
// ================================================

class AppError extends Error {
  constructor(message, statusCode) {
    super(message)
    this.statusCode    = statusCode
    this.status        = `${statusCode}`.startsWith('4') ? 'fail' : 'error'
    this.isOperational = true
    Error.captureStackTrace(this, this.constructor)
  }
}

// Wrapper — plus besoin de try/catch dans les controllers
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next)

module.exports = { AppError, asyncHandler }