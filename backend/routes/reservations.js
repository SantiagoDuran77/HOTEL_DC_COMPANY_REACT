import express from "express"
import { executeQuery, executeTransaction } from "../config/database.js"
import { asyncHandler } from "../middleware/errorHandler.js"
import { authenticateToken } from "../middleware/auth.js"

const router = express.Router()

// 🔓 RUTA PÚBLICA PARA CREAR RESERVAS (SIN AUTENTICACIÓN)
router.post(
  "/public",
  asyncHandler(async (req, res) => {
    const { 
      room_id, 
      start_date, 
      end_date,
      services = [],
      guests = 1,
      total_price = 0,
      special_requests = null,
      nombre_cliente,
      correo_cliente,
      telefono_cliente
    } = req.body

    console.log('📝 Creando reserva pública:', { 
      room_id, 
      start_date, 
      end_date,
      nombre_cliente,
      correo_cliente
    })

    // Validar campos requeridos
    if (!room_id || !start_date || !end_date || !nombre_cliente || !correo_cliente) {
      return res.status(400).json({
        success: false,
        error: "Faltan campos requeridos: room_id, start_date, end_date, nombre_cliente, correo_cliente",
        code: "MISSING_REQUIRED_FIELDS"
      })
    }

    try {
      // 1. Verificar disponibilidad de la habitación
      const availabilityCheck = await executeQuery(`
        SELECT COUNT(*) as count 
        FROM reserva r 
        WHERE r.id_habitacion = ? 
        AND r.estado_reserva IN ('Confirmada', 'Pendiente')
        AND (
          (r.fecha_inicio <= ? AND r.fecha_fin > ?) OR
          (r.fecha_inicio < ? AND r.fecha_fin >= ?) OR
          (r.fecha_inicio >= ? AND r.fecha_fin <= ?)
        )
      `, [room_id, end_date, start_date, end_date, start_date, start_date, end_date])

      if (availabilityCheck[0].count > 0) {
        return res.status(400).json({
          success: false,
          error: "La habitación no está disponible en las fechas seleccionadas",
          code: "ROOM_NOT_AVAILABLE"
        })
      }

      // 2. Buscar o crear cliente
      let client_id
      
      // Buscar cliente por email
      const existingClient = await executeQuery(
        "SELECT id_cliente FROM cliente WHERE correo_cliente = ?",
        [correo_cliente]
      )

      if (existingClient.length > 0) {
        client_id = existingClient[0].id_cliente
        console.log('👤 Cliente existente encontrado:', client_id)
        
        // Actualizar datos del cliente
        await executeQuery(`
          UPDATE cliente 
          SET nombre_cliente = ?, telefono_cliente = ?
          WHERE id_cliente = ?
        `, [nombre_cliente, telefono_cliente || '', client_id])
      } else {
        // Crear nuevo cliente
        console.log('👤 Creando nuevo cliente...')
        const newClient = await executeQuery(`
          INSERT INTO cliente (
            nombre_cliente, 
            apellido_cliente, 
            correo_cliente, 
            telefono_cliente
          ) VALUES (?, ?, ?, ?)
        `, [nombre_cliente, '', correo_cliente, telefono_cliente || ''])
        
        client_id = newClient.insertId
        console.log('✅ Nuevo cliente creado con ID:', client_id)
      }

      // 3. Crear reserva básica
      const employee_id = 1 // Empleado por defecto
      
      await executeQuery(
        "CALL crear_reserva_con_detalle(?, ?, ?, ?, ?)",
        [client_id, employee_id, room_id, start_date, end_date]
      )

      // 4. Obtener el ID de la reserva
      const lastReservation = await executeQuery(
        "SELECT LAST_INSERT_ID() as reservation_id"
      )
      const reservationId = lastReservation[0].reservation_id

      console.log('✅ Reserva creada con ID:', reservationId)

      // 5. Agregar servicios si se proporcionaron
      if (services && services.length > 0) {
        for (const service of services) {
          if (service.id_servicio) {
            await executeQuery(
              `INSERT INTO servicio_reserva (id_reserva, id_servicio, cantidad, precio_total) 
               VALUES (?, ?, ?, ?)`,
              [reservationId, service.id_servicio, service.cantidad || 1, service.precio_total || 0]
            )
          }
        }
      }

      // 6. Actualizar el costo total si se proporcionó
      if (total_price > 0) {
        await executeQuery(
          `UPDATE detalle_reserva SET costo_total = ? WHERE id_reserva = ?`,
          [total_price, reservationId]
        )
      }

      // 7. Obtener y devolver la reserva creada
      const newReservation = await executeQuery(`
        SELECT 
          r.id_reserva, 
          r.fecha_reserva, 
          r.fecha_inicio, 
          r.fecha_fin, 
          r.estado_reserva,
          c.nombre_cliente, 
          c.apellido_cliente,
          c.correo_cliente,
          h.numero_habitacion, 
          h.tipo_habitacion,
          h.precio,
          dr.costo_total
        FROM reserva r
        JOIN cliente c ON r.id_cliente = c.id_cliente
        JOIN habitacion h ON r.id_habitacion = h.id_habitacion
        LEFT JOIN detalle_reserva dr ON r.id_reserva = dr.id_reserva
        WHERE r.id_reserva = ?
      `, [reservationId])

      const reservationData = newReservation[0]

      res.status(201).json({
        success: true,
        message: "¡Reserva creada exitosamente!",
        reservation_id: reservationId,
        reservation: {
          id: reservationData.id_reserva.toString(),
          booking_date: reservationData.fecha_reserva,
          start_date: reservationData.fecha_inicio,
          end_date: reservationData.fecha_fin,
          status: reservationData.estado_reserva,
          client: {
            name: `${reservationData.nombre_cliente} ${reservationData.apellido_cliente || ''}`,
            email: reservationData.correo_cliente
          },
          room: {
            number: reservationData.numero_habitacion,
            type: reservationData.tipo_habitacion,
            price: reservationData.precio
          },
          details: {
            total_cost: reservationData.costo_total
          }
        }
      })

    } catch (error) {
      console.error('❌ Error al crear reserva pública:', error.message)
      res.status(500).json({
        success: false,
        error: "Error interno del servidor al crear la reserva",
        details: error.message
      })
    }
  })
)

