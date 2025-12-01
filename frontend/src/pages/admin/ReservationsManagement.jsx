import React, { useState, useEffect } from 'react'
import { getReservations, updateReservationStatus, cancelReservation } from '../../services/api'
import { Calendar, User, Bed, Search, Filter, MoreVertical } from 'lucide-react'

const ReservationsManagement = () => {
  const [reservations, setReservations] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

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

  const filteredReservations = reservations.filter(reservation =>
    (reservation.client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
     reservation.room.number.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (statusFilter === 'all' || reservation.status === statusFilter)
  )

  const handleStatusChange = async (reservationId, newStatus) => {
    try {
      await updateReservationStatus(reservationId, newStatus)
      await loadReservations()
    } catch (error) {
      console.error('Error updating reservation status:', error)
    }
  }

  const handleCancel = async (reservationId) => {
    if (window.confirm('¿Estás seguro de que quieres cancelar esta reserva?')) {
      try {
        await cancelReservation(reservationId)
        await loadReservations()
      } catch (error) {
        console.error('Error canceling reservation:', error)
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

  const statusOptions = [
    { value: 'all', label: 'Todos los estados' },
    { value: 'Pendiente', label: 'Pendiente' },
    { value: 'Confirmada', label: 'Confirmada' },
    { value: 'Cancelada', label: 'Cancelada' },
    { value: 'Completada', label: 'Completada' }
  ]

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
        <h1 className="text-3xl font-bold text-gray-900">Gestión de Reservas</h1>
        <p className="text-gray-600 mt-2">
          Administra todas las reservas del hotel
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Buscar por cliente o habitación..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent appearance-none"
            >
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Reservations Grid */}
      <div className="grid grid-cols-1 gap-6">
        {filteredReservations.map((reservation) => (
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
                      {formatDate(reservation.booking_date)}
                    </p>
                  </div>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(reservation.status)}`}>
                    {reservation.status}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="flex items-center space-x-3">
                    <div className="bg-gray-100 p-2 rounded-lg">
                      <User className="h-4 w-4 text-gray-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{reservation.client.name}</p>
                      <p className="text-xs text-gray-600">{reservation.client.email}</p>
                    </div>
                  </div>

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
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {formatCurrency(reservation.details.total_cost)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-4 lg:mt-0 lg:ml-6">
                <div className="flex flex-col space-y-2">
                  {reservation.status === 'Pendiente' && (
                    <>
                      <button
                        onClick={() => handleStatusChange(reservation.id, 'Confirmada')}
                        className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white text-sm font-medium rounded-lg transition-colors duration-200"
                      >
                        Confirmar
                      </button>
                      <button
                        onClick={() => handleCancel(reservation.id)}
                        className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-lg transition-colors duration-200"
                      >
                        Cancelar
                      </button>
                    </>
                  )}
                  
                  {reservation.status === 'Confirmada' && (
                    <>
                      <button
                        onClick={() => handleStatusChange(reservation.id, 'Completada')}
                        className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors duration-200"
                      >
                        Marcar Completada
                      </button>
                      <button
                        onClick={() => handleCancel(reservation.id)}
                        className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-lg transition-colors duration-200"
                      >
                        Cancelar
                      </button>
                    </>
                  )}

                  {reservation.status === 'Completada' && (
                    <span className="px-4 py-2 bg-gray-100 text-gray-600 text-sm font-medium rounded-lg text-center">
                      Finalizada
                    </span>
                  )}

                  {reservation.status === 'Cancelada' && (
                    <span className="px-4 py-2 bg-gray-100 text-gray-600 text-sm font-medium rounded-lg text-center">
                      Cancelada
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredReservations.length === 0 && (
        <div className="text-center py-12">
          <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No hay reservas
          </h3>
          <p className="text-gray-600">
            {searchTerm || statusFilter !== 'all' 
              ? 'No se encontraron reservas que coincidan con tu búsqueda.' 
              : 'No hay reservas registradas en el sistema.'
            }
          </p>
        </div>
      )}
    </div>
  )
}

export default ReservationsManagement