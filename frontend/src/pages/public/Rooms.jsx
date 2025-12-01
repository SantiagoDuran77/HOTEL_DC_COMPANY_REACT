import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getRooms } from '../../services/api'
import { Bed, Users, Wifi, Car, Utensils, Waves } from 'lucide-react'

const Rooms = () => {
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    loadRooms()
  }, [])

  const loadRooms = async () => {
    try {
      console.log('🔄 Loading rooms...')
      const roomsData = await getRooms()
      console.log('✅ Rooms loaded:', roomsData)
      setRooms(roomsData)
    } catch (error) {
      console.error('❌ Error loading rooms:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredRooms = rooms.filter(room => 
    filter === 'all' || room.tipo.toLowerCase() === filter.toLowerCase()
  )

  const getAmenityIcon = (amenity) => {
    const amenityLower = amenity.toLowerCase()
    if (amenityLower.includes('wifi')) return <Wifi className="h-4 w-4" />
    if (amenityLower.includes('minibar') || amenityLower.includes('comida')) return <Utensils className="h-4 w-4" />
    if (amenityLower.includes('jacuzzi') || amenityLower.includes('spa')) return <Waves className="h-4 w-4" />
    if (amenityLower.includes('parqueadero') || amenityLower.includes('transporte')) return <Car className="h-4 w-4" />
    return <Bed className="h-4 w-4" />
  }

  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(price)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
          </div>
          <p className="text-center mt-4 text-gray-600">Cargando habitaciones...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Nuestras Habitaciones
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Descubre nuestra selección de habitaciones diseñadas para tu comodidad y relax
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-wrap gap-4 justify-center mb-8">
          <button
            onClick={() => setFilter('all')}
            className={`px-6 py-3 rounded-lg font-medium transition-colors duration-200 ${
              filter === 'all' 
                ? 'bg-primary-500 text-white' 
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            Todas
          </button>
          <button
            onClick={() => setFilter('sencilla')}
            className={`px-6 py-3 rounded-lg font-medium transition-colors duration-200 ${
              filter === 'sencilla' 
                ? 'bg-primary-500 text-white' 
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            Sencillas
          </button>
          <button
            onClick={() => setFilter('doble')}
            className={`px-6 py-3 rounded-lg font-medium transition-colors duration-200 ${
              filter === 'doble' 
                ? 'bg-primary-500 text-white' 
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            Dobles
          </button>
          <button
            onClick={() => setFilter('suite')}
            className={`px-6 py-3 rounded-lg font-medium transition-colors duration-200 ${
              filter === 'suite' 
                ? 'bg-primary-500 text-white' 
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            Suites
          </button>
        </div>

        {/* Debug Info */}
        <div className="mb-4 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Debug:</strong> {rooms.length} habitaciones cargadas, {filteredRooms.length} filtradas
          </p>
        </div>

        {/* Rooms Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredRooms.map((room) => (
            <div key={room.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200">
              <div className="aspect-w-16 aspect-h-9 bg-gray-200 relative h-48">
                <div className="absolute inset-0 bg-gradient-to-br from-primary-500 to-secondary-500 opacity-20"></div>
                <div className="absolute top-4 right-4">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                    room.estado === 'Disponible' 
                      ? 'bg-green-100 text-green-800'
                      : room.estado === 'Ocupada'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {room.estado}
                  </span>
                </div>
                <div className="absolute bottom-4 left-4">
                  <span className="bg-white bg-opacity-90 px-3 py-1 rounded-lg text-sm font-semibold text-gray-900">
                    {formatPrice(room.precio)}/noche
                  </span>
                </div>
              </div>

              <div className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-xl font-semibold text-gray-900">
                    Habitación {room.number}
                  </h3>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                    {room.tipo}
                  </span>
                </div>

                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                  {room.descripcion || 'Habitación cómoda y acogedora para tu estadía.'}
                </p>

                <div className="flex items-center text-sm text-gray-500 mb-4">
                  <Users className="h-4 w-4 mr-1" />
                  <span>Capacidad: {room.capacidad || 2} personas</span>
                </div>

                {room.amenities && room.amenities.length > 0 && (
                  <div className="mb-4">
                    <div className="flex flex-wrap gap-2">
                      {room.amenities.slice(0, 4).map((amenity, index) => (
                        <div
                          key={index}
                          className="flex items-center space-x-1 bg-gray-50 px-2 py-1 rounded-md text-xs text-gray-600"
                          title={amenity}
                        >
                          {getAmenityIcon(amenity)}
                          <span className="truncate max-w-20">{amenity}</span>
                        </div>
                      ))}
                      {room.amenities.length > 4 && (
                        <div className="bg-gray-50 px-2 py-1 rounded-md text-xs text-gray-600">
                          +{room.amenities.length - 4} más
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex space-x-3">
                  <Link
                    to={`/habitaciones/${room.id}`}
                    className="flex-1 bg-primary-500 hover:bg-primary-600 text-white text-center py-2 px-4 rounded-lg font-medium transition-colors duration-200"
                  >
                    Ver Detalles
                  </Link>
                  {room.estado === 'Disponible' && (
                    <Link
                      to="/auth/login"
                      className="flex-1 bg-secondary-500 hover:bg-secondary-600 text-white text-center py-2 px-4 rounded-lg font-medium transition-colors duration-200"
                    >
                      Reservar
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredRooms.length === 0 && (
          <div className="text-center py-12">
            <Bed className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No hay habitaciones disponibles
            </h3>
            <p className="text-gray-600">
              {rooms.length === 0 
                ? 'No se pudieron cargar las habitaciones. Verifica la conexión con el servidor.'
                : 'No encontramos habitaciones que coincidan con tu búsqueda.'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default Rooms