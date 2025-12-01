import express from "express"
import { executeQuery } from "../config/database.js"
import { asyncHandler } from "../middleware/errorHandler.js"

const router = express.Router()

// Obtener todos los pagos
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const payments = await executeQuery(`
      SELECT p.*, f.total_factura, c.nombre_cliente, c.apellido_cliente
      FROM pago p
      JOIN factura f ON p.id_factura = f.id_factura
      JOIN reserva r ON f.id_reserva = r.id_reserva
      JOIN cliente c ON r.id_cliente = c.id_cliente
      ORDER BY p.fecha_pago DESC
    `)

    res.json({
      payments: payments.map(payment => ({
        id: payment.id_pago,
        date: payment.fecha_pago,
        amount: payment.monto_pago,
        method: payment.metodo_pago,
        invoice_total: payment.total_factura,
        client_name: `${payment.nombre_cliente} ${payment.apellido_cliente}`
      }))
    })
  })
)

export default router