import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getReservations } from '../../services/api'
import { Calendar, Bed, Clock, ArrowRight } from 'lucide-react'

const ClientDashboard = () => {
  const [reservations, setReservations] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadReservations()
  }, [])

  const loadReservations = async () => {
    try {
      const reservationsData = await getReservations()
      // Filtrar solo las reservas del usuario actual
      setReservations(reservationsData.slice(0, 3)) // Mostrar solo las 3 más recientes
    } catch (error) {
      console.error('Error loading reservations:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-CO')
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'Confirmada': return 'bg-green-100 text-green-800'
      case 'Pendiente': return 'bg-yellow-100 text-yellow-800'
      case 'Cancelada': return 'bg-red-100 text-red-800'
      case 'Completada': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-2xl p-8 text-white">
        <h1 className="text-3xl font-bold mb-2">Bienvenido de vuelta</h1>
        <p className="text-primary-100 text-lg">
          Esperamos que tengas una excelente experiencia con nosotros
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="bg-primary-100 text-primary-600 p-3 rounded-lg mr-4">
              <Calendar className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total Reservas</p>
              <p className="text-2xl font-bold text-gray-900">{reservations.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="bg-green-100 text-green-600 p-3 rounded-lg mr-4">
              <Bed className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Próxima Reserva</p>
              <p className="text-lg font-bold text-gray-900">
                {reservations.length > 0 ? formatDate(reservations[0].start_date) : 'No hay'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="bg-blue-100 text-blue-600 p-3 rounded-lg mr-4">
              <Clock className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Estado</p>
              <p className="text-lg font-bold text-gray-900">
                {reservations.some(r => r.status === 'Confirmada') ? 'Activo' : 'Sin reservas'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Reservations */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Reservas Recientes</h2>
          <Link
            to="/cliente/reservas"
            className="flex items-center text-primary-600 hover:text-primary-700 font-medium"
          >
            Ver todas
            <ArrowRight className="h-4 w-4 ml-1" />
          </Link>
        </div>

        <div className="space-y-4">
          {reservations.map((reservation) => (
            <div key={reservation.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200">
              <div className="flex items-center space-x-4">
                <div className="bg-primary-100 text-primary-600 p-3 rounded-lg">
                  <Bed className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">
                    Habitación {reservation.room.number} - {reservation.room.type}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {formatDate(reservation.start_date)} - {formatDate(reservation.end_date)}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(reservation.status)}`}>
                  {reservation.status}
                </span>
                <span className="font-semibold text-gray-900">
                  {formatCurrency(reservation.details.total_cost)}
                </span>
              </div>
            </div>
          ))}
        </div>

        {reservations.length === 0 && (
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No tienes reservas
            </h3>
            <p className="text-gray-600 mb-4">
              Comienza explorando nuestras habitaciones disponibles
            </p>
            <Link
              to="/habitaciones"
              className="inline-flex items-center px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-lg transition-colors duration-200"
            >
              <Bed className="h-4 w-4 mr-2" />
              Ver Habitaciones
            </Link>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Acciones Rápidas
          </h3>
          <div className="space-y-3">
            <Link
              to="/habitaciones"
              className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200"
            >
              <span className="font-medium text-gray-900">Nueva Reserva</span>
              <ArrowRight className="h-4 w-4 text-gray-400" />
            </Link>
            <Link
              to="/cliente/perfil"
              className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200"
            >
              <span className="font-medium text-gray-900">Actualizar Perfil</span>
              <ArrowRight className="h-4 w-4 text-gray-400" />
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Servicios Disponibles
          </h3>
          <div className="space-y-3">
            <Link
              to="/servicios"
              className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200"
            >
              <span className="font-medium text-gray-900">Spa & Bienestar</span>
              <ArrowRight className="h-4 w-4 text-gray-400" />
            </Link>
            <Link
              to="/servicios"
              className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200"
            >
              <span className="font-medium text-gray-900">Restaurante</span>
              <ArrowRight className="h-4 w-4 text-gray-400" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ClientDashboard