import { executeQuery, executeTransaction } from "../config/database.js"
import { asyncHandler } from "../middleware/errorHandler.js"

// Obtener disponibilidad de habitaciones
export const getRoomAvailability = asyncHandler(async (req, res) => {
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

// Crear reserva con proceso completo
export const createReservationWithPayment = asyncHandler(async (req, res) => {
  const { 
    room_id, 
    start_date, 
    end_date,
    services = [],
    guest_info,
    payment_method,
    total_amount,
    special_requests = ''
  } = req.body

  console.log('💳 Creando reserva con pago:', { 
    room_id, 
    start_date, 
    end_date,
    services: services.length,
    guest_info,
    payment_method,
    total_amount
  })

  // Validaciones
  if (!room_id || !start_date || !end_date || !guest_info || !payment_method || !total_amount) {
    return res.status(400).json({
      success: false,
      error: "Faltan campos requeridos",
      code: "MISSING_REQUIRED_FIELDS"
    })
  }

  const user = req.user
  if (!user) {
    return res.status(401).json({
      success: false,
      error: "Usuario no autenticado",
      code: "UNAUTHORIZED"
    })
  }

  // Verificar disponibilidad
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
      error: "La habitación ya no está disponible para las fechas seleccionadas",
      code: "ROOM_NOT_AVAILABLE"
    })
  }

  try {
    // Iniciar transacción
    const connection = await executeQuery.getConnection()
    await connection.beginTransaction()

    try {
      // 1. Determinar client_id
      let client_id
      if (user.usuario_acceso === 'Cliente') {
        client_id = user.id_cliente
      } else {
        // Para empleados o usuarios sin cliente, usar cliente por defecto
        const defaultClient = await executeQuery(`
          SELECT id_cliente FROM cliente WHERE correo_cliente = 'cliente@default.com'
        `)
        if (defaultClient.length > 0) {
          client_id = defaultClient[0].id_cliente
        } else {
          const newClient = await executeQuery(`
            INSERT INTO cliente (nombre_cliente, apellido_cliente, correo_cliente, telefono_cliente)
            VALUES (?, ?, ?, ?)
          `, [guest_info.first_name, guest_info.last_name, guest_info.email, guest_info.phone])
          client_id = newClient.insertId
        }
      }

      // 2. Crear reserva
      const employee_id = 1 // Empleado por defecto
      await executeQuery(
        "CALL crear_reserva_con_detalle(?, ?, ?, ?, ?)",
        [client_id, employee_id, room_id, start_date, end_date]
      )

      // 3. Obtener ID de reserva
      const [lastReservation] = await executeQuery("SELECT LAST_INSERT_ID() as reservation_id")
      const reservationId = lastReservation.reservation_id

      // 4. Agregar servicios
      if (services.length > 0) {
        for (const service of services) {
          await executeQuery(
            `INSERT INTO servicio_reserva (id_reserva, id_servicio, cantidad, precio_total) 
             VALUES (?, ?, ?, ?)`,
            [reservationId, service.id, service.quantity, service.total_price]
          )
        }
      }

      // 5. Actualizar costo total
      await executeQuery(
        `UPDATE detalle_reserva SET costo_total = ?, observaciones = ? WHERE id_reserva = ?`,
        [total_amount, special_requests, reservationId]
      )

      // 6. Crear factura
      const [facturaResult] = await executeQuery(`
        INSERT INTO factura (fecha_factura, total_factura, estado_factura, id_reserva)
        VALUES (NOW(), ?, 'Pagada', ?)
      `, [total_amount, reservationId])

      const facturaId = facturaResult.insertId

      // 7. Registrar pago
      await executeQuery(`
        INSERT INTO pago (fecha_pago, monto_pago, metodo_pago, id_factura)
        VALUES (NOW(), ?, ?, ?)
      `, [total_amount, payment_method, facturaId])

      // 8. Confirmar reserva
      await executeQuery(
        "UPDATE reserva SET estado_reserva = 'Confirmada' WHERE id_reserva = ?",
        [reservationId]
      )

      // Confirmar transacción
      await connection.commit()

      // Obtener datos completos de la reserva
      const [reservationData] = await executeQuery(`
        SELECT 
          r.id_reserva, 
          r.fecha_reserva, 
          r.fecha_inicio, 
          r.fecha_fin, 
          r.estado_reserva,
          c.nombre_cliente, 
          c.apellido_cliente,
          c.correo_cliente,
          c.telefono_cliente,
          h.numero_habitacion, 
          h.tipo_habitacion,
          h.precio,
          dr.costo_total,
          dr.observaciones,
          f.id_factura,
          p.metodo_pago
        FROM reserva r
        JOIN cliente c ON r.id_cliente = c.id_cliente
        JOIN habitacion h ON r.id_habitacion = h.id_habitacion
        LEFT JOIN detalle_reserva dr ON r.id_reserva = dr.id_reserva
        LEFT JOIN factura f ON r.id_reserva = f.id_reserva
        LEFT JOIN pago p ON f.id_factura = p.id_factura
        WHERE r.id_reserva = ?
      `, [reservationId])

      res.status(201).json({
        success: true,
        message: "Reserva creada y pagada exitosamente",
        reservation: {
          id: reservationData.id_reserva.toString(),
          booking_date: reservationData.fecha_reserva,
          start_date: reservationData.fecha_inicio,
          end_date: reservationData.fecha_fin,
          status: reservationData.estado_reserva,
          client: {
            name: `${reservationData.nombre_cliente} ${reservationData.apellido_cliente}`,
            email: reservationData.correo_cliente,
            phone: reservationData.telefono_cliente
          },
          room: {
            number: reservationData.numero_habitacion,
            type: reservationData.tipo_habitacion,
            price: reservationData.precio
          },
          payment: {
            invoice_id: reservationData.id_factura,
            method: reservationData.metodo_pago,
            amount: reservationData.costo_total
          },
          details: {
            total_cost: reservationData.costo_total,
            special_requests: reservationData.observaciones
          }
        }
      })

    } catch (error) {
      await connection.rollback()
      throw error
    } finally {
      connection.release()
    }

  } catch (error) {
    console.error('❌ Error en createReservationWithPayment:', error)
    throw error
  }
})

// Obtener servicios disponibles
export const getAvailableServices = asyncHandler(async (req, res) => {
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