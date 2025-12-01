import express from "express"
import {
  getRoomAvailability,
  createReservationWithPayment,
  getAvailableServices
} from "../controllers/reservationController.js"
import { authenticateToken } from "../middleware/auth.js"

const router = express.Router()

// 🔓 Rutas públicas
router.get("/availability", getRoomAvailability)
router.get("/services", getAvailableServices)

// 🔐 Rutas protegidas
router.post("/create-with-payment", authenticateToken, createReservationWithPayment)

export default router