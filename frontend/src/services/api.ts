// lib/api.ts
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

// Interfaces basadas en tu base de datos
export interface DatabaseRoom {
  id_habitacion: number
  numero_habitacion: number
  tipo_habitacion: 'Sencilla' | 'Doble' | 'Suite'
  precio: number
  estado_habitacion: 'Disponible' | 'Ocupada' | 'Mantenimiento'
  descripcion?: string
  capacidad?: number
  servicios_incluidos?: string
}

export interface Room {
  id: string
  number: string
  tipo: 'Sencilla' | 'Doble' | 'Suite'
  precio: number
  estado: 'Disponible' | 'Ocupada' | 'Mantenimiento'
  descripcion?: string
  capacidad?: number
  servicios_incluidos?: string
  name?: string
  image?: string
  isAvailable?: boolean
  amenities?: string[]
}

export interface Service {
  id: string
  name: string
  description: string
  price: number
  category: string
  image: string
  nombre_servicio?: string
  descripcion_servicio?: string
  precio_servicio?: number
  disponible?: boolean
}

// Interfaces para usuarios
export interface DatabaseUser {
  id_usuario: number
  correo_usuario: string
  usuario_acceso: 'Cliente' | 'Empleado'
  estado_usuario: 'Activo' | 'Inactivo'
  fecha_registro: string
  contraseña_usuario: string
  nombre_cliente?: string
  apellido_cliente?: string
  telefono_cliente?: string
  direccion_cliente?: string
  nacionalidad?: string
  nombre_empleado?: string
  apellido_empleado?: string
  cargo_empleado?: string
  telefono_empleado?: string
  fecha_contratacion?: string
}

export interface User {
  id: string
  email: string
  role: string
  status: string
  registration_date: string
  name: string
  last_name: string
  phone: string
  address?: string
  nationality?: string
  position?: string
  hire_date?: string
}

// Interfaces para empleados
export interface DatabaseEmployee {
  id_empleado: number
  nombre_empleado: string
  apellido_empleado: string
  correo_empleado: string
  telefono_empleado: string
  cargo_empleado: string
  fecha_contratacion: string
  estado_usuario?: string
}

export interface Employee {
  id: string
  nombre: string
  apellido: string
  email: string
  telefono: string
  cargo: string
  fecha_contratacion: string
  estado?: string
  nombre_completo?: string
}

// Interfaces para reservas
export interface DatabaseReservation {
  id_reserva: number
  fecha_reserva: string
  fecha_inicio: string
  fecha_fin: string
  estado_reserva: 'Pendiente' | 'Confirmada' | 'Cancelada' | 'Completada'
  id_cliente: number
  id_empleado: number
  id_habitacion: number
}

export interface Reservation {
  id: string
  booking_date: string
  start_date: string
  end_date: string
  status: string
  client: {
    id: number
    name: string
    email: string
    phone: string
    address?: string
    nationality?: string
  }
  room: {
    id: number
    number: string
    type: string
    price: number
  }
  details: {
    total_cost: number
    checkin?: string
    checkout?: string
    guests?: number
  }
  employee?: string
  services?: Array<{
    id: string
    name: string
    description: string
    quantity: number
    unit_price: number
    total_price: number
  }>
}

// Función segura para acceder a localStorage (solo en cliente)
const getLocalStorageItem = (key: string): string | null => {
  if (typeof window === 'undefined') {
    return null
  }
  try {
    return localStorage.getItem(key)
  } catch (error) {
    console.error('Error accessing localStorage:', error)
    return null
  }
}

// Función segura para establecer localStorage (solo en cliente)
const setLocalStorageItem = (key: string, value: string): void => {
  if (typeof window === 'undefined') {
    return
  }
  try {
    localStorage.setItem(key, value)
  } catch (error) {
    console.error('Error setting localStorage:', error)
  }
}

// Función segura para remover localStorage (solo en cliente)
const removeLocalStorageItem = (key: string): void => {
  if (typeof window === 'undefined') {
    return
  }
  try {
    localStorage.removeItem(key)
  } catch (error) {
    console.error('Error removing localStorage:', error)
  }
}

// Función auxiliar para obtener headers con autenticación
function getAuthHeaders(): HeadersInit {
  const token = getLocalStorageItem('accessToken')
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json'
  }
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  
  return headers
}

