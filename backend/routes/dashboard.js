import express from "express"
import { executeQuery } from "../config/database.js"
import { asyncHandler } from "../middleware/errorHandler.js"

const router = express.Router()

// Estadísticas del dashboard
router.get(
  "/stats",
  asyncHandler(async (req, res) => {
    const [
      totalRooms,
      availableRooms,
      totalReservations,
      todayReservations,
      totalRevenue
    ] = await Promise.all([
      executeQuery("SELECT COUNT(*) as total FROM habitacion"),
      executeQuery("SELECT COUNT(*) as total FROM habitacion WHERE estado_habitacion = 'Disponible'"),
      executeQuery("SELECT COUNT(*) as total FROM reserva WHERE estado_reserva = 'Confirmada'"),
      executeQuery("SELECT COUNT(*) as total FROM reserva WHERE DATE(fecha_reserva) = CURDATE()"),
      executeQuery("SELECT SUM(costo_total) as total FROM detalle_reserva")
    ])

    res.json({
      total_rooms: totalRooms[0].total,
      available_rooms: availableRooms[0].total,
      total_reservations: totalReservations[0].total,
      today_reservations: todayReservations[0].total,
      total_revenue: totalRevenue[0].total || 0
    })
  })
)

export default router