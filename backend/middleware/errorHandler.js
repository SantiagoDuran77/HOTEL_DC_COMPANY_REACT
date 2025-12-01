export const errorHandler = (err, req, res, next) => {
  console.error("Error capturado:", {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get("User-Agent"),
    timestamp: new Date().toISOString(),
  })

  // Error de validación de MySQL
  if (err.code === "ER_DUP_ENTRY") {
    return res.status(409).json({
      error: "Ya existe un registro con estos datos",
      code: "DUPLICATE_ENTRY",
      field: err.sqlMessage?.match(/for key '(.+?)'/)?.[1] || "unknown",
    })
  }

  // Error de conexión a la base de datos
  if (err.code === "ECONNREFUSED" || err.code === "ER_ACCESS_DENIED_ERROR") {
    return res.status(503).json({
      error: "Error de conexión a la base de datos",
      code: "DATABASE_CONNECTION_ERROR",
    })
  }

  // Error de validación de entrada
  if (err.name === "ValidationError") {
    return res.status(400).json({
      error: "Datos de entrada inválidos",
      code: "VALIDATION_ERROR",
      details: err.details || err.message,
    })
  }

  // Error de JWT
  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({
      error: "Token inválido",
      code: "INVALID_TOKEN",
    })
  }

  // Error de token expirado
  if (err.name === "TokenExpiredError") {
    return res.status(401).json({
      error: "Token expirado",
      code: "TOKEN_EXPIRED",
    })
  }

  // Error de archivo muy grande
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({
      error: "Archivo demasiado grande",
      code: "FILE_TOO_LARGE",
      maxSize: "5MB",
    })
  }

  // Error genérico del servidor
  const statusCode = err.statusCode || 500
  const message = process.env.NODE_ENV === "production" ? "Error interno del servidor" : err.message

  res.status(statusCode).json({
    error: message,
    code: "INTERNAL_SERVER_ERROR",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  })
}

export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}
