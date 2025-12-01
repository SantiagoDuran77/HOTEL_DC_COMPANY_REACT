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
        u.estado_usuario
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
      message: 'Error interno del servidor al obtener empleados'
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
        u.estado_usuario
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
      message: 'Error interno del servidor al obtener el empleado'
    })
  }
})

// POST /api/employees - Crear nuevo empleado
router.post("/", authenticateToken, async (req, res) => {
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

    // Validaciones básicas
    if (!nombre_empleado || !apellido_empleado || !correo_empleado || !cargo_empleado) {
      return res.status(400).json({
        success: false,
        message: 'Nombre, apellido, correo y cargo son requeridos'
      })
    }

    // Verificar si el correo ya existe
    const [existingUsers] = await db.execute(
      'SELECT * FROM usuario WHERE correo_usuario = ?',
      [correo_empleado]
    )

    if (existingUsers.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Ya existe un usuario con este correo electrónico'
      })
    }

    // Iniciar transacción
    await db.execute('START TRANSACTION')

    try {
      // 1. Crear usuario primero
      const passwordToStore = contraseña ? contraseña.substring(0, 4) : '1234'
      
      const [userResult] = await db.execute(
        `INSERT INTO usuario (correo_usuario, usuario_acceso, contraseña_usuario, estado_usuario, fecha_registro) 
         VALUES (?, 'Empleado', ?, 'Activo', NOW())`,
        [correo_empleado, passwordToStore]
      )

      // 2. Crear empleado
      const [employeeResult] = await db.execute(
        `INSERT INTO empleado (nombre_empleado, apellido_empleado, correo_empleado, telefono_empleado, cargo_empleado, fecha_contratacion) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          nombre_empleado,
          apellido_empleado,
          correo_empleado,
          telefono_empleado || null,
          cargo_empleado,
          fecha_contratacion || new Date()
        ]
      )

      await db.execute('COMMIT')

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
          u.estado_usuario
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
      await db.execute('ROLLBACK')
      throw error
    }

  } catch (error) {
    console.error('❌ Error creating employee:', error)
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor al crear el empleado'
    })
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
        telefono_empleado,
        cargo_empleado,
        fecha_contratacion,
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
        u.estado_usuario
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
      message: 'Error interno del servidor al actualizar el empleado'
    })
  }
})

// DELETE /api/employees/:id - Eliminar empleado
router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params

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

    // Iniciar transacción
    await db.execute('START TRANSACTION')

    try {
      // 1. Eliminar empleado
      await db.execute('DELETE FROM empleado WHERE id_empleado = ?', [id])

      // 2. Eliminar usuario (si no está siendo usado en otras tablas)
      // Primero verificamos si el correo está siendo usado en otras tablas
      const [reservas] = await db.execute(
        'SELECT COUNT(*) as count FROM reserva WHERE id_empleado = ?',
        [id]
      )

      if (reservas[0].count === 0) {
        await db.execute('DELETE FROM usuario WHERE correo_usuario = ?', [employee.correo_empleado])
      }

      await db.execute('COMMIT')

      res.json({
        success: true,
        message: 'Empleado eliminado exitosamente'
      })

    } catch (error) {
      await db.execute('ROLLBACK')
      throw error
    }

  } catch (error) {
    console.error('❌ Error deleting employee:', error)
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor al eliminar el empleado'
    })
  }
})

// PATCH /api/employees/:id/status - Cambiar estado del empleado
router.patch("/:id/status", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params
    const { status } = req.body

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

    // Actualizar estado en la tabla usuario
    await db.execute(
      'UPDATE usuario SET estado_usuario = ? WHERE correo_usuario = ?',
      [status, employee.correo_empleado]
    )

    res.json({
      success: true,
      message: `Estado del empleado actualizado a ${status}`
    })

  } catch (error) {
    console.error('❌ Error updating employee status:', error)
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor al actualizar el estado'
    })
  }
})

export default router