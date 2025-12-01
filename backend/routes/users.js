import express from "express"
import { executeQuery } from "../config/database.js"
import { asyncHandler } from "../middleware/errorHandler.js"

const router = express.Router()

// Obtener todos los usuarios
router.get(
  "/",
  asyncHandler(async (req, res) => {
    console.log('📡 GET /api/users - Obteniendo todos los usuarios')
    
    try {
      const users = await executeQuery(`
        SELECT 
          u.id_usuario, 
          u.correo_usuario, 
          u.usuario_acceso, 
          u.estado_usuario, 
          u.fecha_registro,
          u.contraseña_usuario,
          c.id_cliente,
          c.nombre_cliente, 
          c.apellido_cliente, 
          c.telefono_cliente,
          c.direccion_cliente,
          c.nacionalidad,
          e.id_empleado,
          e.nombre_empleado,
          e.apellido_empleado,
          e.cargo_empleado,
          e.telefono_empleado,
          e.fecha_contratacion
        FROM usuario u
        LEFT JOIN cliente c ON u.correo_usuario = c.correo_cliente
        LEFT JOIN empleado e ON u.correo_usuario = e.correo_empleado
        ORDER BY u.fecha_registro DESC
      `)

      console.log(`✅ Usuarios encontrados en BD: ${users.length}`)
      
      const formattedUsers = users.map(user => ({
        id: user.id_usuario.toString(),
        email: user.correo_usuario,
        role: user.usuario_acceso,
        status: user.estado_usuario,
        registration_date: user.fecha_registro,
        name: user.nombre_cliente || user.nombre_empleado || '',
        last_name: user.apellido_cliente || user.apellido_empleado || '',
        phone: user.telefono_cliente || user.telefono_empleado || '',
        address: user.direccion_cliente || '',
        nationality: user.nacionalidad || '',
        employee_id: user.id_empleado,
        client_id: user.id_cliente,
        position: user.cargo_empleado || '',
        hire_date: user.fecha_contratacion || ''
      }))

      console.log('📊 Usuarios formateados:', formattedUsers)

      res.json({
        success: true,
        message: "Usuarios obtenidos correctamente",
        count: formattedUsers.length,
        users: formattedUsers
      })
    } catch (error) {
      console.error('❌ Error al obtener usuarios:', error)
      throw error
    }
  })
)

// Obtener usuario por ID
router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const { id } = req.params
    console.log(`📡 GET /api/users/${id} - Obteniendo usuario por ID`)

    const users = await executeQuery(
      `
      SELECT 
        u.id_usuario, 
        u.correo_usuario, 
        u.usuario_acceso, 
        u.estado_usuario, 
        u.fecha_registro,
        u.contraseña_usuario,
        c.id_cliente,
        c.nombre_cliente, 
        c.apellido_cliente, 
        c.telefono_cliente, 
        c.direccion_cliente, 
        c.nacionalidad,
        e.id_empleado,
        e.nombre_empleado,
        e.apellido_empleado,
        e.cargo_empleado,
        e.telefono_empleado,
        e.fecha_contratacion
      FROM usuario u
      LEFT JOIN cliente c ON u.correo_usuario = c.correo_cliente
      LEFT JOIN empleado e ON u.correo_usuario = e.correo_empleado
      WHERE u.id_usuario = ?
    `,
      [id]
    )

    if (!users.length) {
      return res.status(404).json({
        success: false,
        error: "Usuario no encontrado",
        code: "USER_NOT_FOUND"
      })
    }

    const user = users[0]

    res.json({
      success: true,
      user: {
        id: user.id_usuario.toString(),
        email: user.correo_usuario,
        role: user.usuario_acceso,
        status: user.estado_usuario,
        registration_date: user.fecha_registro,
        password: user.contraseña_usuario,
        name: user.nombre_cliente || user.nombre_empleado || '',
        last_name: user.apellido_cliente || user.apellido_empleado || '',
        phone: user.telefono_cliente || user.telefono_empleado || '',
        address: user.direccion_cliente || '',
        nationality: user.nacionalidad || '',
        employee_id: user.id_empleado,
        client_id: user.id_cliente,
        position: user.cargo_empleado || '',
        hire_date: user.fecha_contratacion || ''
      }
    })
  })
)

