import express from "express"
import { executeQuery } from "../config/database.js"

const router = express.Router()

// Ruta de prueba para verificar que la API funciona
router.get("/test", async (req, res) => {
  try {
    console.log('✅ /api/clients/test route is working!')
    res.json({ 
      success: true,
      message: 'Clients API is working!',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error in test route:', error)
    res.status(500).json({ error: 'Test route failed' })
  }
})

// Crear cliente Y usuario
router.post("/", async (req, res) => {
  try {
    const { 
      nombre_cliente, 
      apellido_cliente, 
      correo_cliente, 
      telefono_cliente, 
      direccion_cliente, 
      nacionalidad,
      contraseña_usuario 
    } = req.body

    console.log('📝 Received data for client/user creation:', { 
      nombre_cliente, 
      apellido_cliente, 
      correo_cliente,
      tiene_contraseña: !!contraseña_usuario 
    })

    // 1. Verificar si el cliente ya existe
    const existingClient = await executeQuery(
      'SELECT id_cliente FROM cliente WHERE correo_cliente = ?',
      [correo_cliente]
    )

    let clientId;

    if (existingClient.length > 0) {
      // Cliente ya existe
      clientId = existingClient[0].id_cliente
      console.log('✅ Client already exists:', clientId)
    } else {
      // Crear nuevo cliente
      const clientResult = await executeQuery(
        `INSERT INTO cliente (nombre_cliente, apellido_cliente, correo_cliente, telefono_cliente, direccion_cliente, nacionalidad) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [nombre_cliente, apellido_cliente, correo_cliente, telefono_cliente, direccion_cliente || '', nacionalidad || 'Colombiana']
      )

      clientId = clientResult.insertId
      console.log('✅ New client created:', clientId)
    }

    // 2. Verificar si el usuario ya existe
    const existingUser = await executeQuery(
      'SELECT id_usuario FROM usuario WHERE correo_usuario = ?',
      [correo_cliente]
    )

    let userId;

    if (existingUser.length > 0) {
      // Usuario ya existe
      userId = existingUser[0].id_usuario
      console.log('✅ User already exists:', userId)
      
      // Actualizar contraseña si se proporcionó una nueva
      if (contraseña_usuario) {
        await executeQuery(
          'UPDATE usuario SET contraseña_usuario = ? WHERE id_usuario = ?',
          [contraseña_usuario, userId]
        )
        console.log('✅ Password updated for user:', userId)
      }
    } else {
      // Crear nuevo usuario
      const userResult = await executeQuery(
        `INSERT INTO usuario (correo_usuario, usuario_acceso, contraseña_usuario, estado_usuario, fecha_registro) 
         VALUES (?, "Cliente", ?, "Activo", CURDATE())`,
        [correo_cliente, contraseña_usuario || '1234']
      )

      userId = userResult.insertId
      console.log('✅ New user created:', userId)
    }

    res.json({ 
      success: true,
      message: 'Cliente y usuario procesados exitosamente',
      client_id: clientId,
      user_id: userId,
      status: existingClient.length > 0 ? 'existing_client' : 'new_client',
      user_status: existingUser.length > 0 ? 'existing_user' : 'new_user'
    })

  } catch (error) {
    console.error('❌ Error creating client and user:', error)
    res.status(500).json({ 
      success: false,
      error: 'Error interno del servidor',
      details: error.message 
    })
  }
})

// Obtener todos los clientes
router.get("/", async (req, res) => {
  try {
    console.log('📋 Fetching all clients')
    const clients = await executeQuery(`
      SELECT id_cliente, nombre_cliente, apellido_cliente, correo_cliente, 
             telefono_cliente, direccion_cliente, nacionalidad 
      FROM cliente 
      ORDER BY nombre_cliente
    `)
    
    console.log(`✅ Found ${clients.length} clients`)
    res.json(clients)
  } catch (error) {
    console.error('Error fetching clients:', error)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
})

// Obtener cliente por ID
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params
    const clients = await executeQuery(
      'SELECT * FROM cliente WHERE id_cliente = ?',
      [id]
    )
    
    if (clients.length === 0) {
      return res.status(404).json({ error: 'Cliente no encontrado' })
    }
    
    res.json(clients[0])
  } catch (error) {
    console.error('Error fetching client:', error)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
})

// Actualizar cliente
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params
    const { nombre_cliente, apellido_cliente, correo_cliente, telefono_cliente, direccion_cliente, nacionalidad } = req.body

    await executeQuery(
      `UPDATE cliente 
       SET nombre_cliente = ?, apellido_cliente = ?, correo_cliente = ?, 
           telefono_cliente = ?, direccion_cliente = ?, nacionalidad = ?
       WHERE id_cliente = ?`,
      [nombre_cliente, apellido_cliente, correo_cliente, telefono_cliente, direccion_cliente, nacionalidad, id]
    )

    res.json({ message: 'Cliente actualizado exitosamente' })
  } catch (error) {
    console.error('Error updating client:', error)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
})

// Eliminar cliente
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params

    await executeQuery(
      'DELETE FROM cliente WHERE id_cliente = ?',
      [id]
    )

    res.json({ message: 'Cliente eliminado exitosamente' })
  } catch (error) {
    console.error('Error deleting client:', error)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
})

export default router