// 🔓 Ruta pública - Obtener servicios disponibles (CORREGIDO)
router.get(
  "/services",
  asyncHandler(async (req, res) => {
    try {
      const services = await executeQuery(`
        SELECT 
          id_servicio,
          nombre_servicio,
          descripcion_servicio,
          precio_servicio
        FROM servicio
        ORDER BY nombre_servicio
      `)

      res.json({
        success: true,
        services: services.map(service => ({
          id: service.id_servicio.toString(),
          name: service.nombre_servicio,
          description: service.descripcion_servicio,
          price: parseFloat(service.precio_servicio),
          category: getCategoryFromService(service.nombre_servicio),
          duration: getDurationFromService(service.nombre_servicio),
          icon: getIconFromService(service.nombre_servicio),
          isPopular: service.precio_servicio > 50000 || 
                    service.nombre_servicio.toLowerCase().includes('masaje') || 
                    service.nombre_servicio.toLowerCase().includes('cena')
        }))
      })
    } catch (error) {
      console.error('❌ Error en getAvailableServices:', error)
      res.status(500).json({
        success: false,
        error: "Error al obtener servicios",
        details: error.message
      })
    }
  })
)

// Funciones helper para categorizar servicios
function getCategoryFromService(name) {
  const lowerName = name.toLowerCase()
  
  if (lowerName.includes('masaje') || lowerName.includes('spa')) return 'spa'
  if (lowerName.includes('desayuno') || lowerName.includes('almuerzo') || lowerName.includes('cena')) return 'food'
  if (lowerName.includes('transporte') || lowerName.includes('tour')) return 'transport'
  if (lowerName.includes('limpieza') || lowerName.includes('lavandería') || lowerName.includes('lavanderia')) return 'housekeeping'
  if (lowerName.includes('gimnasio') || lowerName.includes('piscina')) return 'fitness'
  if (lowerName.includes('wifi')) return 'tech'
  if (lowerName.includes('llamada')) return 'tech'
  if (lowerName.includes('parqueadero')) return 'transport'
  if (lowerName.includes('mascota')) return 'housekeeping'
  
  return 'other'
}