// Crear nuevo usuario
router.post(
  "/",
  asyncHandler(async (req, res) => {
    const {
      email,
      role,
      password,
      name,
      last_name,
      phone,
      address,
      nationality,
      position
    } = req.body

    console.log('📡 POST /api/users - Creando usuario:', { email, role, name, last_name })

    // Validaciones básicas
    if (!email || !role) {
      return res.status(400).json({
        success: false,
        error: "Email y rol son obligatorios",
        code: "MISSING_REQUIRED_FIELDS"
      })
    }

    // Verificar si el usuario ya existe
    const existingUsers = await executeQuery(
      "SELECT id_usuario FROM usuario WHERE correo_usuario = ?",
      [email]
    )

    if (existingUsers.length > 0) {
      return res.status(409).json({
        success: false,
        error: "El usuario ya existe",
        code: "USER_ALREADY_EXISTS"
      })
    }

    // Insertar en la tabla usuario
    const userResult = await executeQuery(
      `INSERT INTO usuario (correo_usuario, usuario_acceso, contraseña_usuario, estado_usuario, fecha_registro) 
       VALUES (?, ?, ?, 'Activo', CURDATE())`,
      [email, role, password || '1234']
    )

    const userId = userResult.insertId

    // Insertar en la tabla correspondiente según el rol
    if (role === 'Cliente') {
      await executeQuery(
        `INSERT INTO cliente (nombre_cliente, apellido_cliente, correo_cliente, telefono_cliente, direccion_cliente, nacionalidad) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [name, last_name, email, phone, address, nationality]
      )
    } else if (role === 'Empleado') {
      await executeQuery(
        `INSERT INTO empleado (nombre_empleado, apellido_empleado, cargo_empleado, correo_empleado, telefono_empleado, fecha_contratacion) 
         VALUES (?, ?, ?, ?, ?, CURDATE())`,
        [name, last_name, position, email, phone]
      )
    }

    res.status(201).json({
      success: true,
      message: "Usuario creado exitosamente",
      user: {
        id: userId.toString(),
        email,
        role,
        status: 'Activo',
        name,
        last_name,
        phone,
        address,
        nationality,
        position
      }
    })
  })
)

// Actualizar usuario
router.put(
  "/:id",
  asyncHandler(async (req, res) => {
    const { id } = req.params
    const {
      email,
      role,
      status,
      name,
      last_name,
      phone,
      address,
      nationality,
      position
    } = req.body

    console.log(`📡 PUT /api/users/${id} - Actualizando usuario`)

    // Verificar si el usuario existe
    const existingUsers = await executeQuery(
      "SELECT id_usuario, correo_usuario FROM usuario WHERE id_usuario = ?",
      [id]
    )

    if (!existingUsers.length) {
      return res.status(404).json({
        success: false,
        error: "Usuario no encontrado",
        code: "USER_NOT_FOUND"
      })
    }

    const oldEmail = existingUsers[0].correo_usuario

    // Actualizar tabla usuario
    await executeQuery(
      `UPDATE usuario 
       SET correo_usuario = ?, usuario_acceso = ?, estado_usuario = ? 
       WHERE id_usuario = ?`,
      [email, role, status, id]
    )

    // Actualizar tabla correspondiente según el rol
    if (role === 'Cliente') {
      // Verificar si existe en cliente
      const clientExists = await executeQuery(
        "SELECT id_cliente FROM cliente WHERE correo_cliente = ?",
        [oldEmail]
      )

      if (clientExists.length > 0) {
        // Actualizar cliente existente
        await executeQuery(
          `UPDATE cliente 
           SET nombre_cliente = ?, apellido_cliente = ?, correo_cliente = ?, 
               telefono_cliente = ?, direccion_cliente = ?, nacionalidad = ? 
           WHERE correo_cliente = ?`,
          [name, last_name, email, phone, address, nationality, oldEmail]
        )
      } else {
        // Crear nuevo registro en cliente
        await executeQuery(
          `INSERT INTO cliente (nombre_cliente, apellido_cliente, correo_cliente, telefono_cliente, direccion_cliente, nacionalidad) 
           VALUES (?, ?, ?, ?, ?, ?)`,
          [name, last_name, email, phone, address, nationality]
        )
        
        // Eliminar de empleado si existía
        await executeQuery(
          "DELETE FROM empleado WHERE correo_empleado = ?",
          [oldEmail]
        )
      }
    } else if (role === 'Empleado') {
      // Verificar si existe en empleado
      const employeeExists = await executeQuery(
        "SELECT id_empleado FROM empleado WHERE correo_empleado = ?",
        [oldEmail]
      )

      if (employeeExists.length > 0) {
        // Actualizar empleado existente
        await executeQuery(
          `UPDATE empleado 
           SET nombre_empleado = ?, apellido_empleado = ?, cargo_empleado = ?, 
               correo_empleado = ?, telefono_empleado = ? 
           WHERE correo_empleado = ?`,
          [name, last_name, position, email, phone, oldEmail]
        )
      } else {
        // Crear nuevo registro en empleado
        await executeQuery(
          `INSERT INTO empleado (nombre_empleado, apellido_empleado, cargo_empleado, correo_empleado, telefono_empleado, fecha_contratacion) 
           VALUES (?, ?, ?, ?, ?, CURDATE())`,
          [name, last_name, position, email, phone]
        )
        
        // Eliminar de cliente si existía
        await executeQuery(
          "DELETE FROM cliente WHERE correo_cliente = ?",
          [oldEmail]
        )
      }
    }

    res.json({
      success: true,
      message: "Usuario actualizado exitosamente",
      user: {
        id: id,
        email,
        role,
        status,
        name,
        last_name,
        phone,
        address,
        nationality,
        position
      }
    })
  })
)

// Eliminar usuario
router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const { id } = req.params
    console.log(`📡 DELETE /api/users/${id} - Eliminando usuario`)

    // Obtener información del usuario antes de eliminar
    const users = await executeQuery(
      "SELECT correo_usuario, usuario_acceso FROM usuario WHERE id_usuario = ?",
      [id]
    )

    if (!users.length) {
      return res.status(404).json({
        success: false,
        error: "Usuario no encontrado",
        code: "USER_NOT_FOUND"
      })
    }

    const userEmail = users[0].correo_usuario
    const userRole = users[0].usuario_acceso

    // Eliminar de las tablas relacionadas primero
    if (userRole === 'Cliente') {
      await executeQuery(
        "DELETE FROM cliente WHERE correo_cliente = ?",
        [userEmail]
      )
    } else if (userRole === 'Empleado') {
      await executeQuery(
        "DELETE FROM empleado WHERE correo_empleado = ?",
        [userEmail]
      )
    }

    // Finalmente eliminar de la tabla usuario
    await executeQuery(
      "DELETE FROM usuario WHERE id_usuario = ?",
      [id]
    )

    res.json({
      success: true,
      message: "Usuario eliminado exitosamente"
    })
  })
)

// Cambiar estado del usuario
router.patch(
  "/:id/status",
  asyncHandler(async (req, res) => {
    const { id } = req.params
    const { status } = req.body

    console.log(`📡 PATCH /api/users/${id}/status - Cambiando estado a: ${status}`)

    if (!status || !['Activo', 'Inactivo'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: "Estado inválido",
        code: "INVALID_STATUS"
      })
    }

    const result = await executeQuery(
      "UPDATE usuario SET estado_usuario = ? WHERE id_usuario = ?",
      [status, id]
    )

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        error: "Usuario no encontrado",
        code: "USER_NOT_FOUND"
      })
    }

    res.json({
      success: true,
      message: `Usuario ${status.toLowerCase()} exitosamente`
    })
  })
)

// Ruta de prueba
router.get("/test/connection", asyncHandler(async (req, res) => {
  console.log('🔍 Probando conexión y consulta de usuarios')
  
  try {
    const testUsers = await executeQuery(`
      SELECT COUNT(*) as total_usuarios FROM usuario
    `)
    
    res.json({
      success: true,
      message: "Conexión a la base de datos exitosa",
      total_usuarios: testUsers[0].total_usuarios,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('❌ Error en prueba de conexión:', error)
    res.status(500).json({
      success: false,
      error: "Error de conexión a la base de datos",
      details: error.message
    })
  }
}))

export default router