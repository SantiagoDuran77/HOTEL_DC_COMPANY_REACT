import express from "express"
import { executeQuery, executeTransaction } from "../config/database.js"
import { asyncHandler } from "../middleware/errorHandler.js"
import { authenticateToken } from "../middleware/auth.js"

const router = express.Router()

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
      whereConditions.push("dh.capacidad >= ?")
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
        dh.descripcion,
        dh.capacidad,
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
          description: room.descripcion,
          capacity: room.capacidad,
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

// 🔓 Ruta pública - Obtener servicios disponibles
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
          category: service.categoria || 'General'
        }))
      })
    } catch (error) {
      console.error('❌ Error en getAvailableServices:', error)
      throw error
    }
  })
)

// 🔐 Rutas protegidas - Todas requieren autenticación
router.use(authenticateToken)

// Obtener todas las reservas
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
        dr.fecha_checkin, 
        dr.fecha_checkout, 
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
          checkin: res.fecha_checkin,
          checkout: res.fecha_checkout,
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
        dr.fecha_checkin, 
        dr.fecha_checkout, 
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
          checkin: reservation.fecha_checkin,
          checkout: reservation.fecha_checkout,
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

// Crear nueva reserva
router.post(
  "/",
  asyncHandler(async (req, res) => {
    const { 
      room_id, 
      start_date, 
      end_date,
      services = [],
      guests = 1,
      total_price = 0,
      special_requests = null
    } = req.body

    console.log('📝 Creando nueva reserva con datos:', { 
      room_id, 
      start_date, 
      end_date, 
      services, 
      guests, 
      total_price, 
      special_requests 
    })

    // Validar campos requeridos
    if (!room_id || !start_date || !end_date) {
      return res.status(400).json({
        success: false,
        error: "Faltan campos requeridos: room_id, start_date, end_date",
        code: "MISSING_REQUIRED_FIELDS"
      })
    }

    // Obtener el usuario autenticado (cliente) del token
    const user = req.user
    if (!user) {
      return res.status(401).json({
        success: false,
        error: "Usuario no autenticado",
        code: "UNAUTHORIZED"
      })
    }

    console.log('👤 Usuario autenticado:', user)

    // Determinar el client_id basado en el usuario autenticado
    let client_id
    
    if (user.usuario_acceso === 'Cliente') {
      // Si es cliente, usar su ID directamente
      client_id = user.id_cliente || user.id_usuario
    } else if (user.usuario_acceso === 'Empleado') {
      // Si es empleado, buscar o crear un cliente genérico
      const defaultClient = await executeQuery(`
        SELECT id_cliente FROM cliente WHERE correo_cliente = 'cliente@default.com'
      `)
      
      if (defaultClient.length > 0) {
        client_id = defaultClient[0].id_cliente
      } else {
        // Crear cliente por defecto si no existe
        const newClient = await executeQuery(`
          INSERT INTO cliente (nombre_cliente, apellido_cliente, correo_cliente, telefono_cliente)
          VALUES ('Cliente', 'General', 'cliente@default.com', '0000000000')
        `)
        client_id = newClient.insertId
      }
    } else {
      return res.status(403).json({
        success: false,
        error: "Tipo de usuario no válido",
        code: "INVALID_USER_TYPE"
      })
    }

    console.log('🔑 Client ID a usar:', client_id)

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

    // 2. Usar el procedimiento almacenado para crear reserva básica
    // Usar empleado por defecto (ID 1) si no se especifica
    const employee_id = 1

    try {
      await executeQuery(
        "CALL crear_reserva_con_detalle(?, ?, ?, ?, ?)",
        [client_id, employee_id, room_id, start_date, end_date]
      )
    } catch (error) {
      console.error('❌ Error al ejecutar procedimiento almacenado:', error)
      return res.status(500).json({
        success: false,
        error: "Error interno al crear la reserva",
        code: "INTERNAL_SERVER_ERROR"
      })
    }

    // 3. Obtener el ID de la reserva recién creada
    const lastReservation = await executeQuery(
      "SELECT LAST_INSERT_ID() as reservation_id"
    )
    const reservationId = lastReservation[0].reservation_id

    console.log('✅ Reserva creada con ID:', reservationId)

    // 4. Agregar servicios si se proporcionaron
    if (services && services.length > 0) {
      for (const service of services) {
        await executeQuery(
          `INSERT INTO servicio_reserva (id_reserva, id_servicio, cantidad, precio_total) 
           VALUES (?, ?, ?, ?)`,
          [reservationId, service.id_servicio, service.cantidad || 1, service.precio_total || 0]
        )
      }
    }

    // 5. Actualizar el costo total si se proporcionó
    if (total_price > 0) {
      await executeQuery(
        `UPDATE detalle_reserva SET costo_total = ? WHERE id_reserva = ?`,
        [total_price, reservationId]
      )
    }

    // 6. Agregar solicitudes especiales si se proporcionaron
    if (special_requests) {
      await executeQuery(
        `UPDATE detalle_reserva SET observaciones = ? WHERE id_reserva = ?`,
        [special_requests, reservationId]
      )
    }

    // 7. Obtener la reserva creada para devolverla
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
        dr.costo_total,
        dr.observaciones
      FROM reserva r
      JOIN cliente c ON r.id_cliente = c.id_cliente
      JOIN habitacion h ON r.id_habitacion = h.id_habitacion
      LEFT JOIN detalle_reserva dr ON r.id_reserva = dr.id_reserva
      WHERE r.id_reserva = ?
    `, [reservationId])

    const reservationData = newReservation[0]

    res.status(201).json({
      success: true,
      message: "Reserva creada exitosamente",
      reservation_id: reservationId,
      reservation: {
        id: reservationData.id_reserva.toString(),
        booking_date: reservationData.fecha_reserva,
        start_date: reservationData.fecha_inicio,
        end_date: reservationData.fecha_fin,
        status: reservationData.estado_reserva,
        client: {
          name: `${reservationData.nombre_cliente} ${reservationData.apellido_cliente}`,
          email: reservationData.correo_cliente
        },
        room: {
          number: reservationData.numero_habitacion,
          type: reservationData.tipo_habitacion,
          price: reservationData.precio
        },
        details: {
          total_cost: reservationData.costo_total,
          special_requests: reservationData.observaciones
        }
      }
    })
  })
)

// Actualizar reserva
router.put(
  "/:id",
  asyncHandler(async (req, res) => {
    const { id } = req.params
    const { 
      start_date, 
      end_date, 
      status,
      room_id,
      services = []
    } = req.body

    console.log(`📝 Actualizando reserva ${id}:`, { start_date, end_date, status, room_id })

    // Verificar si la reserva existe
    const existingReservation = await executeQuery(
      "SELECT id_reserva FROM reserva WHERE id_reserva = ?",
      [id]
    )

    if (!existingReservation.length) {
      return res.status(404).json({
        success: false,
        error: "Reserva no encontrada",
        code: "RESERVATION_NOT_FOUND"
      })
    }

    // Si se cambia la habitación o fechas, verificar disponibilidad
    if (room_id || start_date || end_date) {
      const currentReservation = await executeQuery(`
        SELECT id_habitacion, fecha_inicio, fecha_fin 
        FROM reserva WHERE id_reserva = ?
      `, [id])

      const roomToCheck = room_id || currentReservation[0].id_habitacion
      const startToCheck = start_date || currentReservation[0].fecha_inicio
      const endToCheck = end_date || currentReservation[0].fecha_fin

      const availabilityCheck = await executeQuery(`
        SELECT COUNT(*) as count 
        FROM reserva r 
        WHERE r.id_habitacion = ? 
        AND r.id_reserva != ?
        AND r.estado_reserva IN ('Confirmada', 'Pendiente')
        AND (
          (r.fecha_inicio <= ? AND r.fecha_fin > ?) OR
          (r.fecha_inicio < ? AND r.fecha_fin >= ?) OR
          (r.fecha_inicio >= ? AND r.fecha_fin <= ?)
        )
      `, [roomToCheck, id, endToCheck, startToCheck, endToCheck, startToCheck, startToCheck, endToCheck])

      if (availabilityCheck[0].count > 0) {
        return res.status(400).json({
          success: false,
          error: "La habitación no está disponible en las fechas seleccionadas",
          code: "ROOM_NOT_AVAILABLE"
        })
      }
    }

    // Actualizar la reserva
    const updateFields = []
    const updateValues = []

    if (start_date) {
      updateFields.push("fecha_inicio = ?")
      updateValues.push(start_date)
    }
    if (end_date) {
      updateFields.push("fecha_fin = ?")
      updateValues.push(end_date)
    }
    if (status) {
      updateFields.push("estado_reserva = ?")
      updateValues.push(status)
    }
    if (room_id) {
      updateFields.push("id_habitacion = ?")
      updateValues.push(room_id)
    }

    if (updateFields.length > 0) {
      updateValues.push(id)
      await executeQuery(
        `UPDATE reserva SET ${updateFields.join(", ")} WHERE id_reserva = ?`,
        updateValues
      )
    }

    // Actualizar servicios si se proporcionaron
    if (services.length > 0) {
      // Eliminar servicios existentes
      await executeQuery("DELETE FROM servicio_reserva WHERE id_reserva = ?", [id])
      
      // Agregar nuevos servicios
      for (const service of services) {
        await executeQuery(
          `INSERT INTO servicio_reserva (id_reserva, id_servicio, cantidad, precio_total) 
           VALUES (?, ?, ?, ?)`,
          [id, service.id, service.quantity || 1, service.total_price || (service.unit_price * (service.quantity || 1))]
        )
      }
    }

    // Recalcular costo total si se cambiaron fechas o servicios
    if (start_date || end_date || services.length > 0) {
      const reservation = await executeQuery(`
        SELECT r.fecha_inicio, r.fecha_fin, h.precio
        FROM reserva r
        JOIN habitacion h ON r.id_habitacion = h.id_habitacion
        WHERE r.id_reserva = ?
      `, [id])

      if (reservation.length > 0) {
        const days = Math.ceil((new Date(reservation[0].fecha_fin) - new Date(reservation[0].fecha_inicio)) / (1000 * 60 * 60 * 24))
        const roomCost = days * reservation[0].precio

        // Calcular costo de servicios
        const serviceCosts = await executeQuery(`
          SELECT SUM(precio_total) as total_services 
          FROM servicio_reserva 
          WHERE id_reserva = ?
        `, [id])

        const totalCost = roomCost + (serviceCosts[0].total_services || 0)

        // Actualizar detalle_reserva
        await executeQuery(
          `UPDATE detalle_reserva SET costo_total = ? WHERE id_reserva = ?`,
          [totalCost, id]
        )
      }
    }

    res.json({
      success: true,
      message: "Reserva actualizada exitosamente"
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

// Eliminar reserva
router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const { id } = req.params
    console.log(`🗑️ Eliminando reserva ${id}`)

    // Verificar si la reserva existe
    const existingReservation = await executeQuery(
      "SELECT id_reserva FROM reserva WHERE id_reserva = ?",
      [id]
    )

    if (!existingReservation.length) {
      return res.status(404).json({
        success: false,
        error: "Reserva no encontrada",
        code: "RESERVATION_NOT_FOUND"
      })
    }

    // Eliminar en transacción para mantener la integridad de los datos
    try {
      await executeTransaction([
        { query: "DELETE FROM servicio_reserva WHERE id_reserva = ?", params: [id] },
        { query: "DELETE FROM detalle_reserva WHERE id_reserva = ?", params: [id] },
        { query: "DELETE FROM reserva WHERE id_reserva = ?", params: [id] }
      ])

      res.json({
        success: true,
        message: "Reserva eliminada exitosamente"
      })
    } catch (error) {
      console.error('❌ Error al eliminar reserva:', error)
      throw error
    }
  })
)

export default router