import express from "express"
import db from "../config/database.js"
import { authenticateToken } from "../middleware/auth.js"

const router = express.Router()

// GET /api/employees - Obtener todos los empleados
router.get("/", authenticateToken, async (req, res) => {
  try {
    console.log('📡 Fetching employees from database...')
    
    const [employees] = await db.execute(`
      SELECT 
        e.id_empleado,
        e.nombre_empleado,
        e.apellido_empleado,
        e.correo_empleado,
        e.telefono_empleado,
        e.cargo_empleado,
        e.fecha_contratacion,
        COALESCE(u.estado_usuario, 'Activo') as estado_usuario
      FROM empleado e
      LEFT JOIN usuario u ON e.correo_empleado = u.correo_usuario
      ORDER BY e.id_empleado
    `)

    console.log(`✅ Found ${employees.length} employees`)

    res.json({
      success: true,
      employees: employees
    })

  } catch (error) {
    console.error('❌ Error fetching employees:', error)
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor al obtener empleados',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
})

// GET /api/employees/:id - Obtener empleado por ID
router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params

    const [employees] = await db.execute(`
      SELECT 
        e.id_empleado,
        e.nombre_empleado,
        e.apellido_empleado,
        e.correo_empleado,
        e.telefono_empleado,
        e.cargo_empleado,
        e.fecha_contratacion,
        COALESCE(u.estado_usuario, 'Activo') as estado_usuario
      FROM empleado e
      LEFT JOIN usuario u ON e.correo_empleado = u.correo_usuario
      WHERE e.id_empleado = ?
    `, [id])

    if (employees.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Empleado no encontrado'
      })
    }

    res.json({
      success: true,
      employee: employees[0]
    })

  } catch (error) {
    console.error('❌ Error fetching employee:', error)
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor al obtener el empleado',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
})

