import React, { useState, useEffect } from 'react'
import { getReservations, cancelReservation } from '../../services/api'
import { Calendar, Bed, DollarSign, X, Clock, ChevronLeft, ChevronRight } from 'lucide-react'

const ClientReservations = () => {
  const [reservations, setReservations] = useState([])
  const [loading, setLoading] = useState(true)
  
  // ========== NUEVOS ESTADOS PARA PAGINACIÓN ==========
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(5) // Cambia a 6 si prefieres

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
        // ========== VOLVER A LA PRIMERA PÁGINA AL CANCELAR ==========
        setCurrentPage(1)
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

  // ========== FUNCIONES DE PAGINACIÓN ==========
  
  // Calcular índices para la página actual
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentReservations = reservations.slice(indexOfFirstItem, indexOfLastItem)
  
  // Calcular total de páginas
  const totalPages = Math.ceil(reservations.length / itemsPerPage)
  
  // Cambiar de página
  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1)
    }
  }
  
  const goToPrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
    }
  }
  
  const goToPage = (pageNumber) => {
    setCurrentPage(pageNumber)
  }
  
  // Generar números de página para mostrar
  const getPageNumbers = () => {
    const pageNumbers = []
    const maxPagesToShow = 5
    
    if (totalPages <= maxPagesToShow) {
      // Mostrar todas las páginas
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i)
      }
    } else {
      // Mostrar páginas con elipsis
      if (currentPage <= 3) {
        pageNumbers.push(1, 2, 3, 4, '...', totalPages)
      } else if (currentPage >= totalPages - 2) {
        pageNumbers.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages)
      } else {
        pageNumbers.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages)
      }
    }
    
    return pageNumbers
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
        
        {/* ========== CONTADOR DE RESERVAS ========== */}
        <div className="mt-4 text-sm text-gray-600">
          Mostrando {currentReservations.length} de {reservations.length} reservas
          {reservations.length > itemsPerPage && (
            <span className="ml-2">
              (Página {currentPage} de {totalPages})
            </span>
          )}
        </div>
      </div>

      {/* Reservations List */}
      <div className="space-y-6">
        {currentReservations.map((reservation) => (
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

      {/* ========== COMPONENTE DE PAGINACIÓN ========== */}
      {reservations.length > itemsPerPage && (
        <div className="flex flex-col sm:flex-row items-center justify-between pt-6 border-t border-gray-200">
          {/* Información de página */}
          <div className="text-sm text-gray-700 mb-4 sm:mb-0">
            Mostrando <span className="font-medium">{indexOfFirstItem + 1}</span> a{' '}
            <span className="font-medium">
              {Math.min(indexOfLastItem, reservations.length)}
            </span>{' '}
            de <span className="font-medium">{reservations.length}</span> reservas
          </div>
          
          {/* Controles de paginación */}
          <div className="flex items-center space-x-2">
            {/* Botón anterior */}
            <button
              onClick={goToPrevPage}
              disabled={currentPage === 1}
              className={`inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                currentPage === 1
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-white text-gray-700 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Anterior
            </button>
            
            {/* Números de página */}
            <div className="hidden md:flex space-x-1">
              {getPageNumbers().map((pageNum, index) => (
                <button
                  key={index}
                  onClick={() => typeof pageNum === 'number' ? goToPage(pageNum) : null}
                  className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                    pageNum === currentPage
                      ? 'bg-primary-500 text-white'
                      : pageNum === '...'
                      ? 'text-gray-500 cursor-default'
                      : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                  }`}
                  disabled={pageNum === '...'}
                >
                  {pageNum}
                </button>
              ))}
            </div>
            
            {/* Versión móvil - solo número actual */}
            <div className="md:hidden flex items-center">
              <span className="px-3 py-2 text-sm font-medium text-gray-700">
                Página {currentPage} de {totalPages}
              </span>
            </div>
            
            {/* Botón siguiente */}
            <button
              onClick={goToNextPage}
              disabled={currentPage === totalPages}
              className={`inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                currentPage === totalPages
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-white text-gray-700 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              Siguiente
              <ChevronRight className="h-4 w-4 ml-1" />
            </button>
          </div>
        </div>
      )}

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