// Función para verificar si el usuario actual es admin/empleado
export function isCurrentUserAdmin(): boolean {
  try {
    const userStr = getLocalStorageItem('user')
    if (!userStr) {
      return false
    }
    
    const user = JSON.parse(userStr)
    
    // Cualquier empleado es considerado admin para el frontend
    const isAdmin = (
      user?.usuario_acceso === 'Empleado' ||
      user?.role === 'Empleado' ||
      user?.cargo_empleado !== undefined ||
      user?.id_empleado !== undefined
    )
    
    return isAdmin
  } catch (error) {
    console.error('Error checking admin status:', error)
    return false
  }
}

// Función para manejar errores de conexión y autenticación
function handleApiError(error: any, context: string): never {
  console.error(`❌ Error in ${context}:`, error)
  
  if (error.name === 'TypeError' && error.message.includes('fetch')) {
    throw new Error('No se puede conectar con el servidor. Verifica que el backend esté corriendo en http://localhost:5000')
  }
  
  if (error.message.includes('Failed to fetch')) {
    throw new Error('Error de conexión. Verifica que el servidor esté funcionando.')
  }
  
  throw error
}

// Función para manejar respuestas de error del backend
async function handleResponseError(response: Response): Promise<never> {
  const errorText = await response.text()
  console.error('❌ Backend error response:', {
    status: response.status,
    statusText: response.statusText,
    errorText
  })
  
  let errorMessage = errorText || `Error ${response.status}: ${response.statusText}`
  
  try {
    const errorData = JSON.parse(errorText)
    errorMessage = errorData.error || errorData.message || errorMessage
  } catch {
    // Si no es JSON, usar el texto plano
  }
  
  // Si es error 401, manejar autenticación
  if (response.status === 401) {
    removeLocalStorageItem('accessToken')
    removeLocalStorageItem('refreshToken')
    removeLocalStorageItem('user')
    
    if (typeof window !== 'undefined') {
      setTimeout(() => {
        window.location.href = '/auth/login?redirect=' + encodeURIComponent(window.location.pathname)
      }, 1000)
    }
    
    throw new Error('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.')
  }
  
  throw new Error(errorMessage)
}

// FUNCIONES PARA HABITACIONES - COMPLETAS Y CORREGIDAS
export async function getRooms(): Promise<Room[]> {
  try {
    console.log('🔄 Fetching rooms from:', `${API_BASE_URL}/rooms`)
    
    const response = await fetch(`${API_BASE_URL}/rooms`, {
      headers: getAuthHeaders(),
    })
    
    console.log('📡 Response status:', response.status)
    
    if (!response.ok) {
      console.error('❌ Error response:', response.status, response.statusText)
      return []
    }
    
    const data = await response.json()
    console.log('📦 Rooms data from backend:', data)
    
    // Manejar la respuesta del backend corregida
    const roomsArray = data.rooms || data.data || data
    
    if (!Array.isArray(roomsArray)) {
      console.error('❌ Expected array but got:', typeof roomsArray)
      return []
    }
    
    console.log('✅ Number of rooms found:', roomsArray.length)
    
    return roomsArray.map((room: any) => {
      const amenities = room.amenities || 
        (room.servicios_incluidos ? 
          (typeof room.servicios_incluidos === 'string' ? 
            room.servicios_incluidos.split(',').map((item: string) => item.trim()) : 
            room.servicios_incluidos) : 
          ['WiFi', 'TV', 'Aire acondicionado'])
      
      const formattedRoom = {
        id: (room.id_habitacion || room.id).toString(),
        number: (room.numero_habitacion || room.numero).toString(),
        tipo: room.tipo_habitacion || room.tipo,
        precio: typeof room.precio === 'number' ? room.precio : parseFloat(room.precio) || 0,
        estado: room.estado_habitacion || room.estado,
        descripcion: room.descripcion || 'Habitación cómoda y acogedora para tu estadía.',
        capacidad: room.capacidad || 2,
        servicios_incluidos: room.servicios_incluidos || 'WiFi, TV, Aire acondicionado',
        name: `Habitación ${room.numero_habitacion || room.numero} - ${room.tipo_habitacion || room.tipo}`,
        isAvailable: (room.estado_habitacion || room.estado) === 'Disponible',
        amenities: amenities
      }
      
      console.log('🏠 Formatted room:', formattedRoom.number)
      return formattedRoom
    })
    
  } catch (error) {
    console.error('❌ Error in getRooms:', error)
    return []
  }
}

