import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import { executeQuery } from "../config/database.js"
import { asyncHandler } from "../middleware/errorHandler.js"

// Generar tokens JWT
const generateTokens = (userId, email, role) => {
  const accessToken = jwt.sign(
    { userId, email, role }, 
    process.env.JWT_SECRET, 
    { expiresIn: '24h' }
  )
  
  const refreshToken = jwt.sign(
    { userId, email, role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  )

  return { accessToken, refreshToken }
}

// Registro de usuario - ADAPTADO A TU ESQUEMA
export const register = asyncHandler(async (req, res) => {
  console.log('📝 Register body:', req.body)
  
  const {
    nombre,
    email,
    password,
    telefono,
    direccion,
    nacionalidad
  } = req.body

  // Verificar campos requeridos básicos
  if (!nombre || !email || !password) {
    return res.status(400).json({
      error: "Nombre, email y contraseña son requeridos",
      code: "MISSING_FIELDS",
    })
  }
  
  // ... el resto del código
  // Verificar si el usuario ya existe
  const existingUser = await executeQuery(
    "SELECT id_usuario FROM usuario WHERE correo_usuario = ?",
    [email]
  )

  if (existingUser.length > 0) {
    return res.status(409).json({
      error: "Ya existe un usuario con ese email",
      code: "USER_EXISTS",
    })
  }

  // Encriptar contraseña
  const hashedPassword = await bcrypt.hash(password, 10)

  // Insertar en cliente (tu esquema real)
  const clienteResult = await executeQuery(
    `INSERT INTO cliente (nombre_cliente, apellido_cliente, correo_cliente, telefono_cliente, direccion_cliente, nacionalidad) 
     VALUES (?, '', ?, ?, ?, ?)`,
    [nombre, email, telefono, direccion, nacionalidad]
  )

  const clienteId = clienteResult.insertId

  // Insertar en usuario (tu esquema real)
  await executeQuery(
    `INSERT INTO usuario (correo_usuario, usuario_acceso, contraseña_usuario, estado_usuario, fecha_registro) 
     VALUES (?, 'Cliente', ?, 'Activo', CURDATE())`,
    [email, hashedPassword.substring(0, 4)] // Tu esquema usa contraseña de 4 chars
  )

  // Generar tokens
  const { accessToken, refreshToken } = generateTokens(clienteId, email, 'Cliente')

  res.status(201).json({
    message: "Usuario registrado exitosamente",
    user: {
      id: clienteId,
      name: nombre,
      email: email,
      role: 'Cliente',
      phone: telefono
    },
    tokens: {
      accessToken,
      refreshToken,
    },
  })
})

// Inicio de sesión - ADAPTADO A TU ESQUEMA
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body

  // Buscar usuario en tu esquema real
  const users = await executeQuery(
    `SELECT u.*, c.id_cliente, c.nombre_cliente, c.apellido_cliente, c.telefono_cliente
     FROM usuario u 
     LEFT JOIN cliente c ON u.correo_usuario = c.correo_cliente
     WHERE u.correo_usuario = ? AND u.estado_usuario = 'Activo'`,
    [email]
  )

  if (!users.length) {
    return res.status(401).json({
      error: "Credenciales inválidas",
      code: "INVALID_CREDENTIALS",
    })
  }

  const user = users[0]

  // Verificar contraseña (adaptado a tu esquema de 4 caracteres)
  const isValidPassword = password.substring(0, 4) === user.contraseña_usuario
  if (!isValidPassword) {
    return res.status(401).json({
      error: "Credenciales inválidas",
      code: "INVALID_CREDENTIALS",
    })
  }

  // Determinar rol basado en usuario_acceso
  const role = user.usuario_acceso === 'Empleado' ? 'Empleado' : 'Cliente'

  // Generar tokens
  const { accessToken, refreshToken } = generateTokens(user.id_cliente || user.id_usuario, email, role)

  res.json({
    message: "Inicio de sesión exitoso",
    user: {
      id: user.id_cliente || user.id_usuario,
      name: user.nombre_cliente || 'Usuario',
      email: user.correo_usuario,
      role: role,
      phone: user.telefono_cliente
    },
    tokens: {
      accessToken,
      refreshToken,
    },
  })
})

// Cerrar sesión
export const logout = asyncHandler(async (req, res) => {
  res.json({
    message: "Sesión cerrada exitosamente",
  })
})

// Refrescar token
export const refreshToken = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body

  if (!refreshToken) {
    return res.status(401).json({
      error: "Refresh token requerido",
      code: "NO_REFRESH_TOKEN",
    })
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET)
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(
      decoded.userId, 
      decoded.email, 
      decoded.role
    )

    res.json({
      tokens: {
        accessToken,
        refreshToken: newRefreshToken,
      },
    })
  } catch (error) {
    res.status(401).json({
      error: "Refresh token inválido",
      code: "INVALID_REFRESH_TOKEN",
    })
  }
})

// Verificar token
export const verifyToken = asyncHandler(async (req, res) => {
  res.json({
    message: "Token válido",
    user: req.user,
  })
})

// Cambiar contraseña
export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body
  const userId = req.user.id

  // Obtener usuario actual
  const users = await executeQuery(
    "SELECT contraseña_usuario FROM usuario WHERE correo_usuario = ?",
    [req.user.email]
  )

  if (!users.length) {
    return res.status(404).json({
      error: "Usuario no encontrado",
      code: "USER_NOT_FOUND",
    })
  }

  // Verificar contraseña actual
  const isValidPassword = currentPassword.substring(0, 4) === users[0].contraseña_usuario
  if (!isValidPassword) {
    return res.status(400).json({
      error: "Contraseña actual incorrecta",
      code: "INVALID_CURRENT_PASSWORD",
    })
  }

  // Actualizar contraseña (primeros 4 caracteres)
  await executeQuery(
    "UPDATE usuario SET contraseña_usuario = ? WHERE correo_usuario = ?",
    [newPassword.substring(0, 4), req.user.email]
  )

  res.json({
    message: "Contraseña actualizada exitosamente",
  })
})