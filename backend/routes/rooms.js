import express from "express"
import {
  getRooms,
  getRoomById,
  createRoom,
  updateRoom,
  deleteRoom,
  checkAvailability,
  getRoomAvailability
} from "../controllers/roomController.js"

const router = express.Router()

// 🔓 RUTAS PÚBLICAS (SIN AUTENTICACIÓN - para que los clientes puedan ver habitaciones)
router.get("/", getRooms)
router.get("/availability", checkAvailability)
router.get("/availability/new", getRoomAvailability)
router.get("/:id", getRoomById)

// 🔐 RUTAS PROTEGIDAS SOLO PARA EMPLEADOS/ADMIN (CON AUTENTICACIÓN TEMPORALMENTE DESACTIVADA)
// Por ahora las dejamos públicas para desarrollo, luego agregaremos autenticación
router.post("/", createRoom)
router.put("/:id", updateRoom)
router.delete("/:id", deleteRoom)

export default router