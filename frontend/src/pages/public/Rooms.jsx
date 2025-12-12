import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getRooms } from '../../services/api'
import { 
  Bed, 
  Users, 
  Wifi, 
  Car, 
  Utensils, 
  Waves, 
  Tv, 
  Wind, 
  Coffee, 
  Bath,
  Snowflake,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Star,
  Eye,
  MapPin,
  DollarSign
} from 'lucide-react'

const Rooms = () => {
  const [rooms, setRooms] = useState([])
  const [filteredRooms, setFilteredRooms] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [roomsPerPage] = useState(6)
  const navigate = useNavigate()
  
  // Estados de filtros
  const [searchTerm, setSearchTerm] = useState('')
  const [priceRange, setPriceRange] = useState([0, 500000])
  const [capacity, setCapacity] = useState('all')
  const [roomType, setRoomType] = useState('all')
  const [showFilters, setShowFilters] = useState(true)
  
  // Estados para carruseles
  const [roomSlides, setRoomSlides] = useState({})

  // Imágenes de ejemplo para las habitaciones
  const defaultRoomImages = {
    1: [
      'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800&h=600&fit=crop'
    ],
    2: [
      'https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1568495248636-6432b97bd949?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800&h=600&fit=crop'
    ],
    3: [
      'https://images.unsplash.com/photo-1564078516393-cf04bd966897?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&h=600&fit=crop'
    ],
    4: [
      'https://images.unsplash.com/photo-1615873968403-89e068629265?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=800&h=600&fit=crop'
    ],
    5: [
      'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&h=600&fit=crop'
    ],
    6: [
      'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?w=800&h=600&fit=crop'
    ]
  }

  useEffect(() => {
    loadRooms()
  }, [])

  // Aplicar filtros cuando cambien
  useEffect(() => {
    applyFilters()
  }, [rooms, searchTerm, priceRange, capacity, roomType])

  const loadRooms = async () => {
    try {
      console.log('🔄 Loading rooms...')
      const roomsData = await getRooms()
      console.log('✅ Rooms loaded:', roomsData)
      
      // Normalizar las habitaciones con imágenes
      const normalizedRooms = roomsData.map((room, index) => {
        const roomId = room.id?.toString() || room.id_habitacion?.toString() || (index + 1).toString()
        
        // Inicializar slide para esta habitación
        setRoomSlides(prev => ({
          ...prev,
          [roomId]: 0
        }))

        return {
          id: roomId,
          name: room.name || `Habitación ${room.number || room.numero_habitacion || (index + 1)}`,
          description: room.description || room.descripcion || 'Habitación cómoda y acogedora para tu estadía.',
          price: Number(room.price) || Number(room.precio) || 50000 + (index * 15000),
          capacity: Number(room.capacity) || Number(room.capacidad) || 2,
          tipo: room.tipo || room.tipo_habitacion || 'Estándar',
          estado: room.estado || room.estado_habitacion || 'Disponible',
          amenities: Array.isArray(room.amenities) ? room.amenities : 
                    (room.servicios_incluidos ? 
                      (typeof room.servicios_incluidos === 'string' ? 
                        room.servicios_incluidos.split(',') : 
                        room.servicios_incluidos) 
                      : ['WiFi', 'TV', 'Aire acondicionado', 'Baño privado']),
          images: room.images || defaultRoomImages[(index % 6) + 1] || defaultRoomImages[1],
          number: room.number?.toString() || room.numero_habitacion?.toString() || (index + 1).toString(),
          rating: 4.0 + (Math.random() * 0.7),
          reviews: Math.floor(Math.random() * 100) + 20
        }
      })
      
      setRooms(normalizedRooms)
      setFilteredRooms(normalizedRooms)
      
      // Calcular rango de precios máximo
      if (normalizedRooms.length > 0) {
        const maxPrice = Math.max(...normalizedRooms.map(r => r.price))
        setPriceRange([0, maxPrice * 1.1])
      }
      
    } catch (error) {
      console.error('❌ Error loading rooms:', error)
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...rooms]

    // Filtro de búsqueda
    if (searchTerm) {
      filtered = filtered.filter(room =>
        room.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        room.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        room.tipo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        room.number.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filtro por precio
    filtered = filtered.filter(room => 
      room.price >= priceRange[0] && room.price <= priceRange[1]
    )

    // Filtro por capacidad
    if (capacity !== 'all') {
      const capValue = parseInt(capacity)
      filtered = filtered.filter(room => room.capacity >= capValue)
    }

    // Filtro por tipo
    if (roomType !== 'all') {
      filtered = filtered.filter(room => 
        room.tipo.toLowerCase() === roomType.toLowerCase()
      )
    }

    setFilteredRooms(filtered)
    setCurrentPage(1) // Resetear a primera página
  }

  const changeRoomSlide = (roomId, direction) => {
    setRoomSlides(prev => {
      const currentSlide = prev[roomId] || 0
      const room = rooms.find(r => r.id === roomId)
      if (!room) return prev
      
      const totalSlides = room.images?.length || 1
      let newSlide
      
      if (direction === 'next') {
        newSlide = (currentSlide + 1) % totalSlides
      } else {
        newSlide = (currentSlide - 1 + totalSlides) % totalSlides
      }
      
      return {
        ...prev,
        [roomId]: newSlide
      }
    })
  }

  // Calcular paginación
  const indexOfLastRoom = currentPage * roomsPerPage
  const indexOfFirstRoom = indexOfLastRoom - roomsPerPage
  const currentRooms = filteredRooms.slice(indexOfFirstRoom, indexOfLastRoom)
  const totalPages = Math.ceil(filteredRooms.length / roomsPerPage)

  const paginate = (pageNumber) => setCurrentPage(pageNumber)

  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(price)
  }

  const getAmenityIcon = (amenity) => {
    const amenityLower = amenity.toLowerCase()
    if (amenityLower.includes('wifi')) return <Wifi className="h-4 w-4" />
    if (amenityLower.includes('minibar') || amenityLower.includes('comida')) return <Utensils className="h-4 w-4" />
    if (amenityLower.includes('jacuzzi') || amenityLower.includes('spa')) return <Waves className="h-4 w-4" />
    if (amenityLower.includes('parqueadero') || amenityLower.includes('transporte')) return <Car className="h-4 w-4" />
    if (amenityLower.includes('tv') || amenityLower.includes('televisión')) return <Tv className="h-4 w-4" />
    if (amenityLower.includes('aire') || amenityLower.includes('clima')) return <Wind className="h-4 w-4" />
    if (amenityLower.includes('café') || amenityLower.includes('desayuno')) return <Coffee className="h-4 w-4" />
    if (amenityLower.includes('baño') || amenityLower.includes('jacuzzi')) return <Bath className="h-4 w-4" />
    if (amenityLower.includes('nevera') || amenityLower.includes('minibar')) return <Snowflake className="h-4 w-4" />
    return <Bed className="h-4 w-4" />
  }

  const resetFilters = () => {
    setSearchTerm('')
    setPriceRange([0, 500000])
    setCapacity('all')
    setRoomType('all')
  }

  const handleViewDetails = (room) => {
    // Usar navigate para redirigir a la página de detalles de la habitación
    // O mostrar un modal si prefieres
    navigate(`/reservar?roomId=${room.id}&price=${room.price}`)
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

      {/* Main Content with Sidebar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar de Filtros */}
          <div className="lg:w-1/4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-4">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">Filtros</h2>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="lg:hidden text-gray-500 hover:text-gray-700"
                >
                  <Filter className="h-5 w-5" />
                </button>
              </div>

              <div className={`space-y-6 ${showFilters ? 'block' : 'hidden lg:block'}`}>
                {/* Búsqueda */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Buscar
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <input
                      type="text"
                      placeholder="Número, tipo, descripción..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>

                {/* Rango de Precio */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rango de Precio
                  </label>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <DollarSign className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600">${priceRange[0].toLocaleString()}</span>
                      <span className="text-gray-400">-</span>
                      <span className="text-sm text-gray-600">${priceRange[1].toLocaleString()}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="range"
                        min="0"
                        max="500000"
                        step="10000"
                        value={priceRange[0]}
                        onChange={(e) => setPriceRange([parseInt(e.target.value), priceRange[1]])}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="range"
                        min="0"
                        max="500000"
                        step="10000"
                        value={priceRange[1]}
                        onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                  </div>
                </div>

                {/* Capacidad */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Capacidad
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {['all', '1', '2', '3', '4', '5', '6'].map((cap) => (
                      <button
                        key={cap}
                        onClick={() => setCapacity(cap)}
                        className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                          capacity === cap
                            ? 'bg-primary-500 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {cap === 'all' ? 'Todas' : `${cap} ${cap === '1' ? 'persona' : 'personas'}`}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tipo de Habitación */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de Habitación
                  </label>
                  <div className="space-y-2">
                    {['all', 'sencilla', 'doble', 'suite', 'ejecutiva', 'familiar', 'presidencial'].map((type) => (
                      <button
                        key={type}
                        onClick={() => setRoomType(type)}
                        className={`w-full py-2 px-3 rounded-lg text-sm font-medium text-left transition-colors ${
                          roomType === type
                            ? 'bg-primary-500 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {type === 'all' ? 'Todos los tipos' : 
                         type === 'sencilla' ? 'Sencilla' :
                         type === 'doble' ? 'Doble' :
                         type === 'suite' ? 'Suite' :
                         type === 'ejecutiva' ? 'Ejecutiva' :
                         type === 'familiar' ? 'Familiar' : 'Presidencial'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Botón reset */}
                <button
                  onClick={resetFilters}
                  className="w-full py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors mt-4"
                >
                  Limpiar filtros
                </button>

                {/* Info */}
                <div className="pt-4 border-t">
                  <p className="text-sm text-gray-600">
                    Mostrando <span className="font-medium">{filteredRooms.length}</span> de{' '}
                    <span className="font-medium">{rooms.length}</span> habitaciones
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Contenido Principal */}
          <div className="lg:w-3/4">
            {/* Header de resultados */}
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Habitaciones Disponibles
                </h2>
                <p className="text-gray-600 mt-1">
                  {filteredRooms.length} resultados encontrados
                </p>
              </div>
            </div>

            {/* Rooms Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {currentRooms.map((room) => {
                const currentSlideIndex = roomSlides[room.id] || 0
                
                return (
                  <div key={room.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200">
                    {/* Carrusel de imágenes */}
                    <div className="relative h-56 bg-gray-200">
                      <img 
                        src={room.images?.[currentSlideIndex] || room.images?.[0]} 
                        alt={room.name}
                        className="w-full h-full object-cover transition-opacity duration-300"
                      />
                      
                      {/* Controles del carrusel */}
                      {room.images && room.images.length > 1 && (
                        <>
                          <button 
                            onClick={() => changeRoomSlide(room.id, 'prev')}
                            className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white/80 text-gray-800 p-1 rounded-full hover:bg-white"
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => changeRoomSlide(room.id, 'next')}
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white/80 text-gray-800 p-1 rounded-full hover:bg-white"
                          >
                            <ChevronRight className="h-4 w-4" />
                          </button>
                          
                          {/* Indicadores */}
                          <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1">
                            {room.images.map((_, index) => (
                              <button
                                key={index}
                                onClick={() => setRoomSlides(prev => ({ ...prev, [room.id]: index }))}
                                className={`h-2 w-2 rounded-full ${index === currentSlideIndex ? 'bg-primary-500' : 'bg-white/70'}`}
                              />
                            ))}
                          </div>
                        </>
                      )}
                      
                      {/* Badges */}
                      <div className="absolute top-3 left-3 flex flex-col gap-2">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                          room.estado === 'Disponible' 
                            ? 'bg-green-100 text-green-800'
                            : room.estado === 'Ocupada'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {room.estado}
                        </span>
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                          {room.tipo}
                        </span>
                      </div>
                      
                      {/* Precio */}
                      <div className="absolute bottom-3 right-3">
                        <span className="bg-white bg-opacity-90 px-3 py-1 rounded-lg text-sm font-semibold text-gray-900">
                          {formatPrice(room.price)}/noche
                        </span>
                      </div>
                    </div>

                    <div className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="text-lg font-semibold text-gray-900">
                          Habitación {room.number}
                        </h3>
                        <div className="flex items-center">
                          <Star className="h-4 w-4 text-yellow-400 mr-1" />
                          <span className="text-sm font-medium">{room.rating?.toFixed(1)}</span>
                        </div>
                      </div>

                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                        {room.description}
                      </p>

                      <div className="flex items-center text-sm text-gray-500 mb-4">
                        <Users className="h-4 w-4 mr-1" />
                        <span>Capacidad: {room.capacity} personas</span>
                      </div>

                      {room.amenities && room.amenities.length > 0 && (
                        <div className="mb-4">
                          <div className="flex flex-wrap gap-2">
                            {room.amenities.slice(0, 3).map((amenity, index) => (
                              <div
                                key={index}
                                className="flex items-center space-x-1 bg-gray-50 px-2 py-1 rounded-md text-xs text-gray-600"
                                title={amenity}
                              >
                                {getAmenityIcon(amenity)}
                                <span className="truncate max-w-20">{amenity}</span>
                              </div>
                            ))}
                            {room.amenities.length > 3 && (
                              <div className="bg-gray-50 px-2 py-1 rounded-md text-xs text-gray-600">
                                +{room.amenities.length - 3} más
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="flex space-x-3 pt-4 border-t">
                        <button
                          onClick={() => handleViewDetails(room)}
                          className="flex-1 bg-primary-500 hover:bg-primary-600 text-white text-center py-2 px-4 rounded-lg font-medium transition-colors duration-200"
                        >
                          Ver Detalles
                        </button>
                        {room.estado === 'Disponible' && (
                          <Link
                            to={`/reservar?roomId=${room.id}&price=${room.price}`}
                            className="flex-1 bg-secondary-500 hover:bg-secondary-600 text-white text-center py-2 px-4 rounded-lg font-medium transition-colors duration-200"
                          >
                            Reservar
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {filteredRooms.length === 0 && (
              <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
                <Bed className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No hay habitaciones disponibles
                </h3>
                <p className="text-gray-600 mb-4">
                  No encontramos habitaciones que coincidan con tus criterios de búsqueda.
                </p>
                <button
                  onClick={resetFilters}
                  className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
                >
                  Limpiar filtros
                </button>
              </div>
            )}

            {/* Paginación */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-8">
                <nav className="flex items-center space-x-2">
                  <button
                    onClick={() => paginate(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    ← Anterior
                  </button>
                  
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum
                    if (totalPages <= 5) {
                      pageNum = i + 1
                    } else if (currentPage <= 3) {
                      pageNum = i + 1
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i
                    } else {
                      pageNum = currentPage - 2 + i
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => paginate(pageNum)}
                        className={`px-4 py-2 rounded-lg transition-colors ${
                          currentPage === pageNum
                            ? 'bg-primary-500 text-white'
                            : 'border border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    )
                  })}
                  
                  <button
                    onClick={() => paginate(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Siguiente →
                  </button>
                </nav>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Rooms