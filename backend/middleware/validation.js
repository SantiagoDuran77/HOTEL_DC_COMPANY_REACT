import { body, param, query, validationResult } from "express-validator"

export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: "Errores de validación",
      code: "VALIDATION_ERROR",
      details: errors.array().map((error) => ({
        field: error.path,
        message: error.msg,
        value: error.value,
      })),
    })
  }
  next()
}

// Validaciones para autenticación - CORREGIDAS
export const validateLogin = [
  body("email").isEmail().normalizeEmail().withMessage("Email debe ser válido"),
  body("password").isLength({ min: 1 }).withMessage("Contraseña es requerida"),
  handleValidationErrors,
]

export const validateRegister = [
  body("nombre").trim().isLength({ min: 2, max: 50 }).withMessage("Nombre debe tener entre 2 y 50 caracteres"),
  body("email").isEmail().normalizeEmail().withMessage("Email debe ser válido"),
  body("password").isLength({ min: 4 }).withMessage("Contraseña debe tener al menos 4 caracteres"),
  body("telefono").optional().isLength({ max: 20 }).withMessage("Teléfono no puede exceder 20 caracteres"),
  body("direccion").optional().isLength({ max: 100 }).withMessage("Dirección no puede exceder 100 caracteres"),
  body("nacionalidad").optional().isLength({ max: 30 }).withMessage("Nacionalidad no puede exceder 30 caracteres"),
  handleValidationErrors,
]

// Validaciones para reservas - ACTUALIZADAS para tu esquema
export const validateReservation = [
  body("cliente_id").isInt({ min: 1 }).withMessage("ID de cliente debe ser válido"),
  body("habitacion_id").isInt({ min: 1 }).withMessage("ID de habitación debe ser válido"),
  body("fecha_inicio").isISO8601().toDate().withMessage("Fecha de inicio debe ser válida"),
  body("fecha_fin").isISO8601().toDate().withMessage("Fecha de fin debe ser válida"),
  handleValidationErrors,
]

// Validaciones para habitaciones - ACTUALIZADAS para tu esquema
export const validateRoom = [
  body("numero_habitacion").isInt({ min: 1 }).withMessage("Número de habitación debe ser válido"),
  body("tipo_habitacion")
    .isIn(["Sencilla", "Doble", "Suite"])
    .withMessage("Tipo de habitación debe ser: Sencilla, Doble o Suite"),
  body("precio").isFloat({ min: 0 }).withMessage("Precio debe ser un número positivo"),
  body("estado_habitacion")
    .isIn(["Disponible", "Ocupada", "Mantenimiento"])
    .withMessage("Estado debe ser: Disponible, Ocupada o Mantenimiento"),
  handleValidationErrors,
]

// Validaciones para servicios - ACTUALIZADAS para tu esquema
export const validateService = [
  body("nombre_servicio")
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Nombre del servicio debe tener entre 2 y 50 caracteres"),
  body("precio_servicio").isFloat({ min: 0 }).withMessage("Precio debe ser un número positivo"),
  body("descripcion_servicio").optional().isLength({ max: 200 }).withMessage("Descripción no puede exceder 200 caracteres"),
  handleValidationErrors,
]

// Validaciones para parámetros de URL
export const validateId = [
  param("id").isInt({ min: 1 }).withMessage("ID debe ser un número entero positivo"),
  handleValidationErrors,
]

// Validaciones para queries de búsqueda
export const validateSearch = [
  query("page").optional().isInt({ min: 1 }).withMessage("Página debe ser un número positivo"),
  query("limit").optional().isInt({ min: 1, max: 100 }).withMessage("Límite debe ser entre 1 y 100"),
  query("search").optional().trim().isLength({ max: 100 }).withMessage("Búsqueda no puede exceder 100 caracteres"),
  handleValidationErrors,
]