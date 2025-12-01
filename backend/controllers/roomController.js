import { executeQuery } from "../config/database.js"
import { asyncHandler } from "../middleware/errorHandler.js"

// Obtener todas las habitaciones - CORREGIDO
export const getRooms = asyncHandler(async (req, res) => {
  const { tipo = "", estado = "" } = req.query

  const whereConditions = ["1=1"]
  const params = []

  if (tipo && tipo !== 'all') {
    whereConditions.push("h.tipo_habitacion = ?")
    params.push(tipo)
  }

  if (estado && estado !== 'all') {
    whereConditions.push("h.estado_habitacion = ?")
    params.push(estado)
  }

  const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(" AND ")}` : ""

  // Consulta CORREGIDA - usando el nombre correcto de la tabla detalles_habitacion
  const query = `
    SELECT 
      h.id_habitacion,
      h.numero_habitacion,
      h.tipo_habitacion,
      h.precio,
      h.estado_habitacion,
      COALESCE(dh.descripcion, 'Habitación cómoda y acogedora para tu estadía.') as descripcion,
      COALESCE(dh.capacidad, 2) as capacidad,
      COALESCE(dh.servicios_incluidos, 'WiFi, TV, Aire acondicionado') as servicios_incluidos
    FROM Habitacion h
    LEFT JOIN detalles_habitacion dh ON h.id_habitacion = dh.id_habitacion
    ${whereClause}
    ORDER BY h.numero_habitacion
  `

  console.log('🔍 Executing query:', query)
  console.log('📋 With params:', params)

  try {
    const rooms = await executeQuery(query, params)
    console.log('✅ Rooms found:', rooms.length)

    // Formatear respuesta para el frontend
    const formattedRooms = rooms.map((room) => {
      const amenities = room.servicios_incluidos ? 
        (typeof room.servicios_incluidos === 'string' ? 
          room.servicios_incluidos.split(',').map(item => item.trim()) : 
          room.servicios_incluidos) : 
        ['WiFi', 'TV', 'Aire acondicionado']

      return {
        id_habitacion: room.id_habitacion,
        numero_habitacion: room.numero_habitacion,
        tipo_habitacion: room.tipo_habitacion,
        precio: parseFloat(room.precio),
        estado_habitacion: room.estado_habitacion,
        descripcion: room.descripcion,
        capacidad: room.capacidad,
        servicios_incluidos: room.servicios_incluidos,
        amenities: amenities
      }
    })

    res.json({
      success: true,
      rooms: formattedRooms,
      count: rooms.length,
    })
  } catch (error) {
    console.error('❌ Error in getRooms:', error)
    res.status(500).json({
      success: false,
      error: "Error al cargar las habitaciones",
      details: error.message
    })
  }
})

// Obtener habitación por ID - CORREGIDO
export const getRoomById = asyncHandler(async (req, res) => {
  const { id } = req.params

  console.log('🔍 Getting room by id:', id)

  const rooms = await executeQuery(
    `
    SELECT h.*, dh.descripcion, dh.capacidad, dh.servicios_incluidos
    FROM Habitacion h
    LEFT JOIN detalles_habitacion dh ON h.id_habitacion = dh.id_habitacion
    WHERE h.id_habitacion = ?
  `,
    [id],
  )

  if (!rooms.length) {
    return res.status(404).json({
      error: "Habitación no encontrada",
      code: "ROOM_NOT_FOUND",
    })
  }

  const room = rooms[0]
  const amenities = room.servicios_incluidos ? 
    (typeof room.servicios_incluidos === 'string' ? 
      room.servicios_incluidos.split(',').map(item => item.trim()) : 
      room.servicios_incluidos) : 
    ['WiFi', 'TV', 'Aire acondicionado']

  res.json({
    success: true,
    room: {
      id_habitacion: room.id_habitacion,
      numero_habitacion: room.numero_habitacion,
      tipo_habitacion: room.tipo_habitacion,
      estado_habitacion: room.estado_habitacion,
      precio: room.precio,
      descripcion: room.descripcion,
      capacidad: room.capacidad,
      servicios_incluidos: room.servicios_incluidos,
      amenities: amenities
    }
  })
})

// Crear nueva habitación - CORREGIDO
export const createRoom = asyncHandler(async (req, res) => {
  const {
    numero_habitacion,
    tipo_habitacion,
    precio,
    estado_habitacion = 'Disponible',
    descripcion,
    capacidad,
    servicios_incluidos,
  } = req.body

  console.log('🔄 Creating room with data:', req.body)

  // Verificar que no existe habitación con ese número
  const existingRoom = await executeQuery("SELECT id_habitacion FROM Habitacion WHERE numero_habitacion = ?", [
    numero_habitacion,
  ])

  if (existingRoom.length > 0) {
    return res.status(409).json({
      error: "Ya existe una habitación con ese número",
      code: "ROOM_NUMBER_EXISTS",
    })
  }

  // Insertar habitación
  const roomResult = await executeQuery(
    `
    INSERT INTO Habitacion (numero_habitacion, tipo_habitacion, precio, estado_habitacion)
    VALUES (?, ?, ?, ?)
  `,
    [numero_habitacion, tipo_habitacion, precio, estado_habitacion],
  )

  const roomId = roomResult.insertId

  // Insertar detalles si se proporcionan
  if (descripcion || capacidad || servicios_incluidos) {
    await executeQuery(
      `
      INSERT INTO detalles_habitacion (id_habitacion, descripcion, capacidad, servicios_incluidos)
      VALUES (?, ?, ?, ?)
    `,
      [roomId, descripcion || '', capacidad || 2, servicios_incluidos || ''],
    )
  }

  // Obtener la habitación creada
  const [newRoom] = await executeQuery(
    `
    SELECT h.*, dh.descripcion, dh.capacidad, dh.servicios_incluidos
    FROM Habitacion h
    LEFT JOIN detalles_habitacion dh ON h.id_habitacion = dh.id_habitacion
    WHERE h.id_habitacion = ?
  `,
    [roomId],
  )

  const amenities = newRoom.servicios_incluidos ? 
    (typeof newRoom.servicios_incluidos === 'string' ? 
      newRoom.servicios_incluidos.split(',').map(item => item.trim()) : 
      newRoom.servicios_incluidos) : 
    ['WiFi', 'TV', 'Aire acondicionado']

  res.status(201).json({
    success: true,
    message: "Habitación creada exitosamente",
    room: {
      id_habitacion: newRoom.id_habitacion,
      numero_habitacion: newRoom.numero_habitacion,
      tipo_habitacion: newRoom.tipo_habitacion,
      estado_habitacion: newRoom.estado_habitacion,
      precio: newRoom.precio,
      descripcion: newRoom.descripcion,
      capacidad: newRoom.capacidad,
      servicios_incluidos: newRoom.servicios_incluidos,
      amenities: amenities
    }
  })
})

// Actualizar habitación - CORREGIDO
export const updateRoom = asyncHandler(async (req, res) => {
  const { id } = req.params
  const { numero_habitacion, tipo_habitacion, estado_habitacion, precio, descripcion, capacidad, servicios_incluidos } = req.body

  console.log('🔄 Updating room:', id, req.body)

  // Verificar que la habitación existe
  const existingRoom = await executeQuery("SELECT id_habitacion FROM Habitacion WHERE id_habitacion = ?", [id])

  if (!existingRoom.length) {
    return res.status(404).json({
      error: "Habitación no encontrada",
      code: "ROOM_NOT_FOUND",
    })
  }

  // Verificar si el nuevo número de habitación ya existe (excluyendo la actual)
  if (numero_habitacion) {
    const numberCheck = await executeQuery(
      'SELECT id_habitacion FROM Habitacion WHERE numero_habitacion = ? AND id_habitacion != ?',
      [numero_habitacion, id]
    )

    if (numberCheck.length > 0) {
      return res.status(400).json({
        error: "El número de habitación ya existe",
        code: "ROOM_NUMBER_EXISTS",
      })
    }
  }

  // Actualizar habitación
  await executeQuery(
    `
    UPDATE Habitacion 
    SET numero_habitacion = ?, tipo_habitacion = ?, estado_habitacion = ?, precio = ?
    WHERE id_habitacion = ?
  `,
    [numero_habitacion, tipo_habitacion, estado_habitacion, precio, id],
  )

  // Verificar si existen detalles para esta habitación
  const detailRows = await executeQuery(
    'SELECT id_detalle_habitacion FROM detalles_habitacion WHERE id_habitacion = ?',
    [id]
  )

  if (detailRows && detailRows.length > 0) {
    // Actualizar detalles existentes
    await executeQuery(
      `
      UPDATE detalles_habitacion 
      SET descripcion = ?, capacidad = ?, servicios_incluidos = ?
      WHERE id_habitacion = ?
    `,
      [descripcion || '', capacidad || 2, servicios_incluidos || '', id]
    )
  } else {
    // Insertar nuevos detalles
    await executeQuery(
      `
      INSERT INTO detalles_habitacion 
      (descripcion, capacidad, servicios_incluidos, id_habitacion) 
      VALUES (?, ?, ?, ?)
    `,
      [descripcion || '', capacidad || 2, servicios_incluidos || '', id]
    )
  }

  // Obtener la habitación actualizada
  const [updatedRoom] = await executeQuery(
    `
    SELECT h.*, dh.descripcion, dh.capacidad, dh.servicios_incluidos
    FROM Habitacion h
    LEFT JOIN detalles_habitacion dh ON h.id_habitacion = dh.id_habitacion
    WHERE h.id_habitacion = ?
  `,
    [id],
  )

  const amenities = updatedRoom.servicios_incluidos ? 
    (typeof updatedRoom.servicios_incluidos === 'string' ? 
      updatedRoom.servicios_incluidos.split(',').map(item => item.trim()) : 
      updatedRoom.servicios_incluidos) : 
    ['WiFi', 'TV', 'Aire acondicionado']

  res.json({
    success: true,
    message: "Habitación actualizada exitosamente",
    room: {
      id_habitacion: updatedRoom.id_habitacion,
      numero_habitacion: updatedRoom.numero_habitacion,
      tipo_habitacion: updatedRoom.tipo_habitacion,
      estado_habitacion: updatedRoom.estado_habitacion,
      precio: updatedRoom.precio,
      descripcion: updatedRoom.descripcion,
      capacidad: updatedRoom.capacidad,
      servicios_incluidos: updatedRoom.servicios_incluidos,
      amenities: amenities
    }
  })
})

// Eliminar habitación - CORREGIDO
export const deleteRoom = asyncHandler(async (req, res) => {
  const { id } = req.params

  console.log('🔄 Deleting room:', id)

  // Verificar que la habitación existe
  const existingRoom = await executeQuery("SELECT id_habitacion FROM Habitacion WHERE id_habitacion = ?", [id])

  if (!existingRoom.length) {
    return res.status(404).json({
      error: "Habitación no encontrada",
      code: "ROOM_NOT_FOUND",
    })
  }

  // Verificar que no tiene reservas activas
  const activeReservations = await executeQuery(
    `
    SELECT r.id_reserva 
    FROM Reserva r
    WHERE r.id_habitacion = ? AND r.estado_reserva IN ('Pendiente', 'Confirmada')
  `,
    [id],
  )

  if (activeReservations.length > 0) {
    return res.status(400).json({
      error: "No se puede eliminar la habitación porque tiene reservas activas",
      code: "ROOM_HAS_ACTIVE_RESERVATIONS",
    })
  }

  // ELIMINACIÓN REAL - Primero eliminar detalles, luego la habitación
  try {
    // Eliminar detalles primero
    await executeQuery('DELETE FROM detalles_habitacion WHERE id_habitacion = ?', [id])
    
    // Eliminar la habitación
    await executeQuery('DELETE FROM Habitacion WHERE id_habitacion = ?', [id])

    console.log('✅ Room deleted successfully from database')

    res.json({
      success: true,
      message: "Habitación eliminada exitosamente de la base de datos",
    })
  } catch (error) {
    console.error('❌ Error deleting room:', error)
    throw new Error("Error al eliminar la habitación de la base de datos")
  }
})

// Verificar disponibilidad
export const checkAvailability = asyncHandler(async (req, res) => {
  const { fecha_inicio, fecha_fin, tipo_habitacion } = req.query

  if (!fecha_inicio || !fecha_fin) {
    return res.status(400).json({
      error: "Fechas de inicio y fin son requeridas",
      code: "MISSING_DATES",
    })
  }

  // Habitaciones disponibles (no ocupadas en las fechas solicitadas)
  const availableRooms = await executeQuery(
    `
    SELECT h.*, dh.descripcion, dh.capacidad, dh.servicios_incluidos
    FROM Habitacion h
    LEFT JOIN detalles_habitacion dh ON h.id_habitacion = dh.id_habitacion
    WHERE h.estado_habitacion = 'Disponible'
    ${tipo_habitacion ? "AND h.tipo_habitacion = ?" : ""}
    AND h.id_habitacion NOT IN (
      SELECT DISTINCT r.id_habitacion
      FROM Reserva r
      WHERE r.estado_reserva IN ('Confirmada', 'Pendiente')
      AND (
        (r.fecha_inicio <= ? AND r.fecha_fin > ?) OR
        (r.fecha_inicio < ? AND r.fecha_fin >= ?) OR
        (r.fecha_inicio >= ? AND r.fecha_fin <= ?)
      )
    )
    ORDER BY h.precio
  `,
    tipo_habitacion 
      ? [tipo_habitacion, fecha_fin, fecha_inicio, fecha_fin, fecha_inicio, fecha_inicio, fecha_fin]
      : [fecha_fin, fecha_inicio, fecha_fin, fecha_inicio, fecha_inicio, fecha_fin]
  )

  const formattedRooms = availableRooms.map((room) => {
    const amenities = room.servicios_incluidos ? 
      (typeof room.servicios_incluidos === 'string' ? 
        room.servicios_incluidos.split(',').map(item => item.trim()) : 
        room.servicios_incluidos) : 
      ['WiFi', 'TV', 'Aire acondicionado']

    return {
      id_habitacion: room.id_habitacion,
      numero_habitacion: room.numero_habitacion,
      tipo_habitacion: room.tipo_habitacion,
      precio: room.precio,
      estado_habitacion: room.estado_habitacion,
      descripcion: room.descripcion,
      capacidad: room.capacidad,
      servicios_incluidos: room.servicios_incluidos,
      amenities: amenities
    }
  })

  res.json({
    success: true,
    available_rooms: formattedRooms,
    total: availableRooms.length,
  })
})

// Endpoint específico para disponibilidad
export const getRoomAvailability = asyncHandler(async (req, res) => {
  const { fecha_inicio, fecha_fin, tipo_habitacion, huespedes } = req.query

  let whereConditions = ["h.estado_habitacion = 'Disponible'"]
  const params = []

  if (tipo_habitacion) {
    whereConditions.push("h.tipo_habitacion = ?")
    params.push(tipo_habitacion)
  }

  if (huespedes) {
    whereConditions.push("dh.capacidad >= ?")
    params.push(Number.parseInt(huespedes))
  }

  // Si hay fechas, verificar conflictos con reservas
  if (fecha_inicio && fecha_fin) {
    whereConditions.push(`
      h.id_habitacion NOT IN (
        SELECT DISTINCT r.id_habitacion
        FROM Reserva r
        WHERE r.estado_reserva IN ('Confirmada', 'Pendiente')
        AND (
          (r.fecha_inicio <= ? AND r.fecha_fin > ?) OR
          (r.fecha_inicio < ? AND r.fecha_fin >= ?) OR
          (r.fecha_inicio >= ? AND r.fecha_fin <= ?)
        )
      )
    `)
    params.push(fecha_fin, fecha_inicio, fecha_fin, fecha_inicio, fecha_inicio, fecha_fin)
  }

  const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(" AND ")}` : ""

  const availableRooms = await executeQuery(
    `
    SELECT h.*, dh.descripcion, dh.capacidad, dh.servicios_incluidos
    FROM Habitacion h
    LEFT JOIN detalles_habitacion dh ON h.id_habitacion = dh.id_habitacion
    ${whereClause}
    ORDER BY h.precio
  `,
    params
  )

  const formattedRooms = availableRooms.map((room) => {
    const amenities = room.servicios_incluidos ? 
      (typeof room.servicios_incluidos === 'string' ? 
        room.servicios_incluidos.split(',').map(item => item.trim()) : 
        room.servicios_incluidos) : 
      ['WiFi', 'TV', 'Aire acondicionado']

    return {
      id_habitacion: room.id_habitacion,
      numero_habitacion: room.numero_habitacion,
      tipo_habitacion: room.tipo_habitacion,
      precio: room.precio,
      estado_habitacion: room.estado_habitacion,
      descripcion: room.descripcion,
      capacidad: room.capacidad,
      servicios_incluidos: room.servicios_incluidos,
      amenities: amenities
    }
  })

  res.json({
    success: true,
    available_rooms: formattedRooms,
    total: availableRooms.length,
  })
})