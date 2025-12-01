export const API_BASE_URL = process.env.VITE_API_URL || 'http://localhost:5000/api'

export const ROOM_TYPES = {
  SENCILLA: 'Sencilla',
  DOBLE: 'Doble',
  SUITE: 'Suite'
}

export const ROOM_STATUS = {
  AVAILABLE: 'Disponible',
  OCCUPIED: 'Ocupada',
  MAINTENANCE: 'Mantenimiento'
}

export const RESERVATION_STATUS = {
  PENDING: 'Pendiente',
  CONFIRMED: 'Confirmada',
  CANCELLED: 'Cancelada',
  COMPLETED: 'Completada'
}

export const USER_ROLES = {
  CLIENT: 'Cliente',
  EMPLOYEE: 'Empleado'
}

export const USER_STATUS = {
  ACTIVE: 'Activo',
  INACTIVE: 'Inactivo'
}

export const PAYMENT_METHODS = {
  CASH: 'Efectivo',
  CARD: 'Tarjeta',
  TRANSFER: 'Transferencia'
}