function getDurationFromService(name) {
  const lowerName = name.toLowerCase()
  
  if (lowerName.includes('desayuno')) return '30 min'
  if (lowerName.includes('almuerzo') || lowerName.includes('cena')) return '45 min'
  if (lowerName.includes('masaje')) return '60 min'
  if (lowerName.includes('transporte')) return '45 min'
  if (lowerName.includes('tour')) return '3 horas'
  if (lowerName.includes('gimnasio') || lowerName.includes('piscina')) return 'Todo el día'
  if (lowerName.includes('wifi')) return '24/7'
  
  return 'Varía'
}

function getIconFromService(name) {
  const lowerName = name.toLowerCase()
  
  if (lowerName.includes('masaje') || lowerName.includes('spa')) return 'spa'
  if (lowerName.includes('desayuno') || lowerName.includes('almuerzo') || lowerName.includes('cena')) return 'utensils'
  if (lowerName.includes('transporte') || lowerName.includes('tour') || lowerName.includes('parqueadero')) return 'car'
  if (lowerName.includes('limpieza') || lowerName.includes('lavandería') || lowerName.includes('lavanderia') || lowerName.includes('mascota')) return 'users'
  if (lowerName.includes('gimnasio') || lowerName.includes('piscina')) return 'dumbbell'
  if (lowerName.includes('wifi') || lowerName.includes('llamada')) return 'wifi'
  
  return 'star'
}

