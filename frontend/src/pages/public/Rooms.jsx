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
  MapPin,
  DollarSign,
  ChevronDown,
  ChevronUp,
  X,
  Check,
  Plus,
  Minus,
  Calendar,
  Eye,
  Heart
} from 'lucide-react'

const Rooms = () => {
  const [rooms, setRooms] = useState([])
  const [filteredRooms, setFilteredRooms] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [roomsPerPage] = useState(6)
  const navigate = useNavigate()
  
  // Estados de filtros desplegables
  const [searchTerm, setSearchTerm] = useState('')
  const [priceRange, setPriceRange] = useState([0, 500000])
  const [capacity, setCapacity] = useState('all')
  const [roomType, setRoomType] = useState('all')
  const [amenitiesFilter, setAmenitiesFilter] = useState([])
  const [sortBy, setSortBy] = useState('default')
  const [showFilters, setShowFilters] = useState(true)
  
  // Estados para secciones desplegables
  const [openSections, setOpenSections] = useState({
    price: true,
    capacity: true,
    type: true,
    amenities: true,
    sort: false
  })
  
  // Estados para carruseles
  const [roomSlides, setRoomSlides] = useState({})
  const [favorites, setFavorites] = useState([])

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

  // Lista de comodidades disponibles
  const availableAmenities = [
    { id: 'wifi', name: 'WiFi', icon: <Wifi className="h-4 w-4" /> },
    { id: 'tv', name: 'TV', icon: <Tv className="h-4 w-4" /> },
    { id: 'ac', name: 'Aire Acondicionado', icon: <Wind className="h-4 w-4" /> },
    { id: 'desayuno', name: 'Desayuno Incluido', icon: <Coffee className="h-4 w-4" /> },
    { id: 'jacuzzi', name: 'Jacuzzi', icon: <Waves className="h-4 w-4" /> },
    { id: 'parking', name: 'Parqueadero', icon: <Car className="h-4 w-4" /> },
    { id: 'minibar', name: 'Minibar', icon: <Utensils className="h-4 w-4" /> },
    { id: 'nevera', name: 'Nevera', icon: <Snowflake className="h-4 w-4" /> },
    { id: 'baño_privado', name: 'Baño Privado', icon: <Bath className="h-4 w-4" /> },
    { id: 'vistas', name: 'Vistas al Mar', icon: <Eye className="h-4 w-4" /> }
  ]

  // Opciones de ordenamiento
  const sortOptions = [
    { value: 'default', label: 'Recomendado' },
    { value: 'price_asc', label: 'Precio: Menor a Mayor' },
    { value: 'price_desc', label: 'Precio: Mayor a Menor' },
    { value: 'capacity_desc', label: 'Capacidad: Mayor a Menor' },
    { value: 'rating_desc', label: 'Mejor Calificadas' }
  ]

  useEffect(() => {
    loadRooms()
  }, [])

  // Aplicar filtros cuando cambien
  useEffect(() => {
    applyFilters()
  }, [rooms, searchTerm, priceRange, capacity, roomType, amenitiesFilter, sortBy])

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

    // Filtro por comodidades
    if (amenitiesFilter.length > 0) {
      filtered = filtered.filter(room => {
        return amenitiesFilter.every(amenity => 
          room.amenities.some(rAmenity => 
            rAmenity.toLowerCase().includes(amenity.toLowerCase())
          )
        )
      })
    }

    // Ordenamiento
    switch (sortBy) {
      case 'price_asc':
        filtered.sort((a, b) => a.price - b.price)
        break
      case 'price_desc':
        filtered.sort((a, b) => b.price - a.price)
        break
      case 'capacity_desc':
        filtered.sort((a, b) => b.capacity - a.capacity)
        break
      case 'rating_desc':
        filtered.sort((a, b) => b.rating - a.rating)
        break
      default:
        // Mantener orden por defecto
        break
    }

    setFilteredRooms(filtered)
    setCurrentPage(1) // Resetear a primera página
  }

  const toggleSection = (section) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  const toggleAmenity = (amenity) => {
    setAmenitiesFilter(prev => {
      if (prev.includes(amenity)) {
        return prev.filter(a => a !== amenity)
      } else {
        return [...prev, amenity]
      }
    })
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

  const toggleFavorite = (roomId) => {
    setFavorites(prev => {
      if (prev.includes(roomId)) {
        return prev.filter(id => id !== roomId)
      } else {
        return [...prev, roomId]
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
    setAmenitiesFilter([])
    setSortBy('default')
  }

  const handleViewDetails = (room) => {
    navigate(`/reservar?roomId=${room.id}&price=${room.price}`)
  }

  const handlePriceChange = (min, max) => {
    setPriceRange([min, max])
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
          {/* Sidebar de Filtros Mejorado */}
          <div className="lg:w-1/4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-4">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">Filtros</h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={resetFilters}
                    className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                  >
                    Limpiar todo
                  </button>
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="lg:hidden text-gray-500 hover:text-gray-700"
                  >
                    {showFilters ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div className={`space-y-4 ${showFilters ? 'block' : 'hidden lg:block'}`}>
                {/* Búsqueda */}
                <div className="mb-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <input
                      type="text"
                      placeholder="Buscar habitaciones..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                    {searchTerm && (
                      <button
                        onClick={() => setSearchTerm('')}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Ordenar por (siempre visible) */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-gray-700">Ordenar por</h3>
                  </div>
                  <div className="space-y-2">
                    {sortOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setSortBy(option.value)}
                        className={`w-full text-left py-2 px-3 rounded-lg text-sm transition-colors ${
                          sortBy === option.value
                            ? 'bg-primary-50 text-primary-700 border border-primary-200'
                            : 'text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span>{option.label}</span>
                          {sortBy === option.value && (
                            <Check className="h-4 w-4 text-primary-600" />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sección de Precio (Desplegable) */}
                <div className="border-b border-gray-200 pb-4">
                  <button
                    onClick={() => toggleSection('price')}
                    className="flex items-center justify-between w-full py-3 text-left"
                  >
                    <h3 className="font-medium text-gray-900">Rango de Precio</h3>
                    {openSections.price ? (
                      <ChevronUp className="h-4 w-4 text-gray-400" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                  
                  {openSections.price && (
                    <div className="mt-3 space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">${priceRange[0].toLocaleString()}</span>
                        <span className="text-sm text-gray-600">${priceRange[1].toLocaleString()}</span>
                      </div>
                      <div className="relative pt-1">
                        <input
                          type="range"
                          min="0"
                          max="500000"
                          step="10000"
                          value={priceRange[0]}
                          onChange={(e) => handlePriceChange(parseInt(e.target.value), priceRange[1])}
                          className="absolute w-full h-2 bg-transparent appearance-none pointer-events-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary-500 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:pointer-events-auto"
                        />
                        <input
                          type="range"
                          min="0"
                          max="500000"
                          step="10000"
                          value={priceRange[1]}
                          onChange={(e) => handlePriceChange(priceRange[0], parseInt(e.target.value))}
                          className="absolute w-full h-2 bg-transparent appearance-none pointer-events-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary-500 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:pointer-events-auto"
                        />
                        <div className="h-2 bg-gray-200 rounded-full"></div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1">
                          <label className="block text-xs text-gray-500 mb-1">Mínimo</label>
                          <input
                            type="number"
                            value={priceRange[0]}
                            onChange={(e) => handlePriceChange(parseInt(e.target.value), priceRange[1])}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          />
                        </div>
                        <div className="flex-1">
                          <label className="block text-xs text-gray-500 mb-1">Máximo</label>
                          <input
                            type="number"
                            value={priceRange[1]}
                            onChange={(e) => handlePriceChange(priceRange[0], parseInt(e.target.value))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Sección de Capacidad (Desplegable) */}
                <div className="border-b border-gray-200 pb-4">
                  <button
                    onClick={() => toggleSection('capacity')}
                    className="flex items-center justify-between w-full py-3 text-left"
                  >
                    <h3 className="font-medium text-gray-900">Capacidad</h3>
                    {openSections.capacity ? (
                      <ChevronUp className="h-4 w-4 text-gray-400" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                  
                  {openSections.capacity && (
                    <div className="mt-3 space-y-2">
                      {['all', '1', '2', '3', '4', '5+'].map((cap) => {
                        let label = ''
                        let value = cap
                        
                        if (cap === 'all') label = 'Todas'
                        else if (cap === '5+') {
                          label = '5+ personas'
                          value = '5'
                        } else {
                          label = `${cap} ${cap === '1' ? 'persona' : 'personas'}`
                        }
                        
                        return (
                          <button
                            key={cap}
                            onClick={() => setCapacity(value)}
                            className={`w-full text-left py-2 px-3 rounded-lg text-sm transition-colors flex items-center justify-between ${
                              capacity === value
                                ? 'bg-primary-50 text-primary-700 border border-primary-200'
                                : 'text-gray-600 hover:bg-gray-50'
                            }`}
                          >
                            <div className="flex items-center">
                              <Users className="h-4 w-4 mr-2" />
                              {label}
                            </div>
                            {capacity === value && (
                              <Check className="h-4 w-4 text-primary-600" />
                            )}
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* Sección de Tipo de Habitación (Desplegable) */}
                <div className="border-b border-gray-200 pb-4">
                  <button
                    onClick={() => toggleSection('type')}
                    className="flex items-center justify-between w-full py-3 text-left"
                  >
                    <h3 className="font-medium text-gray-900">Tipo de Habitación</h3>
                    {openSections.type ? (
                      <ChevronUp className="h-4 w-4 text-gray-400" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                  
                  {openSections.type && (
                    <div className="mt-3 space-y-2">
                      {[
                        { value: 'all', label: 'Todos los tipos' },
                        { value: 'sencilla', label: 'Sencilla' },
                        { value: 'doble', label: 'Doble' },
                        { value: 'suite', label: 'Suite' },
                        { value: 'ejecutiva', label: 'Ejecutiva' },
                        { value: 'familiar', label: 'Familiar' },
                        { value: 'presidencial', label: 'Presidencial' }
                      ].map((type) => (
                        <button
                          key={type.value}
                          onClick={() => setRoomType(type.value)}
                          className={`w-full text-left py-2 px-3 rounded-lg text-sm transition-colors flex items-center justify-between ${
                            roomType === type.value
                              ? 'bg-primary-50 text-primary-700 border border-primary-200'
                              : 'text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          {type.label}
                          {roomType === type.value && (
                            <Check className="h-4 w-4 text-primary-600" />
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Sección de Comodidades (Desplegable) */}
                <div className="border-b border-gray-200 pb-4">
                  <button
                    onClick={() => toggleSection('amenities')}
                    className="flex items-center justify-between w-full py-3 text-left"
                  >
                    <h3 className="font-medium text-gray-900">Comodidades</h3>
                    {openSections.amenities ? (
                      <ChevronUp className="h-4 w-4 text-gray-400" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                  
                  {openSections.amenities && (
                    <div className="mt-3 space-y-2">
                      {availableAmenities.map((amenity) => (
                        <button
                          key={amenity.id}
                          onClick={() => toggleAmenity(amenity.name)}
                          className={`w-full text-left py-2 px-3 rounded-lg text-sm transition-colors flex items-center justify-between ${
                            amenitiesFilter.includes(amenity.name)
                              ? 'bg-primary-50 text-primary-700 border border-primary-200'
                              : 'text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center">
                            {amenity.icon}
                            <span className="ml-2">{amenity.name}</span>
                          </div>
                          {amenitiesFilter.includes(amenity.name) && (
                            <Check className="h-4 w-4 text-primary-600" />
                          )}
                        </button>
                      ))}
                      
                      {amenitiesFilter.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <div className="flex flex-wrap gap-2">
                            {amenitiesFilter.map((amenity) => (
                              <span
                                key={amenity}
                                className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-primary-100 text-primary-800"
                              >
                                {amenity}
                                <button
                                  onClick={() => toggleAmenity(amenity)}
                                  className="ml-1 text-primary-600 hover:text-primary-800"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="pt-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Resultados:</span>
                    <span className="font-medium text-gray-900">{filteredRooms.length}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm mt-1">
                    <span className="text-gray-600">Filtros activos:</span>
                    <span className="font-medium text-primary-600">
                      {[
                        searchTerm ? 'Búsqueda' : null,
                        capacity !== 'all' ? 'Capacidad' : null,
                        roomType !== 'all' ? 'Tipo' : null,
                        amenitiesFilter.length > 0 ? 'Comodidades' : null,
                        priceRange[0] > 0 || priceRange[1] < 500000 ? 'Precio' : null
                      ].filter(Boolean).length}
                    </span>
                  </div>
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
                  {filteredRooms.length} {filteredRooms.length === 1 ? 'habitación encontrada' : 'habitaciones encontradas'}
                </p>
              </div>
              <div className="mt-3 sm:mt-0">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="lg:hidden flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  <Filter className="h-4 w-4 mr-2" />
                  {showFilters ? 'Ocultar filtros' : 'Mostrar filtros'}
                </button>
              </div>
            </div>

            {/* Rooms Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {currentRooms.map((room) => {
                const currentSlideIndex = roomSlides[room.id] || 0
                const isFavorite = favorites.includes(room.id)
                
                return (
                  <div key={room.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all duration-200 group">
                    {/* Carrusel de imágenes */}
                    <div className="relative h-56 bg-gray-200">
                      <img 
                        src={room.images?.[currentSlideIndex] || room.images?.[0]} 
                        alt={room.name}
                        className="w-full h-full object-cover transition-opacity duration-300 group-hover:scale-105"
                      />
                      
                      {/* Botón favorito */}
                      <button
                        onClick={() => toggleFavorite(room.id)}
                        className="absolute top-3 right-3 p-2 bg-white/90 rounded-full hover:bg-white transition-colors"
                      >
                        <Heart className={`h-5 w-5 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} />
                      </button>
                      
                      {/* Controles del carrusel */}
                      {room.images && room.images.length > 1 && (
                        <>
                          <button 
                            onClick={() => changeRoomSlide(room.id, 'prev')}
                            className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white/90 text-gray-800 p-2 rounded-full hover:bg-white opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => changeRoomSlide(room.id, 'next')}
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white/90 text-gray-800 p-2 rounded-full hover:bg-white opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <ChevronRight className="h-4 w-4" />
                          </button>
                          
                          {/* Indicadores */}
                          <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1">
                            {room.images.map((_, index) => (
                              <button
                                key={index}
                                onClick={() => setRoomSlides(prev => ({ ...prev, [room.id]: index }))}
                                className={`h-2 w-2 rounded-full transition-all ${
                                  index === currentSlideIndex 
                                    ? 'bg-primary-500 w-4' 
                                    : 'bg-white/70 hover:bg-white'
                                }`}
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
                        <span className="bg-white/95 backdrop-blur-sm px-4 py-2 rounded-lg shadow-sm text-base font-semibold text-gray-900">
                          {formatPrice(room.price)}
                          <span className="text-xs text-gray-600 font-normal block">/noche</span>
                        </span>
                      </div>
                    </div>

                    <div className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            Habitación {room.number}
                          </h3>
                          <div className="flex items-center mt-1">
                            <Star className="h-4 w-4 text-yellow-400 fill-yellow-400 mr-1" />
                            <span className="text-sm font-medium mr-1">{room.rating?.toFixed(1)}</span>
                            <span className="text-sm text-gray-500">({room.reviews} reseñas)</span>
                          </div>
                        </div>
                      </div>

                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                        {room.description}
                      </p>

                      <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                        <div className="flex items-center">
                          <Users className="h-4 w-4 mr-1" />
                          <span>Hasta {room.capacity} personas</span>
                        </div>
                        <div className="flex items-center">
                          <span className={`inline-flex items-center px-2 py-1 rounded text-xs ${
                            room.capacity === 1 ? 'bg-blue-100 text-blue-800' :
                            room.capacity === 2 ? 'bg-green-100 text-green-800' :
                            room.capacity >= 3 ? 'bg-purple-100 text-purple-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {room.capacity === 1 ? 'Individual' :
                             room.capacity === 2 ? 'Pareja' :
                             room.capacity === 3 ? 'Triple' :
                             'Grupo'}
                          </span>
                        </div>
                      </div>

                      {room.amenities && room.amenities.length > 0 && (
                        <div className="mb-4">
                          <p className="text-xs text-gray-500 mb-2">Incluye:</p>
                          <div className="flex flex-wrap gap-1">
                            {room.amenities.slice(0, 4).map((amenity, index) => (
                              <div
                                key={index}
                                className="flex items-center space-x-1 bg-gray-50 px-2 py-1.5 rounded-md text-xs text-gray-600"
                                title={amenity}
                              >
                                {getAmenityIcon(amenity)}
                                <span className="truncate max-w-24">{amenity.split(' ')[0]}</span>
                              </div>
                            ))}
                            {room.amenities.length > 4 && (
                              <div className="bg-gray-50 px-2 py-1.5 rounded-md text-xs text-gray-600">
                                +{room.amenities.length - 4} más
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="flex space-x-3 pt-4 border-t">
                        <button
                          onClick={() => handleViewDetails(room)}
                          className="flex-1 flex items-center justify-center gap-2 bg-gray-50 hover:bg-gray-100 text-gray-700 text-center py-2.5 px-4 rounded-lg font-medium transition-colors duration-200 border border-gray-300"
                        >
                          <Eye className="h-4 w-4" />
                          Ver Detalles
                        </button>
                        {room.estado === 'Disponible' && (
                          <Link
                            to={`/reservar?roomId=${room.id}&price=${room.price}`}
                            className="flex-1 flex items-center justify-center gap-2 bg-primary-500 hover:bg-primary-600 text-white text-center py-2.5 px-4 rounded-lg font-medium transition-colors duration-200"
                          >
                            <Calendar className="h-4 w-4" />
                            Reservar Ahora
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {filteredRooms.length === 0 && (
              <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
                <Bed className="h-20 w-20 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  No se encontraron habitaciones
                </h3>
                <p className="text-gray-600 max-w-md mx-auto mb-6">
                  Lo sentimos, no encontramos habitaciones que coincidan con tus criterios de búsqueda.
                  Intenta ajustar los filtros o busca otros términos.
                </p>
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={resetFilters}
                    className="px-6 py-2.5 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors font-medium"
                  >
                    Limpiar todos los filtros
                  </button>
                  <button
                    onClick={() => navigate('/')}
                    className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  >
                    Volver al inicio
                  </button>
                </div>
              </div>
            )}

            {/* Paginación */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-8">
                <nav className="flex items-center space-x-2">
                  <button
                    onClick={() => paginate(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2.5 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 font-medium text-sm flex items-center gap-1"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Anterior
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
                        className={`px-4 py-2.5 rounded-lg transition-colors text-sm font-medium ${
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
                    className="px-4 py-2.5 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 font-medium text-sm flex items-center gap-1"
                  >
                    Siguiente
                    <ChevronRight className="h-4 w-4" />
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