// POST /api/employees - Crear nuevo empleado
router.post("/", authenticateToken, async (req, res) => {
  let connection
  try {
    const {
      nombre_empleado,
      apellido_empleado,
      correo_empleado,
      telefono_empleado,
      cargo_empleado,
      fecha_contratacion,
      contraseña
    } = req.body

    console.log('📝 Creating employee with data:', req.body)

    // Validaciones básicas
    if (!nombre_empleado || !apellido_empleado || !correo_empleado || !cargo_empleado) {
      return res.status(400).json({
        success: false,
        message: 'Nombre, apellido, correo y cargo son requeridos'
      })
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(correo_empleado)) {
      return res.status(400).json({
        success: false,
        message: 'Formato de correo electrónico inválido'
      })
    }

    // Obtener conexión del pool
    connection = await db.getConnection()

    // Iniciar transacción
    await connection.beginTransaction()

    try {
      // 1. Verificar si el correo ya existe en usuario
      const [existingUsers] = await connection.execute(
        'SELECT * FROM usuario WHERE correo_usuario = ?',
        [correo_empleado]
      )

      if (existingUsers.length > 0) {
        await connection.rollback()
        return res.status(400).json({
          success: false,
          message: 'Ya existe un usuario con este correo electrónico'
        })
      }

      // 2. Verificar si el correo ya existe en empleado
      const [existingEmployees] = await connection.execute(
        'SELECT * FROM empleado WHERE correo_empleado = ?',
        [correo_empleado]
      )

      if (existingEmployees.length > 0) {
        await connection.rollback()
        return res.status(400).json({
          success: false,
          message: 'Ya existe un empleado con este correo electrónico'
        })
      }

      // 3. Crear usuario primero
      const passwordToStore = contraseña ? contraseña.substring(0, 4) : '1234'
      
      console.log('Creating user with password:', passwordToStore)
      
      const [userResult] = await connection.execute(
        `INSERT INTO usuario (correo_usuario, usuario_acceso, contraseña_usuario, estado_usuario, fecha_registro) 
         VALUES (?, 'Empleado', ?, 'Activo', NOW())`,
        [correo_empleado, passwordToStore]
      )

      console.log('User created with ID:', userResult.insertId)

      // 4. Crear empleado
      const [employeeResult] = await connection.execute(
        `INSERT INTO empleado (nombre_empleado, apellido_empleado, correo_empleado, telefono_empleado, cargo_empleado, fecha_contratacion) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          nombre_empleado,
          apellido_empleado,
          correo_empleado,
          telefono_empleado || null,
          cargo_empleado,
          fecha_contratacion || new Date().toISOString().split('T')[0]
        ]
      )

      console.log('Employee created with ID:', employeeResult.insertId)

      // Confirmar transacción
      await connection.commit()

      // Obtener el empleado creado
      const [newEmployee] = await db.execute(`
        SELECT 
          e.id_empleado,
          e.nombre_empleado,
          e.apellido_empleado,
          e.correo_empleado,
          e.telefono_empleado,
          e.cargo_empleado,
          e.fecha_contratacion,
          COALESCE(u.estado_usuario, 'Activo') as estado_usuario
        FROM empleado e
        LEFT JOIN usuario u ON e.correo_empleado = u.correo_usuario
        WHERE e.id_empleado = ?
      `, [employeeResult.insertId])

      res.status(201).json({
        success: true,
        message: 'Empleado creado exitosamente',
        employee: newEmployee[0]
      })

    } catch (error) {
      await connection.rollback()
      console.error('❌ Transaction error:', error)
      throw error
    }

  } catch (error) {
    console.error('❌ Error creating employee:', error)
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor al crear el empleado',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  } finally {
    if (connection) {
      connection.release()
    }
  }
})

// PUT /api/employees/:id - Actualizar empleado
router.put("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params
    const {
      nombre_empleado,
      apellido_empleado,
      telefono_empleado,
      cargo_empleado,
      fecha_contratacion
    } = req.body

    console.log('📝 Updating employee:', id, req.body)

    // Verificar que el empleado existe
    const [existingEmployees] = await db.execute(
      'SELECT * FROM empleado WHERE id_empleado = ?',
      [id]
    )

    if (existingEmployees.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Empleado no encontrado'
      })
    }

    // Actualizar empleado
    await db.execute(
      `UPDATE empleado 
       SET nombre_empleado = ?, apellido_empleado = ?, telefono_empleado = ?, cargo_empleado = ?, fecha_contratacion = ?
       WHERE id_empleado = ?`,
      [
        nombre_empleado,
        apellido_empleado,
        telefono_empleado || null,
        cargo_empleado,
        fecha_contratacion || new Date().toISOString().split('T')[0],
        id
      ]
    )

    // Obtener el empleado actualizado
    const [updatedEmployee] = await db.execute(`
      SELECT 
        e.id_empleado,
        e.nombre_empleado,
        e.apellido_empleado,
        e.correo_empleado,
        e.telefono_empleado,
        e.cargo_empleado,
        e.fecha_contratacion,
        COALESCE(u.estado_usuario, 'Activo') as estado_usuario
      FROM empleado e
      LEFT JOIN usuario u ON e.correo_empleado = u.correo_usuario
      WHERE e.id_empleado = ?
    `, [id])

    res.json({
      success: true,
      message: 'Empleado actualizado exitosamente',
      employee: updatedEmployee[0]
    })

  } catch (error) {
    console.error('❌ Error updating employee:', error)
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor al actualizar el empleado',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
})

// DELETE /api/employees/:id - Eliminar empleado
router.delete("/:id", authenticateToken, async (req, res) => {
  let connection
  try {
    const { id } = req.params

    console.log('🗑️ Deleting employee:', id)

    // Verificar que el empleado existe
    const [existingEmployees] = await db.execute(
      'SELECT * FROM empleado WHERE id_empleado = ?',
      [id]
    )

    if (existingEmployees.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Empleado no encontrado'
      })
    }

    const employee = existingEmployees[0]

    // Obtener conexión del pool
    connection = await db.getConnection()

    // Iniciar transacción
    await connection.beginTransaction()

    try {
      // 1. Verificar si el empleado tiene reservas asociadas
      const [reservas] = await connection.execute(
        'SELECT COUNT(*) as count FROM reserva WHERE id_empleado = ?',
        [id]
      )

      if (reservas[0].count > 0) {
        await connection.rollback()
        return res.status(400).json({
          success: false,
          message: 'No se puede eliminar el empleado porque tiene reservas asociadas'
        })
      }

      // 2. Eliminar empleado
      await connection.execute('DELETE FROM empleado WHERE id_empleado = ?', [id])

      // 3. Eliminar usuario asociado
      await connection.execute('DELETE FROM usuario WHERE correo_usuario = ?', [employee.correo_empleado])

      // Confirmar transacción
      await connection.commit()

      res.json({
        success: true,
        message: 'Empleado eliminado exitosamente'
      })

    } catch (error) {
      await connection.rollback()
      console.error('❌ Transaction error:', error)
      throw error
    }

  } catch (error) {
    console.error('❌ Error deleting employee:', error)
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor al eliminar el empleado',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  } finally {
    if (connection) {
      connection.release()
    }
  }
})

// PATCH /api/employees/:id/status - Cambiar estado del empleado
router.patch("/:id/status", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params
    const { status } = req.body

    console.log('🔄 Updating employee status:', id, status)

    if (!status || !['Activo', 'Inactivo'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Estado inválido. Debe ser "Activo" o "Inactivo"'
      })
    }

    // Verificar que el empleado existe
    const [existingEmployees] = await db.execute(
      'SELECT * FROM empleado WHERE id_empleado = ?',
      [id]
    )

    if (existingEmployees.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Empleado no encontrado'
      })
    }

    const employee = existingEmployees[0]

    // Verificar si el usuario existe
    const [existingUsers] = await db.execute(
      'SELECT * FROM usuario WHERE correo_usuario = ?',
      [employee.correo_empleado]
    )

    if (existingUsers.length === 0) {
      // Crear usuario si no existe
      await db.execute(
        `INSERT INTO usuario (correo_usuario, usuario_acceso, contraseña_usuario, estado_usuario, fecha_registro) 
         VALUES (?, 'Empleado', '1234', ?, NOW())`,
        [employee.correo_empleado, status]
      )
    } else {
      // Actualizar estado en la tabla usuario
      await db.execute(
        'UPDATE usuario SET estado_usuario = ? WHERE correo_usuario = ?',
        [status, employee.correo_empleado]
      )
    }

    res.json({
      success: true,
      message: `Estado del empleado actualizado a ${status}`
    })

  } catch (error) {
    console.error('❌ Error updating employee status:', error)
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor al actualizar el estado',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
})

export default router