import express from "express"
import { executeQuery } from "../config/database.js"
import { asyncHandler } from "../middleware/errorHandler.js"

const router = express.Router()

// Obtener todos los servicios
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const services = await executeQuery(`
      SELECT * FROM servicio 
      ORDER BY nombre_servicio
    `)

    console.log('📋 Found services:', services.length)

    const formattedServices = services.map(service => ({
      id: service.id_servicio.toString(),
      name: service.nombre_servicio,
      description: service.descripcion_servicio,
      price: parseFloat(service.precio_servicio),
      category: getCategoryFromService(service.nombre_servicio),
      duration: getDurationFromService(service.nombre_servicio),
      icon: getIconFromService(service.nombre_servicio),
      isPopular: service.precio_servicio > 50000 || service.nombre_servicio.toLowerCase().includes('masaje') || service.nombre_servicio.toLowerCase().includes('cena')
    }))

    res.json({
      services: formattedServices
    })
  })
)

// Helper functions
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
  
  if (lowerName.includes('masaje') || lowerName.includes('spa')) return 'waves'
  if (lowerName.includes('desayuno') || lowerName.includes('almuerzo') || lowerName.includes('cena')) return 'utensils'
  if (lowerName.includes('transporte') || lowerName.includes('tour') || lowerName.includes('parqueadero')) return 'car'
  if (lowerName.includes('limpieza') || lowerName.includes('lavandería') || lowerName.includes('lavanderia') || lowerName.includes('mascota')) return 'users'
  if (lowerName.includes('gimnasio') || lowerName.includes('piscina')) return 'dumbbell'
  if (lowerName.includes('wifi') || lowerName.includes('llamada')) return 'wifi'
  
  return 'star'
}

export default router