// 🔓 Ruta pública - Verificar disponibilidad
router.get(
  "/availability",
  asyncHandler(async (req, res) => {
    const { start_date, end_date, room_type, guests } = req.query

    console.log('📅 Consultando disponibilidad:', { start_date, end_date, room_type, guests })

    if (!start_date || !end_date) {
      return res.status(400).json({
        success: false,
        error: "Las fechas de inicio y fin son requeridas",
        code: "MISSING_DATES"
      })
    }

    let whereConditions = ["h.estado_habitacion = 'Disponible'"]
    const params = []

    if (room_type && room_type !== 'all') {
      whereConditions.push("h.tipo_habitacion = ?")
      params.push(room_type)
    }

    if (guests) {
      whereConditions.push("h.capacidad >= ?")
      params.push(parseInt(guests))
    }

    // Verificar conflictos con reservas existentes
    whereConditions.push(`
      h.id_habitacion NOT IN (
        SELECT DISTINCT r.id_habitacion
        FROM reserva r
        WHERE r.estado_reserva IN ('Confirmada', 'Pendiente')
        AND (
          (r.fecha_inicio <= ? AND r.fecha_fin > ?) OR
          (r.fecha_inicio < ? AND r.fecha_fin >= ?) OR
          (r.fecha_inicio >= ? AND r.fecha_fin <= ?)
        )
      )
    `)
    params.push(end_date, start_date, end_date, start_date, start_date, end_date)

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(" AND ")}` : ""

    const query = `
      SELECT 
        h.id_habitacion,
        h.numero_habitacion,
        h.tipo_habitacion,
        h.precio,
        h.estado_habitacion,
        h.capacidad,
        dh.descripcion,
        dh.servicios_incluidos,
        (DATEDIFF(?, ?) * h.precio) as total_nights_cost
      FROM habitacion h
      LEFT JOIN detalles_habitacion dh ON h.id_habitacion = dh.id_habitacion
      ${whereClause}
      ORDER BY h.precio
    `

    params.unshift(end_date, start_date)

    try {
      const availableRooms = await executeQuery(query, params)

      const formattedRooms = availableRooms.map(room => {
        const amenities = room.servicios_incluidos ? 
          (typeof room.servicios_incluidos === 'string' ? 
            room.servicios_incluidos.split(',').map(item => item.trim()) : 
            room.servicios_incluidos) : 
          ['WiFi', 'TV', 'Aire acondicionado']

        return {
          id: room.id_habitacion.toString(),
          number: room.numero_habitacion.toString(),
          type: room.tipo_habitacion,
          price: parseFloat(room.precio),
          status: room.estado_habitacion,
          description: room.descripcion || 'Habitación cómoda y acogedora',
          capacity: room.capacidad || 2,
          amenities: amenities,
          total_nights_cost: parseFloat(room.total_nights_cost),
          nights: Math.ceil((new Date(end_date) - new Date(start_date)) / (1000 * 60 * 60 * 24))
        }
      })

      res.json({
        success: true,
        available_rooms: formattedRooms,
        search_params: {
          start_date,
          end_date,
          room_type: room_type || 'all',
          guests: guests || 1
        },
        total: formattedRooms.length
      })
    } catch (error) {
      console.error('❌ Error en getRoomAvailability:', error)
      throw error
    }
  })
)

// 🔐 Rutas protegidas - Todas requieren autenticación
router.use(authenticateToken)

// Obtener todas las reservas (para admin)
router.get(
  "/",
  asyncHandler(async (req, res) => {
    console.log('📡 GET /api/reservations - Obteniendo todas las reservas')
    
    const reservations = await executeQuery(`
      SELECT 
        r.id_reserva, 
        r.fecha_reserva, 
        r.fecha_inicio, 
        r.fecha_fin, 
        r.estado_reserva,
        c.id_cliente,
        c.nombre_cliente, 
        c.apellido_cliente, 
        c.correo_cliente,
        c.telefono_cliente,
        h.id_habitacion,
        h.numero_habitacion, 
        h.tipo_habitacion,
        h.precio,
        dr.id_detalle,
        dr.costo_total,
        e.nombre_empleado,
        e.apellido_empleado
      FROM reserva r
      JOIN cliente c ON r.id_cliente = c.id_cliente
      JOIN habitacion h ON r.id_habitacion = h.id_habitacion
      LEFT JOIN detalle_reserva dr ON r.id_reserva = dr.id_reserva
      LEFT JOIN empleado e ON r.id_empleado = e.id_empleado
      ORDER BY r.fecha_reserva DESC
    `)

    console.log(`✅ Reservas encontradas: ${reservations.length}`)

    res.json({
      success: true,
      message: "Reservas obtenidas correctamente",
      count: reservations.length,
      reservations: reservations.map(res => ({
        id: res.id_reserva.toString(),
        booking_date: res.fecha_reserva,
        start_date: res.fecha_inicio,
        end_date: res.fecha_fin,
        status: res.estado_reserva,
        client: {
          id: res.id_cliente,
          name: `${res.nombre_cliente} ${res.apellido_cliente}`,
          email: res.correo_cliente,
          phone: res.telefono_cliente
        },
        room: {
          id: res.id_habitacion,
          number: res.numero_habitacion,
          type: res.tipo_habitacion,
          price: res.precio
        },
        details: {
          total_cost: res.costo_total
        },
        employee: res.nombre_empleado ? `${res.nombre_empleado} ${res.apellido_empleado}` : null
      }))
    })
  })
)

// Obtener reserva por ID
router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const { id } = req.params
    console.log(`📡 GET /api/reservations/${id} - Obteniendo reserva por ID`)

    const reservations = await executeQuery(`
      SELECT 
        r.*, 
        c.id_cliente,
        c.nombre_cliente, 
        c.apellido_cliente, 
        c.correo_cliente, 
        c.telefono_cliente,
        c.direccion_cliente,
        c.nacionalidad,
        h.id_habitacion,
        h.numero_habitacion, 
        h.tipo_habitacion, 
        h.precio,
        h.estado_habitacion,
        dr.costo_total,
        e.nombre_empleado,
        e.apellido_empleado,
        e.cargo_empleado
      FROM reserva r
      JOIN cliente c ON r.id_cliente = c.id_cliente
      JOIN habitacion h ON r.id_habitacion = h.id_habitacion
      LEFT JOIN detalle_reserva dr ON r.id_reserva = dr.id_reserva
      LEFT JOIN empleado e ON r.id_empleado = e.id_empleado
      WHERE r.id_reserva = ?
    `, [id])

    if (!reservations.length) {
      return res.status(404).json({
        success: false,
        error: "Reserva no encontrada",
        code: "RESERVATION_NOT_FOUND"
      })
    }

    const reservation = reservations[0]

    // Obtener servicios de la reserva
    const services = await executeQuery(`
      SELECT 
        sr.*, 
        s.id_servicio,
        s.nombre_servicio, 
        s.descripcion_servicio,
        s.precio_servicio
      FROM servicio_reserva sr
      JOIN servicio s ON sr.id_servicio = s.id_servicio
      WHERE sr.id_reserva = ?
    `, [id])

    res.json({
      success: true,
      reservation: {
        id: reservation.id_reserva.toString(),
        booking_date: reservation.fecha_reserva,
        start_date: reservation.fecha_inicio,
        end_date: reservation.fecha_fin,
        status: reservation.estado_reserva,
        client: {
          id: reservation.id_cliente,
          name: `${reservation.nombre_cliente} ${reservation.apellido_cliente}`,
          email: reservation.correo_cliente,
          phone: reservation.telefono_cliente,
          address: reservation.direccion_cliente,
          nationality: reservation.nacionalidad
        },
        room: {
          id: reservation.id_habitacion,
          number: reservation.numero_habitacion,
          type: reservation.tipo_habitacion,
          price: reservation.precio,
          status: reservation.estado_habitacion
        },
        details: {
          total_cost: reservation.costo_total
        },
        employee: reservation.nombre_empleado ? {
          name: `${reservation.nombre_empleado} ${reservation.apellido_empleado}`,
          position: reservation.cargo_empleado
        } : null,
        services: services.map(service => ({
          id: service.id_servicio.toString(),
          name: service.nombre_servicio,
          description: service.descripcion_servicio,
          quantity: service.cantidad,
          unit_price: service.precio_servicio,
          total_price: service.precio_total
        }))
      }
    })
  })
)

// Cancelar reserva
router.put(
  "/:id/cancel",
  asyncHandler(async (req, res) => {
    const { id } = req.params
    console.log(`❌ Cancelando reserva ${id}`)

    const result = await executeQuery(
      "UPDATE reserva SET estado_reserva = 'Cancelada' WHERE id_reserva = ? AND estado_reserva IN ('Pendiente', 'Confirmada')",
      [id]
    )

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        error: "Reserva no encontrada o no se puede cancelar",
        code: "RESERVATION_CANNOT_BE_CANCELLED"
      })
    }

    // Liberar la habitación
    await executeQuery(`
      UPDATE habitacion h
      JOIN reserva r ON h.id_habitacion = r.id_habitacion
      SET h.estado_habitacion = 'Disponible'
      WHERE r.id_reserva = ?
    `, [id])

    res.json({
      success: true,
      message: "Reserva cancelada exitosamente"
    })
  })
)

// Cambiar estado de reserva
router.patch(
  "/:id/status",
  asyncHandler(async (req, res) => {
    const { id } = req.params
    const { status } = req.body

    console.log(`🔄 Cambiando estado de reserva ${id} a: ${status}`)

    if (!status || !['Pendiente', 'Confirmada', 'Cancelada', 'Completada'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: "Estado inválido",
        code: "INVALID_STATUS"
      })
    }

    const result = await executeQuery(
      "UPDATE reserva SET estado_reserva = ? WHERE id_reserva = ?",
      [status, id]
    )

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        error: "Reserva no encontrada",
        code: "RESERVATION_NOT_FOUND"
      })
    }

    // Si se confirma la reserva, marcar la habitación como ocupada
    if (status === 'Confirmada') {
      await executeQuery(`
        UPDATE habitacion h
        JOIN reserva r ON h.id_habitacion = r.id_habitacion
        SET h.estado_habitacion = 'Ocupada'
        WHERE r.id_reserva = ?
      `, [id])
    }

    // Si se cancela o completa, liberar la habitación
    if (status === 'Cancelada' || status === 'Completada') {
      await executeQuery(`
        UPDATE habitacion h
        JOIN reserva r ON h.id_habitacion = r.id_habitacion
        SET h.estado_habitacion = 'Disponible'
        WHERE r.id_reserva = ?
      `, [id])
    }

    res.json({
      success: true,
      message: `Reserva ${status.toLowerCase()} exitosamente`
    })
  })
)

export default router