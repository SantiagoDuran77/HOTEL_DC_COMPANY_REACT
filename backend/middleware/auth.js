import jwt from "jsonwebtoken"
import bcrypt from "bcryptjs"
import { executeQuery } from "../config/database.js"

const JWT_SECRET = process.env.JWT_SECRET || 'mi_clave_secreta_muy_segura_123456_hotel_dc_company'

// Funciones de encriptación
export const hashPassword = async (password) => {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
};

export const comparePassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};

export const generateRandomPassword = () => {
  return Math.random().toString(36).slice(-8) + 'A1!';
};

export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"]
    const token = authHeader && authHeader.split(" ")[1]

    console.log('🔐 Auth middleware - Token:', token ? `Present (${token.substring(0, 20)}...)` : 'Missing')

    if (!token) {
      return res.status(401).json({
        error: "Usuario no autenticado",
        code: "NOT_AUTHENTICATED",
      })
    }

    const decoded = jwt.verify(token, JWT_SECRET)
    console.log('🔐 Decoded token:', decoded)

    // Buscar usuario en la base de datos usando executeQuery
    let user = null
    
    // Buscar primero en empleados
    const empleadoRows = await executeQuery(
      `SELECT e.*, u.usuario_acceso, u.estado_usuario 
       FROM empleado e 
       JOIN usuario u ON e.correo_empleado = u.correo_usuario 
       WHERE u.id_usuario = ?`,
      [decoded.userId]
    )

    if (empleadoRows.length > 0) {
      user = empleadoRows[0]
      user.role = 'empleado'
      user.tipo_usuario = 'empleado'
      console.log('👤 Found employee user:', user)
    } else {
      // Buscar en clientes
      const clienteRows = await executeQuery(
        `SELECT c.*, u.usuario_acceso, u.estado_usuario 
         FROM cliente c 
         JOIN usuario u ON c.correo_cliente = u.correo_usuario 
         WHERE u.id_usuario = ?`,
        [decoded.userId]
      )

      if (clienteRows.length > 0) {
        user = clienteRows[0]
        user.role = 'cliente'
        user.tipo_usuario = 'cliente'
        console.log('👤 Found client user:', user)
      }
    }

    if (!user) {
      return res.status(401).json({
        error: "Usuario no encontrado",
        code: "USER_NOT_FOUND",
      })
    }

    if (user.estado_usuario !== 'Activo') {
      return res.status(401).json({
        error: "Usuario inactivo",
        code: "USER_INACTIVE",
      })
    }

    req.user = {
      id: user.id_usuario,
      email: user.correo_empleado || user.correo_cliente,
      name: `${user.nombre_empleado || user.nombre_cliente} ${user.apellido_empleado || user.apellido_cliente}`,
      role: user.tipo_usuario,
      usuario_acceso: user.usuario_acceso,
      cargo_empleado: user.cargo_empleado,
      id_empleado: user.id_empleado,
      id_cliente: user.id_cliente,
      ...user
    }

    console.log('✅ User authenticated:', {
      id: req.user.id,
      email: req.user.email,
      role: req.user.role,
      usuario_acceso: req.user.usuario_acceso,
      cargo_empleado: req.user.cargo_empleado
    })

    next()
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        error: "Token expirado",
        code: "TOKEN_EXPIRED",
      })
    }

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        error: "Token inválido",
        code: "INVALID_TOKEN",
      })
    }

    console.error("Error en autenticación:", error)
    res.status(500).json({
      error: "Error interno del servidor",
      code: "INTERNAL_ERROR",
    })
  }
}

export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    console.log('🔐 Authorize roles check:', {
      user: req.user,
      allowedRoles: roles,
      userRole: req.user?.role,
      usuario_acceso: req.user?.usuario_acceso,
      cargo_empleado: req.user?.cargo_empleado
    })

    if (!req.user) {
      return res.status(401).json({
        error: "Usuario no autenticado",
        code: "NOT_AUTHENTICATED",
      })
    }

    // Para empleados, verificar el usuario_acceso
    if (req.user.usuario_acceso === 'Empleado' || req.user.role === 'empleado') {
      // Cualquier empleado tiene permisos
      const hasPermission = roles.some(role => 
        role.toLowerCase() === 'empleado' || role.toLowerCase() === 'admin'
      )

      if (hasPermission) {
        console.log('✅ Employee authorized with cargo:', req.user.cargo_empleado)
        return next()
      }
    }

    // Para clientes, solo permitir si explícitamente se permite 'cliente'
    if (req.user.usuario_acceso === 'Cliente' && roles.includes('cliente')) {
      console.log('✅ Client authorized')
      return next()
    }

    console.log('❌ User not authorized. Required:', roles, 'User:', {
      usuario_acceso: req.user.usuario_acceso,
      cargo_empleado: req.user.cargo_empleado
    })
    
    return res.status(403).json({
      error: "No tienes permisos para realizar esta acción",
      code: "INSUFFICIENT_PERMISSIONS",
      requiredRoles: roles,
      userRole: req.user.usuario_acceso,
      userCargo: req.user.cargo_empleado
    })
  }
}

export const generateTokens = (userId) => {
  const accessToken = jwt.sign({ userId }, JWT_SECRET, { expiresIn: '24h' })
  const refreshToken = jwt.sign({ userId }, JWT_SECRET + 'refresh', { expiresIn: '7d' })

  return { accessToken, refreshToken }
}