export async function getRoomById(id: string): Promise<Room> {
  try {
    const response = await fetch(`${API_BASE_URL}/rooms/${id}`, {
      headers: getAuthHeaders(),
    })
    
    if (!response.ok) {
      throw new Error(`Habitación ${id} no encontrada`)
    }
    
    const roomData = await response.json()
    const room = roomData.room || roomData

    const amenities = room.amenities || 
      (room.servicios_incluidos ? 
        (typeof room.servicios_incluidos === 'string' ? 
          room.servicios_incluidos.split(',').map((item: string) => item.trim()) : 
          room.servicios_incluidos) : 
        ['WiFi', 'TV', 'Aire acondicionado'])

    return {
      id: (room.id_habitacion || room.id).toString(),
      number: (room.numero_habitacion || room.numero).toString(),
      tipo: room.tipo_habitacion || room.tipo,
      precio: typeof room.precio === 'number' ? room.precio : parseFloat(room.precio) || 0,
      estado: room.estado_habitacion || room.estado,
      descripcion: room.descripcion || '',
      capacidad: room.capacidad || 2,
      servicios_incluidos: room.servicios_incluidos || '',
      name: `Habitación ${room.numero_habitacion || room.numero} - ${room.tipo_habitacion || room.tipo}`,
      isAvailable: (room.estado_habitacion || room.estado) === 'Disponible',
      amenities: amenities
    }
  } catch (error) {
    console.error('Error getting room by id:', error)
    throw new Error(`Habitación ${id} no disponible`)
  }
}

// FUNCIONES PARA CREAR, ACTUALIZAR Y ELIMINAR HABITACIONES - IMPLEMENTADAS
export async function createRoom(roomData: Omit<DatabaseRoom, 'id_habitacion'>): Promise<Room> {
  try {
    console.log('🔄 Creating room:', roomData)
    
    const response = await fetch(`${API_BASE_URL}/rooms`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(roomData),
    })

    if (!response.ok) {
      return handleResponseError(response)
    }

    const result = await response.json()
    const room = result.room || result
    
    const amenities = room.amenities || 
      (room.servicios_incluidos ? 
        (typeof room.servicios_incluidos === 'string' ? 
          room.servicios_incluidos.split(',').map((item: string) => item.trim()) : 
          room.servicios_incluidos) : 
        ['WiFi', 'TV', 'Aire acondicionado'])
    
    return {
      id: room.id_habitacion.toString(),
      number: room.numero_habitacion.toString(),
      tipo: room.tipo_habitacion,
      precio: room.precio,
      estado: room.estado_habitacion,
      descripcion: room.descripcion || '',
      capacidad: room.capacidad || 2,
      servicios_incluidos: room.servicios_incluidos || '',
      name: `Habitación ${room.numero_habitacion} - ${room.tipo_habitacion}`,
      isAvailable: room.estado_habitacion === 'Disponible',
      amenities: amenities
    }
  } catch (error: any) {
    console.error('Error in createRoom:', error)
    throw error
  }
}

export async function updateRoom(id: string, roomData: Partial<DatabaseRoom>): Promise<Room> {
  try {
    console.log('🔄 Updating room:', id, roomData)
    
    const response = await fetch(`${API_BASE_URL}/rooms/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(roomData),
    })

    if (!response.ok) {
      return handleResponseError(response)
    }

    const result = await response.json()
    const room = result.room || result
    
    const amenities = room.amenities || 
      (room.servicios_incluidos ? 
        (typeof room.servicios_incluidos === 'string' ? 
          room.servicios_incluidos.split(',').map((item: string) => item.trim()) : 
          room.servicios_incluidos) : 
        ['WiFi', 'TV', 'Aire acondicionado'])
    
    return {
      id: room.id_habitacion.toString(),
      number: room.numero_habitacion.toString(),
      tipo: room.tipo_habitacion,
      precio: room.precio,
      estado: room.estado_habitacion,
      descripcion: room.descripcion || '',
      capacidad: room.capacidad || 2,
      servicios_incluidos: room.servicios_incluidos || '',
      name: `Habitación ${room.numero_habitacion} - ${room.tipo_habitacion}`,
      isAvailable: room.estado_habitacion === 'Disponible',
      amenities: amenities
    }
  } catch (error: any) {
    console.error('Error in updateRoom:', error)
    throw error
  }
}

export async function deleteRoom(id: string): Promise<void> {
  try {
    console.log('🔄 Deleting room:', id)
    
    const response = await fetch(`${API_BASE_URL}/rooms/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    })

    if (!response.ok) {
      return handleResponseError(response)
    }

    console.log('✅ Room deleted successfully')
  } catch (error) {
    return handleApiError(error, 'deleteRoom')
  }
}

// FUNCIONES PARA SERVICIOS
export async function getServices(): Promise<Service[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/services`, {
      headers: getAuthHeaders(),
    })
    
    if (!response.ok) {
      return []
    }
    
    const data = await response.json()
    
    return data.services?.map((service: any) => ({
      id: service.id_servicio?.toString() || service.id?.toString(),
      name: service.nombre_servicio || service.name,
      description: service.descripcion_servicio || service.description,
      price: parseFloat(service.precio_servicio || service.price),
      category: service.category || 'Otros',
      image: '',
      nombre_servicio: service.nombre_servicio,
      descripcion_servicio: service.descripcion_servicio,
      precio_servicio: parseFloat(service.precio_servicio || service.price),
      disponible: service.disponible !== false
    })) || []
  } catch (error) {
    console.error('Error fetching services:', error)
    return []
  }
}

// NUEVAS FUNCIONES PARA EL SISTEMA DE RESERVAS
export async function getAvailableServices(): Promise<Service[]> {
  try {
    console.log('🔄 Fetching available services...')
    
    const response = await fetch(`${API_BASE_URL}/reservations/services`, {
      headers: getAuthHeaders(),
    })
    
    console.log('📡 Services response status:', response.status)
    
    if (!response.ok) {
      console.error('❌ Error fetching services:', response.status)
      return []
    }
    
    const data = await response.json()
    console.log('📦 Services data:', data)
    
    return data.services || []
  } catch (error) {
    console.error('❌ Error in getAvailableServices:', error)
    return []
  }
}

export async function createReservationWithPayment(reservationData: any): Promise<any> {
  try {
    console.log('💳 Creating reservation with payment:', reservationData)
    
    const response = await fetch(`${API_BASE_URL}/reservations/create-with-payment`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(reservationData),
    })

    if (!response.ok) {
      return handleResponseError(response)
    }

    const result = await response.json()
    console.log('✅ Reservation created successfully:', result)
    return result
  } catch (error: any) {
    console.error('❌ Error in createReservationWithPayment:', error)
    throw error
  }
}

export async function checkRoomAvailability(startDate: string, endDate: string, roomType?: string, guests?: number): Promise<Room[]> {
  try {
    const params = new URLSearchParams({
      start_date: startDate,
      end_date: endDate
    })
    
    if (roomType && roomType !== 'all') {
      params.append('room_type', roomType)
    }
    
    if (guests) {
      params.append('guests', guests.toString())
    }

    const response = await fetch(`${API_BASE_URL}/reservations/availability?${params}`, {
      headers: getAuthHeaders(),
    })

    if (!response.ok) {
      return []
    }

    const data = await response.json()
    return data.available_rooms || []
  } catch (error) {
    console.error('Error checking room availability:', error)
    return []
  }
}

// FUNCIONES PARA RESERVAS
export async function getReservations(): Promise<Reservation[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/reservations`, {
      headers: getAuthHeaders(),
    })
    
    if (!response.ok) {
      return []
    }
    
    const data = await response.json()
    return data.reservations || []
    
  } catch (error) {
    console.error('Error loading reservations:', error)
    return []
  }
}

export async function createReservation(reservationData: any): Promise<any> {
  try {
    const response = await fetch(`${API_BASE_URL}/reservations`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(reservationData),
    })

    if (!response.ok) {
      return handleResponseError(response)
    }

    const result = await response.json()
    return result
    
  } catch (error: any) {
    console.error('Error in createReservation:', error)
    throw error
  }
}

export async function cancelReservation(id: string): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/reservations/${id}/cancel`, {
      method: 'PUT',
      headers: getAuthHeaders(),
    })

    if (!response.ok) {
      return handleResponseError(response)
    }
    
    console.log('✅ Reservation cancelled successfully')
  } catch (error) {
    return handleApiError(error, 'cancelReservation')
  }
}

export async function updateReservationStatus(id: string, status: string): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/reservations/${id}/status`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status }),
    })

    if (!response.ok) {
      return handleResponseError(response)
    }
    
    console.log('✅ Reservation status updated successfully')
  } catch (error) {
    return handleApiError(error, 'updateReservationStatus')
  }
}

// FUNCIONES PARA USUARIOS
export async function getUsers(): Promise<User[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/users`, {
      headers: getAuthHeaders(),
    })
    
    if (!response.ok) {
      return []
    }
    
    const data = await response.json()
    return data.users || []
    
  } catch (error) {
    console.error('Error loading users:', error)
    return []
  }
}

// FUNCIONES PARA EMPLEADOS
export async function getEmployees(): Promise<Employee[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/employees`, {
      headers: getAuthHeaders(),
    })
    
    if (!response.ok) {
      return []
    }
    
    const data = await response.json()
    return (data.employees || []).map((emp: DatabaseEmployee) => ({
      id: emp.id_empleado.toString(),
      nombre: emp.nombre_empleado,
      apellido: emp.apellido_empleado,
      email: emp.correo_empleado,
      telefono: emp.telefono_empleado || '',
      cargo: emp.cargo_empleado,
      fecha_contratacion: emp.fecha_contratacion,
      estado: emp.estado_usuario || 'Activo',
      nombre_completo: `${emp.nombre_empleado} ${emp.apellido_empleado}`
    }))
    
  } catch (error) {
    return handleApiError(error, 'getEmployees')
  }
}

// Función para obtener el usuario actual
export function getCurrentUser(): any {
  try {
    const userStr = getLocalStorageItem('user')
    if (!userStr) {
      return null
    }
    return JSON.parse(userStr)
  } catch (error) {
    console.error('Error getting current user:', error)
    return null
  }
}

// Función para cerrar sesión
export function logout(): void {
  removeLocalStorageItem('accessToken')
  removeLocalStorageItem('refreshToken')
  removeLocalStorageItem('user')
  if (typeof window !== 'undefined') {
    window.location.href = '/auth/login'
  }
}

// Función para verificar autenticación
export function isAuthenticated(): boolean {
  const token = getLocalStorageItem('accessToken')
  const user = getLocalStorageItem('user')
  return !!token && !!user
}

// Funciones placeholder para compatibilidad
export async function getServiceById(id: string): Promise<Service> {
  throw new Error('Función no implementada')
}

export async function getReservationById(id: string): Promise<Reservation> {
  throw new Error('Función no implementada')
}

export async function updateReservation(id: string, reservationData: any): Promise<any> {
  throw new Error('Función no implementada')
}

export async function deleteReservation(id: string): Promise<void> {
  throw new Error('Función no implementada')
}

export async function getUserById(id: string): Promise<User> {
  throw new Error('Función no implementada')
}

export async function createUser(userData: any): Promise<User> {
  throw new Error('Función no implementada')
}

export async function updateUser(id: string, userData: any): Promise<User> {
  throw new Error('Función no implementada')
}

export async function deleteUser(id: string): Promise<void> {
  throw new Error('Función no implementada')
}

export async function updateUserStatus(id: string, status: string): Promise<void> {
  throw new Error('Función no implementada')
}

export async function getEmployeeById(id: string): Promise<Employee> {
  throw new Error('Función no implementada')
}

export async function createEmployee(employeeData: Omit<Employee, 'id' | 'nombre_completo'>): Promise<Employee> {
  throw new Error('Función no implementada')
}

export async function updateEmployee(id: string, employeeData: Partial<Employee>): Promise<Employee> {
  throw new Error('Función no implementada')
}

export async function deleteEmployee(id: string): Promise<void> {
  throw new Error('Función no implementada')
}

export async function updateEmployeeStatus(id: string, status: string): Promise<void> {
  throw new Error('Función no implementada')
}

// Servicios de autenticación (para compatibilidad)
export const authAPI = {
  login: async (credentials: any) => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    })
    return response.json()
  },

  register: async (userData: any) => {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    })
    return response.json()
  },

  forgotPassword: async (email: string) => {
    const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    })
    return response.json()
  },

  resetPassword: async (token: string, newPassword: string) => {
    const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token, newPassword }),
    })
    return response.json()
  }
}

// Servicios del dashboard
export const dashboardAPI = {
  getStats: async () => {
    const response = await fetch(`${API_BASE_URL}/dashboard/stats`, {
      headers: getAuthHeaders(),
    })
    return response.json()
  }
}