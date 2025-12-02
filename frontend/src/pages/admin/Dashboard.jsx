import React, { useState, useEffect } from 'react'
import { 
  Users, 
  Bed, 
  Calendar, 
  DollarSign,
  TrendingUp,
  TrendingDown,
  UserCheck,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle
} from 'lucide-react'
import { getRooms, getReservations, getUsers, getEmployees } from '../../services/api'
import { Link } from 'react-router-dom'

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalRooms: 0,
    availableRooms: 0,
    occupiedRooms: 0,
    maintenanceRooms: 0,
    totalReservations: 0,
    confirmedReservations: 0,
    pendingReservations: 0,
    cancelledReservations: 0,
    totalRevenue: 0,
    todayRevenue: 0,
    totalUsers: 0,
    activeUsers: 0,
    inactiveUsers: 0,
    totalEmployees: 0,
    activeEmployees: 0
  })
  const [loading, setLoading] = useState(true)
  const [recentReservations, setRecentReservations] = useState([])
  const [recentActivities, setRecentActivities] = useState([])

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      const [rooms, reservations, users, employees] = await Promise.all([
        getRooms(),
        getReservations(),
        getUsers(),
        getEmployees()
      ])

      // ===== ESTADÍSTICAS DE HABITACIONES =====
      const availableRooms = rooms.filter(room => room.estado === 'Disponible').length
      const occupiedRooms = rooms.filter(room => room.estado === 'Ocupada').length
      const maintenanceRooms = rooms.filter(room => room.estado === 'Mantenimiento').length

      // ===== ESTADÍSTICAS DE RESERVAS =====
      const confirmedReservations = reservations.filter(res => res.status === 'Confirmada').length
      const pendingReservations = reservations.filter(res => res.status === 'Pendiente').length
      const cancelledReservations = reservations.filter(res => res.status === 'Cancelada').length
      
      // Calcular ingresos
      const totalRevenue = reservations.reduce((sum, res) => 
        sum + (res.details?.total_cost || 0), 0
      )
      
      // Ingresos de hoy
      const today = new Date().toISOString().split('T')[0]
      const todayRevenue = reservations
        .filter(res => res.booking_date && res.booking_date.includes(today))
        .reduce((sum, res) => sum + (res.details?.total_cost || 0), 0)

      // ===== ESTADÍSTICAS DE USUARIOS =====
      const activeUsers = users.filter(user => user.status === 'Activo').length
      const inactiveUsers = users.filter(user => user.status === 'Inactivo').length
      
      // ===== ESTADÍSTICAS DE EMPLEADOS =====
      const activeEmployees = employees.filter(emp => emp.estado === 'Activo').length

      // ===== RESERVAS RECIENTES (ÚLTIMAS 5) =====
      const recentReservations = reservations
        .sort((a, b) => new Date(b.booking_date || 0) - new Date(a.booking_date || 0))
        .slice(0, 5)

      // ===== ACTIVIDADES RECIENTES =====
      const activities = [
        { type: 'reservation', message: 'Nueva reserva confirmada', time: 'Hace 2 horas', icon: CheckCircle, color: 'green' },
        { type: 'checkin', message: 'Check-in realizado', time: 'Hace 4 horas', icon: CheckCircle, color: 'blue' },
        { type: 'payment', message: 'Pago recibido', time: 'Hace 6 horas', icon: DollarSign, color: 'green' },
        { type: 'maintenance', message: 'Habitación en mantenimiento', time: 'Hace 1 día', icon: AlertCircle, color: 'yellow' },
        { type: 'cancellation', message: 'Reserva cancelada', time: 'Hace 2 días', icon: XCircle, color: 'red' }
      ]

      setStats({
        totalRooms: rooms.length,
        availableRooms,
        occupiedRooms,
        maintenanceRooms,
        totalReservations: reservations.length,
        confirmedReservations,
        pendingReservations,
        cancelledReservations,
        totalRevenue,
        todayRevenue,
        totalUsers: users.length,
        activeUsers,
        inactiveUsers,
        totalEmployees: employees.length,
        activeEmployees
      })
      
      setRecentReservations(recentReservations)
      setRecentActivities(activities)

    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'Fecha no disponible'
    try {
      return new Date(dateString).toLocaleDateString('es-CO', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      })
    } catch {
      return 'Fecha inválida'
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'Confirmada': return 'bg-green-100 text-green-800'
      case 'Pendiente': return 'bg-yellow-100 text-yellow-800'
      case 'Cancelada': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getActivityColor = (color) => {
    switch (color) {
      case 'green': return 'text-green-600 bg-green-100'
      case 'blue': return 'text-blue-600 bg-blue-100'
      case 'yellow': return 'text-yellow-600 bg-yellow-100'
      case 'red': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const statCards = [
    {
      title: 'Total Habitaciones',
      value: stats.totalRooms,
      icon: Bed,
      color: 'blue',
      link: '/admin/habitaciones',
      subItems: [
        { label: 'Disponibles', value: stats.availableRooms, color: 'green' },
        { label: 'Ocupadas', value: stats.occupiedRooms, color: 'red' },
        { label: 'Mantenimiento', value: stats.maintenanceRooms, color: 'yellow' }
      ]
    },
    {
      title: 'Total Reservas',
      value: stats.totalReservations,
      icon: Calendar,
      color: 'purple',
      link: '/admin/reservas',
      subItems: [
        { label: 'Confirmadas', value: stats.confirmedReservations, color: 'green' },
        { label: 'Pendientes', value: stats.pendingReservations, color: 'yellow' },
        { label: 'Canceladas', value: stats.cancelledReservations, color: 'red' }
      ]
    },
    {
      title: 'Ingresos Totales',
      value: formatCurrency(stats.totalRevenue),
      icon: DollarSign,
      color: 'green',
      subItems: [
        { label: 'Hoy', value: formatCurrency(stats.todayRevenue), color: 'blue' }
      ]
    },
    {
      title: 'Usuarios',
      value: stats.totalUsers,
      icon: Users,
      color: 'indigo',
      link: '/admin/usuarios',
      subItems: [
        { label: 'Activos', value: stats.activeUsers, color: 'green' },
        { label: 'Inactivos', value: stats.inactiveUsers, color: 'red' }
      ]
    },
    {
      title: 'Empleados',
      value: stats.totalEmployees,
      icon: UserCheck,
      color: 'orange',
      link: '/admin/empleados',
      subItems: [
        { label: 'Activos', value: stats.activeEmployees, color: 'green' }
      ]
    }
  ]

  const getColorClasses = (color) => {
    const colors = {
      blue: 'bg-blue-100 text-blue-600',
      green: 'bg-green-100 text-green-600',
      purple: 'bg-purple-100 text-purple-600',
      indigo: 'bg-indigo-100 text-indigo-600',
      orange: 'bg-orange-100 text-orange-600',
      red: 'bg-red-100 text-red-600',
      yellow: 'bg-yellow-100 text-yellow-600'
    }
    return colors[color] || 'bg-gray-100 text-gray-600'
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-gray-600">Cargando estadísticas del hotel...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* ===== HEADER DEL DASHBOARD ===== */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Dashboard Administrativo</h1>
          <p className="text-gray-600 mt-1">
            Bienvenido al panel de control del Hotel DC Company
          </p>
        </div>
        <div className="mt-4 md:mt-0">
          <button
            onClick={loadDashboardData}
            className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Actualizar Datos
          </button>
        </div>
      </div>

      {/* ===== TARJETAS DE ESTADÍSTICAS ===== */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        {statCards.map((stat, index) => {
          const IconComponent = stat.icon
          const CardContent = (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all duration-200 hover:border-blue-300">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-lg ${getColorClasses(stat.color)}`}>
                  <IconComponent className="h-6 w-6" />
                </div>
              </div>
              
              <div className="space-y-2">
                {stat.subItems.map((subItem, idx) => (
                  <div key={idx} className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">{subItem.label}</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      subItem.color === 'green' ? 'bg-green-100 text-green-800' :
                      subItem.color === 'red' ? 'bg-red-100 text-red-800' :
                      subItem.color === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                      subItem.color === 'blue' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {subItem.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )

          return stat.link ? (
            <Link key={index} to={stat.link} className="block hover:no-underline">
              {CardContent}
            </Link>
          ) : (
            <div key={index}>
              {CardContent}
            </div>
          )
        })}
      </div>

      {/* ===== SECCIÓN INFERIOR: RESERVAS Y ACTIVIDAD ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* RESERVAS RECIENTES */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Reservas Recientes</h3>
            <Link to="/admin/reservas" className="text-sm text-blue-600 hover:text-blue-800 font-medium">
              Ver todas →
            </Link>
          </div>
          
          {recentReservations.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">No hay reservas recientes</p>
              <p className="text-sm text-gray-400 mt-1">Todas las reservas aparecerán aquí</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentReservations.map((reservation, index) => (
                <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-150">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${
                      reservation.status === 'Confirmada' ? 'bg-green-100 text-green-600' :
                      reservation.status === 'Pendiente' ? 'bg-yellow-100 text-yellow-600' :
                      'bg-red-100 text-red-600'
                    }`}>
                      <Calendar className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        Hab. {reservation.room?.number || 'N/A'} • {reservation.client?.name || 'Cliente'}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {formatDate(reservation.booking_date)} • {formatDate(reservation.start_date)} - {formatDate(reservation.end_date)}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end space-y-1">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(reservation.status)}`}>
                      {reservation.status}
                    </span>
                    <span className="text-sm font-semibold text-gray-900">
                      {formatCurrency(reservation.details?.total_cost || 0)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ACTIVIDAD RECIENTE */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Actividad Reciente</h3>
            <div className="flex items-center text-sm text-gray-500">
              <Clock className="h-4 w-4 mr-1" />
              <span>Últimas actividades</span>
            </div>
          </div>
          
          <div className="space-y-4">
            {recentActivities.map((activity, index) => {
              const IconComponent = activity.icon
              return (
                <div key={index} className="flex items-start space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-150">
                  <div className={`p-2 rounded-lg ${getActivityColor(activity.color)}`}>
                    <IconComponent className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{activity.message}</p>
                    <p className="text-xs text-gray-500">{activity.time}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ===== MÉTRICAS RÁPIDAS ===== */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Tasa de Ocupación</p>
              <p className="text-2xl font-bold mt-1">
                {stats.totalRooms > 0 ? Math.round((stats.occupiedRooms / stats.totalRooms) * 100) : 0}%
              </p>
            </div>
            <Bed className="h-8 w-8 opacity-80" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Confirmación de Reservas</p>
              <p className="text-2xl font-bold mt-1">
                {stats.totalReservations > 0 ? Math.round((stats.confirmedReservations / stats.totalReservations) * 100) : 0}%
              </p>
            </div>
            <CheckCircle className="h-8 w-8 opacity-80" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Ingreso Promedio</p>
              <p className="text-2xl font-bold mt-1">
                {stats.totalReservations > 0 ? formatCurrency(stats.totalRevenue / stats.totalReservations) : '$0'}
              </p>
            </div>
            <DollarSign className="h-8 w-8 opacity-80" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Usuarios Activos</p>
              <p className="text-2xl font-bold mt-1">{stats.activeUsers}</p>
            </div>
            <UserCheck className="h-8 w-8 opacity-80" />
          </div>
        </div>
      </div>

      {/* ===== ACCIONES RÁPIDAS ===== */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Acciones Rápidas</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Link
            to="/admin/habitaciones"
            className="flex flex-col items-center justify-center p-4 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-all duration-200"
          >
            <Bed className="h-8 w-8 text-blue-600 mb-2" />
            <span className="text-sm font-medium text-gray-900">Gestionar Habitaciones</span>
          </Link>
          
          <Link
            to="/admin/reservas"
            className="flex flex-col items-center justify-center p-4 border border-gray-200 rounded-lg hover:bg-green-50 hover:border-green-300 transition-all duration-200"
          >
            <Calendar className="h-8 w-8 text-green-600 mb-2" />
            <span className="text-sm font-medium text-gray-900">Ver Reservas</span>
          </Link>
          
          <Link
            to="/admin/empleados"
            className="flex flex-col items-center justify-center p-4 border border-gray-200 rounded-lg hover:bg-orange-50 hover:border-orange-300 transition-all duration-200"
          >
            <Users className="h-8 w-8 text-orange-600 mb-2" />
            <span className="text-sm font-medium text-gray-900">Gestionar Empleados</span>
          </Link>
          
          <Link
            to="/admin/servicios"
            className="flex flex-col items-center justify-center p-4 border border-gray-200 rounded-lg hover:bg-purple-50 hover:border-purple-300 transition-all duration-200"
          >
            <DollarSign className="h-8 w-8 text-purple-600 mb-2" />
            <span className="text-sm font-medium text-gray-900">Servicios</span>
          </Link>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard