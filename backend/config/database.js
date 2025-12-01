import mysql from "mysql2/promise"
import dotenv from "dotenv"

dotenv.config()

const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "hoteldccompany",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  acquireTimeout: 60000,
  timeout: 60000,
  reconnect: true,
  charset: "utf8mb4",
}

// Crear pool de conexiones
const pool = mysql.createPool(dbConfig)

// Función para probar la conexión
export const testConnection = async () => {
  try {
    const connection = await pool.getConnection()
    console.log("✅ Conexión a MySQL establecida correctamente")
    console.log(`📊 Base de datos: ${dbConfig.database}`)
    console.log(`🏠 Host: ${dbConfig.host}`)
    connection.release()
    return true
  } catch (error) {
    console.error("❌ Error conectando a MySQL:", error.message)
    return false
  }
}

// Función para ejecutar queries
export const executeQuery = async (query, params = []) => {
  try {
    const [results] = await pool.execute(query, params)
    return results
  } catch (error) {
    console.error("Error ejecutando query:", error)
    throw error
  }
}

// Función para transacciones
export const executeTransaction = async (queries) => {
  const connection = await pool.getConnection()
  try {
    await connection.beginTransaction()

    const results = []
    for (const { query, params } of queries) {
      const [result] = await connection.execute(query, params)
      results.push(result)
    }

    await connection.commit()
    return results
  } catch (error) {
    await connection.rollback()
    throw error
  } finally {
    connection.release()
  }
}

// Inicializar conexión al importar
testConnection()

export default pool
