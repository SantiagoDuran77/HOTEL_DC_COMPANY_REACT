import React, { useState, useEffect } from 'react'
import { getReservations, cancelReservation } from '../../services/api'
import { Calendar, Bed, DollarSign, X, Clock } from 'lucide-react'

const ClientReservations = () => {
  const [reservations, setReservations] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadReservations()
  }, [])

  const loadReservations = async () => {
    try {
      const reservationsData = await getReservations()
      setReservations(reservationsData)
    } catch (error) {
      console.error('Error loading reservations:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = async (reservationId) => {
    if (window.confirm('¿Estás seguro de que quieres cancelar esta reserva?')) {
      try {
        await cancelReservation(reservationId)
        await loadReservations()
      } catch (error) {
        console.error('Error canceling reservation:', error)
        alert('No se pudo cancelar la reserva. Intenta nuevamente.')
      }
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

  const canCancel = (status, startDate) => {
    if (status === 'Cancelada' || status === 'Completada') return false
    const today = new Date()
    const reservationStart = new Date(startDate)
    const diffTime = reservationStart - today
    const diffDays = diffTime / (1000 * 60 * 60 * 24)
    return diffDays >= 1 // Puede cancelar hasta 1 día antes
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
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Mis Reservas</h1>
        <p className="text-gray-600 mt-2">
          Gestiona y revisa todas tus reservas
        </p>
      </div>

      {/* Reservations List */}
      <div className="space-y-6">
        {reservations.map((reservation) => (
          <div key={reservation.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="bg-primary-100 text-primary-600 p-3 rounded-lg">
                    <Calendar className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Reserva #{reservation.id}
                    </h3>
                    <p className="text-sm text-gray-600">
                      Creada el {formatDate(reservation.booking_date)}
                    </p>
                  </div>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(reservation.status)}`}>
                    {reservation.status}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="flex items-center space-x-3">
                    <div className="bg-gray-100 p-2 rounded-lg">
                      <Bed className="h-4 w-4 text-gray-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Habitación {reservation.room.number}</p>
                      <p className="text-xs text-gray-600 capitalize">{reservation.room.type}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600">Fecha de estadía</p>
                    <p className="text-sm font-medium text-gray-900">
                      {formatDate(reservation.start_date)} - {formatDate(reservation.end_date)}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600">Huéspedes</p>
                    <p className="text-sm font-medium text-gray-900">
                      {reservation.details?.guests || 1} persona(s)
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600">Total</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {formatCurrency(reservation.details.total_cost)}
                    </p>
                  </div>
                </div>

                {reservation.services && reservation.services.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm text-gray-600 mb-2">Servicios adicionales:</p>
                    <div className="flex flex-wrap gap-2">
                      {reservation.services.map((service, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                        >
                          {service.name} (x{service.quantity})
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-4 lg:mt-0 lg:ml-6">
                <div className="flex flex-col space-y-2">
                  {canCancel(reservation.status, reservation.start_date) && (
                    <button
                      onClick={() => handleCancel(reservation.id)}
                      className="flex items-center justify-center px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-lg transition-colors duration-200"
                    >
                      <X className="h-4 w-4 mr-1" />
                      Cancelar
                    </button>
                  )}
                  
                  {reservation.status === 'Confirmada' && (
                    <div className="flex items-center text-sm text-green-600">
                      <Clock className="h-4 w-4 mr-1" />
                      Confirmada
                    </div>
                  )}

                  {reservation.status === 'Pendiente' && (
                    <div className="flex items-center text-sm text-yellow-600">
                      <Clock className="h-4 w-4 mr-1" />
                      Pendiente de confirmación
                    </div>
                  )}

                  {reservation.status === 'Cancelada' && (
                    <div className="flex items-center text-sm text-red-600">
                      <X className="h-4 w-4 mr-1" />
                      Cancelada
                    </div>
                  )}

                  {reservation.status === 'Completada' && (
                    <div className="flex items-center text-sm text-blue-600">
                      <Calendar className="h-4 w-4 mr-1" />
                      Completada
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {reservations.length === 0 && (
        <div className="text-center py-12">
          <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No tienes reservas
          </h3>
          <p className="text-gray-600">
            Comienza explorando nuestras habitaciones disponibles y haz tu primera reserva.
          </p>
        </div>
      )}
    </div>
  )
}

export default ClientReservations