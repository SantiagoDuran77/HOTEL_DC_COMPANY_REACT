import React, { useState, useEffect } from 'react'
import { 
  Users, 
  Bed, 
  Calendar, 
  DollarSign,
  TrendingUp,
  TrendingDown
} from 'lucide-react'
import { getRooms, getReservations, getUsers } from '../../services/api'

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalRooms: 0,
    availableRooms: 0,
    totalReservations: 0,
    activeReservations: 0,
    totalRevenue: 0,
    totalUsers: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      const [rooms, reservations, users] = await Promise.all([
        getRooms(),
        getReservations(),
        getUsers()
      ])

      const availableRooms = rooms.filter(room => room.estado === 'Disponible').length
      const activeReservations = reservations.filter(res => 
        res.status === 'Confirmada' || res.status === 'Pendiente'
      ).length
      
      const totalRevenue = reservations.reduce((sum, res) => 
        sum + (res.details?.total_cost || 0), 0
      )

      setStats({
        totalRooms: rooms.length,
        availableRooms,
        totalReservations: reservations.length,
        activeReservations,
        totalRevenue,
        totalUsers: users.length
      })
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

  const statCards = [
    {
      title: 'Total Habitaciones',
      value: stats.totalRooms,
      icon: Bed,
      color: 'blue',
      change: '+2'
    },
    {
      title: 'Habitaciones Disponibles',
      value: stats.availableRooms,
      icon: Bed,
      color: 'green',
      change: '+5%'
    },
    {
      title: 'Total Reservas',
      value: stats.totalReservations,
      icon: Calendar,
      color: 'purple',
      change: '+12%'
    },
    {
      title: 'Reservas Activas',
      value: stats.activeReservations,
      icon: Calendar,
      color: 'orange',
      change: '+3'
    },
    {
      title: 'Ingresos Totales',
      value: formatCurrency(stats.totalRevenue),
      icon: DollarSign,
      color: 'green',
      change: '+8%'
    },
    {
      title: 'Total Usuarios',
      value: stats.totalUsers,
      icon: Users,
      color: 'blue',
      change: '+15%'
    }
  ]

  const getColorClasses = (color) => {
    const colors = {
      blue: 'bg-blue-100 text-blue-600',
      green: 'bg-green-100 text-green-600',
      purple: 'bg-purple-100 text-purple-600',
      orange: 'bg-orange-100 text-orange-600'
    }
    return colors[color] || 'bg-gray-100 text-gray-600'
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-2">
        <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 text-sm mt-1">
          Resumen general del hotel y métricas importantes
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((stat, index) => {
          const IconComponent = stat.icon
          return (
            <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{stat.title}</p>
                  <p className="text-xl font-bold text-gray-900 mt-1">{stat.value}</p>
                  <div className="flex items-center mt-1">
                    {stat.change.startsWith('+') ? (
                      <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                    ) : (
                      <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
                    )}
                    <span className={`text-xs ${
                      stat.change.startsWith('+') ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {stat.change} este mes
                    </span>
                  </div>
                </div>
                <div className={`p-2 rounded-lg ${getColorClasses(stat.color)}`}>
                  <IconComponent className="h-5 w-5" />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Charts Placeholder */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">
            Ocupación por Tipo de Habitación
          </h3>
          <div className="h-48 flex items-center justify-center bg-gray-50 rounded">
            <div className="text-center">
              <div className="text-gray-400 text-2xl mb-2">📊</div>
              <p className="text-sm text-gray-500">Gráfico de ocupación</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">
            Ingresos Mensuales
          </h3>
          <div className="h-48 flex items-center justify-center bg-gray-50 rounded">
            <div className="text-center">
              <div className="text-gray-400 text-2xl mb-2">💵</div>
              <p className="text-sm text-gray-500">Gráfico de ingresos</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">
          Actividad Reciente
        </h3>
        <div className="space-y-3">
          {[1, 2, 3].map((item) => (
            <div key={item} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
              <div className="flex items-center space-x-3">
                <div className="bg-green-100 text-green-600 p-1.5 rounded">
                  <Users className="h-3 w-3" />
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-900">
                    Nueva reserva realizada
                  </p>
                  <p className="text-xs text-gray-500">
                    Habitación 20{item} - Hace 2 horas
                  </p>
                </div>
              </div>
              <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                Completado
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard