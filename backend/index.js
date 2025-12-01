import express from "express"
import cors from "cors"
import helmet from "helmet"
import compression from "compression"
import morgan from "morgan"
import rateLimit from "express-rate-limit"
import dotenv from "dotenv"

// Importar rutas
import authRoutes from "./routes/auth.js"
import userRoutes from "./routes/users.js"
import roomRoutes from "./routes/rooms.js"
import reservationRoutes from "./routes/reservations.js"
import serviceRoutes from "./routes/services.js"
import paymentRoutes from "./routes/payments.js"
import dashboardRoutes from "./routes/dashboard.js"
import clientRoutes from "./routes/clients.js"
import employeeRoutes from "./routes/employees.js"

// Importar middleware
import { errorHandler } from "./middleware/errorHandler.js"
import { authenticateToken } from "./middleware/auth.js"

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000

// Configuración de seguridad
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
  }),
)

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // máximo 100 requests por ventana de tiempo
  message: "Demasiadas solicitudes desde esta IP, intenta de nuevo más tarde.",
  standardHeaders: true,
  legacyHeaders: false,
})

app.use(limiter)

// ✅ CONFIGURACIÓN CORS CORREGIDA - PERMITIR MÚLTIPLES ORIGINS
app.use(
  cors({
    origin: function (origin, callback) {
      // Lista de origins permitidos
      const allowedOrigins = [
        'http://localhost:3000',
        'http://localhost:5173', 
        'http://localhost:5174',
        'http://127.0.0.1:3000',
        'http://127.0.0.1:5173'
      ];
      
      // Permitir requests sin origin (como mobile apps o curl)
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        console.log('❌ CORS bloqueado para origin:', origin);
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
  })
);

// Middleware básico
app.use(compression())
app.use(morgan("combined"))
app.use(express.json({ limit: "10mb" }))
app.use(express.urlencoded({ extended: true, limit: "10mb" }))

// ==================== RUTAS ====================

// 🔓 RUTAS PÚBLICAS (SIN AUTENTICACIÓN)
app.use("/api/auth", authRoutes)

// 🔓 ACCESO TEMPORAL SIN AUTENTICACIÓN - COMENTA LA SIGUIENTE LÍNEA:
// app.use("/api", authenticateToken)

// 🎯 RUTAS PROTEGIDAS PERO TEMPORALMENTE SIN AUTENTICACIÓN
app.use("/api/users", userRoutes)
app.use("/api/rooms", roomRoutes)
app.use("/api/reservations", reservationRoutes)
app.use("/api/services", serviceRoutes)
app.use("/api/payments", paymentRoutes)
app.use("/api/dashboard", dashboardRoutes)
app.use("/api/clients", clientRoutes)
app.use("/api/employees", employeeRoutes)

// ==================== RUTAS ESPECÍFICAS ====================

// Ruta de salud del servidor
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "development",
    version: "1.0.0"
  })
})

// Ruta de información del sistema
app.get("/api/info", (req, res) => {
  res.json({
    name: "Hotel DC Company API",
    version: "1.0.0",
    description: "Sistema de gestión hotelera",
    environment: process.env.NODE_ENV || "development",
    database: "MySQL",
    features: [
      "Autenticación JWT",
      "Gestión de usuarios",
      "Reservas en línea",
      "Gestión de habitaciones",
      "Sistema de pagos"
    ]
  })
})

// Ruta específica para users (por si acaso)
app.get("/api/users/test", (req, res) => {
  res.json({
    message: "Ruta de usuarios funcionando",
    timestamp: new Date().toISOString(),
    endpoints: [
      "GET /api/users",
      "GET /api/users/:id",
      "POST /api/users",
      "PUT /api/users/:id",
      "DELETE /api/users/:id"
    ]
  })
})

// Ruta de prueba para auth
app.get("/api/auth/test", (req, res) => {
  res.json({
    message: "Sistema de autenticación funcionando",
    timestamp: new Date().toISOString(),
    endpoints: [
      "POST /api/auth/register",
      "POST /api/auth/login", 
      "GET /api/auth/verify-email",
      "POST /api/auth/forgot-password",
      "POST /api/auth/reset-password",
      "GET /api/auth/verify"
    ]
  })
})

// ==================== MANEJO DE ERRORES ====================

// Middleware de manejo de errores
app.use(errorHandler)

// Manejo de rutas no encontradas
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    error: "Ruta no encontrada",
    path: req.originalUrl,
    method: req.method,
    availableRoutes: [
      // Auth
      "POST /api/auth/register",
      "POST /api/auth/login",
      "GET  /api/auth/verify-email", 
      "POST /api/auth/forgot-password",
      "POST /api/auth/reset-password",
      "GET  /api/auth/verify",
      "GET  /api/auth/test",
      
      // Users
      "GET  /api/users",
      "GET  /api/users/:id",
      "POST /api/users",
      "PUT  /api/users/:id", 
      "DELETE /api/users/:id",
      "GET  /api/users/test",
      
      // Rooms
      "GET  /api/rooms",
      "GET  /api/rooms/:id",
      
      // Services
      "GET  /api/services",
      
      // Clients
      "POST /api/clients",
      
      // Reservations
      "POST /api/reservations",
      
      // Employees
      "GET  /api/employees",
      
      // System
      "GET  /api/health",
      "GET  /api/info"
    ]
  })
})

// ==================== INICIAR SERVIDOR ====================

app.listen(PORT, () => {
  console.log(`🚀 Servidor ejecutándose en puerto ${PORT}`)
  console.log(`🌍 Entorno: ${process.env.NODE_ENV || "development"}`)
  console.log(`📊 API disponible en: http://localhost:${PORT}/api`)
  console.log(`🔓 MODO: Autenticación temporalmente desactivada`)
  console.log(`🌐 CORS habilitado para: localhost:3000, localhost:5173, localhost:5174`)
  console.log(``)
  console.log(`📋 RUTAS DE AUTENTICACIÓN DISPONIBLES:`)
  console.log(`   🔐 POST /api/auth/register     - Registrar nuevo usuario`)
  console.log(`   🔐 POST /api/auth/login        - Iniciar sesión`) 
  console.log(`   📧 GET  /api/auth/verify-email - Verificar email`)
  console.log(`   🔑 POST /api/auth/forgot-password - Recuperar contraseña`)
  console.log(`   🔑 POST /api/auth/reset-password  - Restablecer contraseña`)
  console.log(`   ✅ GET  /api/auth/verify       - Verificar token`)
  console.log(`   🧪 GET  /api/auth/test         - Probar auth`)
  console.log(``)
  console.log(`📋 RUTAS DEL SISTEMA:`)
  console.log(`   💚 GET  /api/health            - Salud del servidor`)
  console.log(`   ℹ️  GET  /api/info             - Información del sistema`)
  console.log(`   👥 GET  /api/users             - Gestión de usuarios`)
  console.log(`   🏨 GET  /api/rooms             - Habitaciones`)
  console.log(`   🛎️  GET  /api/services          - Servicios`)
  console.log(`   📅 POST /api/reservations      - Reservas`)
  console.log(`   💰 POST /api/payments          - Pagos`)
  console.log(`   📊 GET  /api/dashboard         - Dashboard`)
  console.log(`   👤 POST /api/clients           - Clientes`)
  console.log(`   👨‍💼 GET  /api/employees         - Empleados`)
  console.log(``)
  console.log(`💡 NOTA: Para activar la autenticación, descomenta la línea en index.js`)
  console.log(`         que dice: app.use("/api", authenticateToken)`)
})

// ==================== MANEJO DE ERRORES GLOBALES ====================

// Manejo de errores no capturados
process.on("unhandledRejection", (err) => {
  console.error("❌ Error no manejado (unhandledRejection):", err)
  process.exit(1)
})

process.on("uncaughtException", (err) => {
  console.error("❌ Excepción no capturada (uncaughtException):", err)
  process.exit(1)
})

// Manejo de cierre graceful
process.on("SIGTERM", () => {
  console.log("🛑 Recibido SIGTERM, cerrando servidor...")
  process.exit(0)
})

process.on("SIGINT", () => {
  console.log("🛑 Recibido SIGINT, cerrando servidor...")
  process.exit(0)
})

export default app