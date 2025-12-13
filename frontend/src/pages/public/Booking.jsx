import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { 
  Check, 
  Calendar, 
  Users, 
  Search, 
  Filter, 
  AlertCircle, 
  CreditCard, 
  Shield, 
  Info, 
  Building, 
  Wallet,
  Eye,
  ChevronLeft,
  ChevronRight,
  Star,
  Wifi,
  Tv,
  Wind,
  Coffee,
  Car,
  Bath,
  Snowflake,
  Dumbbell,
  Film,
  Bed,
  MapPin,
  Plus,
  Minus,
  Gift,
  Sparkles
} from 'lucide-react'
import { getRooms, getAvailableServices } from '../../services/api'
import { format, addDays, differenceInDays, isValid } from 'date-fns'
import { es } from 'date-fns/locale'

const Booking = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  // Estados principales
  const [step, setStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [bookingComplete, setBookingComplete] = useState(false)
  const [bookingId, setBookingId] = useState("")
  const [availableRooms, setAvailableRooms] = useState([])
  const [filteredRooms, setFilteredRooms] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [showFilters, setShowFilters] = useState(false)
  const [minPrice, setMinPrice] = useState(0)
  const [maxPrice, setMaxPrice] = useState(500000)
  const [capacity, setCapacity] = useState(1)
  const [error, setError] = useState(null)
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [promoCode, setPromoCode] = useState("")
  const [promoApplied, setPromoApplied] = useState(false)
  const [paymentTab, setPaymentTab] = useState("hotel")
  const [viewMode, setViewMode] = useState("list") // "list" o "cinema"
  const [selectedServices, setSelectedServices] = useState([])
  const [availableServices, setAvailableServices] = useState([])
  const [showServicesModal, setShowServicesModal] = useState(false)
  const [selectedRoomDetails, setSelectedRoomDetails] = useState(null)
  const [showRoomDetails, setShowRoomDetails] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [roomsPerPage] = useState(6)

  // Estados para carruseles por habitación
  const [roomSlides, setRoomSlides] = useState({})

  // Form data
  const [formData, setFormData] = useState({
    roomId: "",
    roomName: "",
    roomImage: "",
    checkIn: "",
    checkOut: "",
    guests: 1,
    price: 0,
    nights: 0,
    total: 0,
    subtotal: 0,
    taxes: 0,
    serviceFee: 0,
    name: "",
    email: "",
    phone: "",
    specialRequests: "",
    paymentMethod: "hotel",
    cardNumber: "",
    cardName: "",
    cardExpiry: "",
    cardCvc: "",
  })

  // Imágenes de ejemplo para las habitaciones
  const defaultRoomImages = {
    1: [
      'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&h=600&fit=crop'
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

  // Cargar servicios disponibles
  useEffect(() => {
    async function loadServices() {
      try {
        const services = await getAvailableServices()
        setAvailableServices(services)
      } catch (error) {
        console.error('Error loading services:', error)
      }
    }
    
    loadServices()
  }, [])

  // Función para cambiar slide de una habitación específica
  const changeRoomSlide = (roomId, direction) => {
    setRoomSlides(prev => {
      const currentSlide = prev[roomId] || 0
      const room = availableRooms.find(r => r.id === roomId)
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

  // Cargar parámetros de URL solo una vez al inicio
  useEffect(() => {
    try {
      const roomId = searchParams.get("roomId") || ""
      const checkIn = searchParams.get("checkIn") || ""
      const checkOut = searchParams.get("checkOut") || ""
      const guests = parseInt(searchParams.get("guests") || "1", 10)
      const price = parseFloat(searchParams.get("price") || "0")
      const nights = parseInt(searchParams.get("nights") || "0", 10)
      const total = parseFloat(searchParams.get("total") || "0")
      const discount = searchParams.get("discount") === "true"

      // Validar que los valores numéricos sean realmente números
      const validGuests = isNaN(guests) ? 1 : guests
      const validPrice = isNaN(price) ? 0 : price
      const validNights = isNaN(nights) ? 0 : nights
      const validTotal = isNaN(total) ? 0 : total

      // Validar fechas
      const checkInDate = new Date(checkIn)
      const checkOutDate = new Date(checkOut)
      const validCheckIn = isValid(checkInDate) ? checkIn : ""
      const validCheckOut = isValid(checkOutDate) ? checkOut : ""

      // Si hay descuento, aplicarlo
      if (discount) {
        setPromoApplied(true)
      }

      setFormData((prev) => ({
        ...prev,
        roomId,
        checkIn: validCheckIn,
        checkOut: validCheckOut,
        guests: validGuests,
        price: validPrice,
        nights: validNights,
        total: validTotal,
      }))

      setCapacity(validGuests)
    } catch (err) {
      console.error("Error parsing URL parameters:", err)
      setError("Hubo un problema al cargar los parámetros de la URL.")
    }
  }, [searchParams])

  // Cargar todas las habitaciones al inicio - SOLO DISPONIBLES
  useEffect(() => {
    async function loadRooms() {
      try {
        setIsLoading(true)
        setError(null)
        console.log('🔄 Loading all rooms for booking...')
        const rooms = await getRooms()
        console.log('✅ All rooms loaded from API:', rooms)
        
        // Filtrar solo habitaciones disponibles
        const availableRoomsOnly = rooms.filter(room => 
          room.estado === 'Disponible' || room.estado_habitacion === 'Disponible' || room.isAvailable === true
        )
        
        // Validar y normalizar las habitaciones
        const validatedRooms = availableRoomsOnly.map((room, index) => {
          // Obtener ID numérico o generar uno
          const roomId = room.id?.toString() || room.id_habitacion?.toString() || (index + 1).toString()
          
          // Usar imágenes específicas para cada habitación
          const roomImages = room.images || defaultRoomImages[(index % 6) + 1] || [
            'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=800&h=600&fit=crop',
            'https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=800&h=600&fit=crop'
          ]

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
            isAvailable: true, // Ya filtramos solo las disponibles
            amenities: Array.isArray(room.amenities) ? room.amenities : 
                      (room.servicios_incluidos ? 
                        (typeof room.servicios_incluidos === 'string' ? 
                          room.servicios_incluidos.split(',') : 
                          room.servicios_incluidos) 
                        : ['WiFi', 'TV', 'Aire acondicionado', 'Baño privado']),
            images: roomImages,
            number: room.number?.toString() || room.numero_habitacion?.toString() || (index + 1).toString(),
            tipo: room.tipo || room.tipo_habitacion || 'Estándar',
            estado: 'Disponible',
            rating: 4.0 + (Math.random() * 0.7), // Rating aleatorio entre 4.0 y 4.7
            reviews: Math.floor(Math.random() * 100) + 20 // Reviews aleatorias
          }
        })

        // Calcular precio máximo basado en las habitaciones reales
        const calculatedMaxPrice = validatedRooms.length > 0 
          ? Math.max(...validatedRooms.map(room => room.price || 0)) * 1.2
          : 500000
        
        setMaxPrice(calculatedMaxPrice)
        setAvailableRooms(validatedRooms)
        setFilteredRooms(validatedRooms)
        
      } catch (error) {
        console.error("❌ Error fetching rooms:", error)
        setError("No se pudieron cargar las habitaciones. Por favor, inténtelo de nuevo más tarde.")
      } finally {
        setIsLoading(false)
      }
    }

    loadRooms()
  }, [])

  // Aplicar filtros cuando cambien los criterios
  useEffect(() => {
    const applyFilters = () => {
      if (availableRooms.length === 0) return

      try {
        let result = [...availableRooms]

        // Aplicar filtro de búsqueda
        if (searchTerm) {
          result = result.filter(
            (room) =>
              room.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
              room.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
              (room.tipo && room.tipo.toLowerCase().includes(searchTerm.toLowerCase())) ||
              room.number.toLowerCase().includes(searchTerm.toLowerCase())
          )
        }

        // Aplicar filtro de precio
        result = result.filter((room) => (room.price || 0) >= minPrice && (room.price || 0) <= maxPrice)

        // Aplicar filtro de capacidad
        result = result.filter((room) => room.capacity >= capacity)

        setFilteredRooms(result)
        setCurrentPage(1) // Resetear a primera página
      } catch (err) {
        console.error("Error filtering rooms:", err)
      }
    }

    applyFilters()
  }, [availableRooms, searchTerm, minPrice, maxPrice, capacity])

  // Calcular paginación
  const indexOfLastRoom = currentPage * roomsPerPage
  const indexOfFirstRoom = indexOfLastRoom - roomsPerPage
  const currentRooms = filteredRooms.slice(indexOfFirstRoom, indexOfLastRoom)
  const totalPages = Math.ceil(filteredRooms.length / roomsPerPage)

  const paginate = (pageNumber) => setCurrentPage(pageNumber)

  // Manejadores de eventos
  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target

    // Validación específica para campos de tarjeta
    if (name === "cardNumber") {
      const sanitizedValue = value.replace(/[^\d\s]/g, "").substring(0, 19)
      setFormData((prev) => ({ ...prev, [name]: sanitizedValue }))
      return
    }

    if (name === "cardExpiry") {
      const sanitizedValue = value.replace(/[^\d/]/g, "").substring(0, 5)
      setFormData((prev) => ({ ...prev, [name]: sanitizedValue }))
      return
    }

    if (name === "cardCvc") {
      const sanitizedValue = value.replace(/\D/g, "").substring(0, 4)
      setFormData((prev) => ({ ...prev, [name]: sanitizedValue }))
      return
    }

    if (name === "phone") {
      const sanitizedValue = value.replace(/[^\d+\s-]/g, "")
      setFormData((prev) => ({ ...prev, [name]: sanitizedValue }))
      return
    }

    // Para el resto de campos, actualizar normalmente
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }, [])

  // Manejar cambio de fechas
  const handleDateChange = useCallback(
    (field, date) => {
      if (!date || !isValid(date)) return

      setFormData((prev) => {
        let newCheckIn = prev.checkIn
        let newCheckOut = prev.checkOut

        if (field === "checkIn") {
          newCheckIn = date.toISOString().split("T")[0]

          if (prev.checkOut) {
            const checkOutDate = new Date(prev.checkOut)
            if (checkOutDate <= date) {
              const nextDay = addDays(date, 1)
              newCheckOut = nextDay.toISOString().split("T")[0]
            }
          } else {
            const nextDay = addDays(date, 1)
            newCheckOut = nextDay.toISOString().split("T")[0]
          }
        } else {
          newCheckOut = date.toISOString().split("T")[0]
        }

        // Calcular noches y total
        let nights = 0
        if (newCheckIn && newCheckOut) {
          const startDate = new Date(newCheckIn)
          const endDate = new Date(newCheckOut)
          if (isValid(startDate) && isValid(endDate)) {
            nights = Math.max(0, differenceInDays(endDate, startDate))
          }
        }

        // Calcular precios
        const basePrice = prev.price
        const priceWithDiscount = promoApplied ? basePrice * 0.85 : basePrice
        const subtotal = priceWithDiscount * nights
        const taxes = subtotal * 0.12
        const serviceFee = subtotal * 0.05
        const total = subtotal + taxes + serviceFee

        return {
          ...prev,
          checkIn: newCheckIn,
          checkOut: newCheckOut,
          nights,
          subtotal,
          taxes,
          serviceFee,
          total,
        }
      })
    },
    [promoApplied],
  )

  // Función para mostrar detalles de habitación
  const showRoomDetailModal = (room) => {
    setSelectedRoomDetails(room)
    setShowRoomDetails(true)
  }

  // Función para seleccionar habitación
  const handleRoomSelect = useCallback(
    (room) => {
      try {
        let checkInDate, checkOutDate, nights

        if (formData.checkIn && formData.checkOut) {
          checkInDate = new Date(formData.checkIn)
          checkOutDate = new Date(formData.checkOut)

          if (isValid(checkInDate) && isValid(checkOutDate)) {
            nights = Math.max(0, differenceInDays(checkOutDate, checkInDate))
          } else {
            const today = new Date()
            const tomorrow = addDays(today, 1)

            checkInDate = today
            checkOutDate = tomorrow
            nights = 1
          }
        } else {
          const today = new Date()
          const tomorrow = addDays(today, 1)

          checkInDate = today
          checkOutDate = tomorrow
          nights = 1
        }

        const checkInStr = checkInDate.toISOString().split("T")[0]
        const checkOutStr = checkOutDate.toISOString().split("T")[0]

        const basePrice = room.price || 0
        const priceWithDiscount = promoApplied ? basePrice * 0.85 : basePrice
        const subtotal = priceWithDiscount * nights
        const taxes = subtotal * 0.12
        const serviceFee = subtotal * 0.05
        const total = subtotal + taxes + serviceFee

        setFormData((prevData) => ({
          ...prevData,
          roomId: room.id,
          roomName: room.name,
          roomImage: room.images?.[roomSlides[room.id] || 0] || '',
          price: basePrice,
          checkIn: checkInStr,
          checkOut: checkOutStr,
          nights: nights,
          subtotal: subtotal,
          taxes: taxes,
          serviceFee: serviceFee,
          total: total,
        }))
      } catch (err) {
        console.error("Error selecting room:", err)
      }
    },
    [formData.checkIn, formData.checkOut, promoApplied, roomSlides],
  )

  const handleGuestsChange = useCallback((e) => {
    try {
      const guests = parseInt(e.target.value, 10)
      if (isNaN(guests) || guests < 1) return

      setFormData((prev) => ({ ...prev, guests }))
      setCapacity(guests)
    } catch (err) {
      console.error("Error changing guests:", err)
    }
  }, [])

  const handleApplyPromo = () => {
    if (promoCode.toUpperCase() === "HOTEL15") {
      setPromoApplied(true)

      setFormData((prev) => {
        const priceWithDiscount = prev.price * 0.85
        const subtotal = priceWithDiscount * prev.nights
        const taxes = subtotal * 0.12
        const serviceFee = subtotal * 0.05
        const total = subtotal + taxes + serviceFee

        return {
          ...prev,
          subtotal,
          taxes,
          serviceFee,
          total,
        }
      })

      setError(null)
    } else {
      setError("Código promocional inválido. Intente con HOTEL15")
    }
  }

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const validateStep = useCallback(
    (currentStep) => {
      setError(null)

      if (currentStep === 1) {
        if (!formData.roomId) {
          setError("Por favor, seleccione una habitación")
          return false
        }
        if (!formData.checkIn || !formData.checkOut) {
          setError("Por favor, seleccione las fechas de entrada y salida")
          return false
        }
        if (!formData.name) {
          setError("Por favor, ingrese su nombre completo")
          return false
        }
        if (!formData.email) {
          setError("Por favor, ingrese su correo electrónico")
          return false
        }
        if (!validateEmail(formData.email)) {
          setError("Por favor, ingrese un correo electrónico válido")
          return false
        }
        if (!formData.phone) {
          setError("Por favor, ingrese su número de teléfono")
          return false
        }
        return true
      }

      if (currentStep === 2) {
        if (paymentTab === "credit-card") {
          if (!formData.cardNumber || formData.cardNumber.replace(/\s/g, "").length < 13) {
            setError("Por favor, ingrese un número de tarjeta válido")
            return false
          }
          if (!formData.cardName) {
            setError("Por favor, ingrese el nombre que aparece en la tarjeta")
            return false
          }
          if (!formData.cardExpiry || !/^\d{2}\/\d{2}$/.test(formData.cardExpiry)) {
            setError("Por favor, ingrese una fecha de expiración válida (MM/YY)")
            return false
          }
          if (!formData.cardCvc || formData.cardCvc.length < 3) {
            setError("Por favor, ingrese un código CVC válido")
            return false
          }
        }
        return true
      }

      if (currentStep === 3) {
        if (!termsAccepted) {
          setError("Debe aceptar los términos y condiciones para continuar")
          return false
        }
        return true
      }

      return true
    },
    [formData, termsAccepted, paymentTab],
  )

  const nextStep = useCallback(() => {
    if (!validateStep(step)) {
      return
    }

    setStep((prev) => prev + 1)
    window.scrollTo(0, 0)
  }, [step, validateStep])

  const prevStep = useCallback(() => {
    setStep((prev) => prev - 1)
    window.scrollTo(0, 0)
  }, [])

  // Manejar servicios
  const handleAddService = (service) => {
    setSelectedServices(prev => {
      const existing = prev.find(s => s.id === service.id)
      if (existing) {
        return prev.map(s => 
          s.id === service.id 
            ? { ...s, cantidad: (s.cantidad || 1) + 1 } 
            : s
        )
      } else {
        return [...prev, { ...service, cantidad: 1 }]
      }
    })
  }

  const handleRemoveService = (serviceId) => {
    setSelectedServices(prev => prev.filter(s => s.id !== serviceId))
  }

  const handleUpdateServiceQuantity = (serviceId, newQuantity) => {
    if (newQuantity < 1) {
      handleRemoveService(serviceId)
      return
    }
    
    setSelectedServices(prev => 
      prev.map(s => 
        s.id === serviceId 
          ? { ...s, cantidad: newQuantity } 
          : s
      )
    )
  }

  const calculateServicesTotal = () => {
    return selectedServices.reduce((total, service) => {
      return total + (service.price * (service.cantidad || 1))
    }, 0)
  }

  // Componente para el modal de selección de servicios
  const ServicesModal = () => {
    return (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center p-6 border-b">
            <div>
              <h3 className="text-xl font-bold text-gray-900">Servicios Adicionales</h3>
              <p className="text-gray-600 mt-1">Personaliza tu experiencia</p>
            </div>
            <button 
              onClick={() => setShowServicesModal(false)}
              className="text-gray-500 hover:text-gray-700 text-xl"
            >
              ✕
            </button>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {availableServices.map((service) => {
                const isSelected = selectedServices.find(s => s.id === service.id)
                const quantity = isSelected ? isSelected.cantidad || 1 : 0
                
                return (
                  <div 
                    key={service.id}
                    className={`p-4 rounded-lg border ${
                      isSelected 
                        ? 'border-primary-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start mb-3">
                      <div className={`p-2 rounded ${isSelected ? 'bg-primary-100' : 'bg-gray-100'}`}>
                        <Gift className="h-5 w-5" />
                      </div>
                      <div className="ml-3 flex-1">
                        <h4 className="font-semibold text-gray-900">{service.name}</h4>
                        <p className="text-sm text-gray-600 mt-1">{service.description}</p>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center mt-4">
                      <div>
                        <span className="text-lg font-bold text-primary-600">
                          ${parseFloat(service.price).toLocaleString()}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {isSelected ? (
                          <>
                            <div className="flex items-center bg-gray-100 rounded">
                              <button
                                onClick={() => handleUpdateServiceQuantity(service.id, quantity - 1)}
                                className="p-2 hover:bg-gray-200"
                              >
                                <Minus className="h-3 w-3" />
                              </button>
                              <span className="font-medium w-8 text-center">{quantity}</span>
                              <button
                                onClick={() => handleUpdateServiceQuantity(service.id, quantity + 1)}
                                className="p-2 hover:bg-gray-200"
                              >
                                <Plus className="h-3 w-3" />
                              </button>
                            </div>
                            <button
                              onClick={() => handleRemoveService(service.id)}
                              className="ml-2 px-3 py-2 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                            >
                              Eliminar
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => handleAddService(service)}
                            className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
                          >
                            Agregar
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
            
            {availableServices.length === 0 && (
              <div className="text-center py-8">
                <Sparkles className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No hay servicios disponibles en este momento</p>
              </div>
            )}
          </div>
          
          <div className="p-6 border-t bg-gray-50">
            <div className="flex justify-between items-center">
              <div>
                <h4 className="font-semibold text-gray-900">Resumen de servicios:</h4>
                <p className="text-sm text-gray-600">
                  {selectedServices.length} servicio(s) seleccionados • Total: <span className="font-bold text-primary-600">${calculateServicesTotal().toLocaleString()}</span>
                </p>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowServicesModal(false)}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => setShowServicesModal(false)}
                  className="px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
                >
                  Aceptar Servicios
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Componente para el modal de detalles de habitación con carrusel
  const RoomDetailsModal = () => {
    if (!selectedRoomDetails) return null
    
    const currentSlideIndex = roomSlides[selectedRoomDetails.id] || 0
    
    const getAmenityIcon = (amenity) => {
      const amenityLower = amenity.toLowerCase()
      if (amenityLower.includes('wifi')) return <Wifi className="h-5 w-5 mr-2" />
      if (amenityLower.includes('tv') || amenityLower.includes('televisión')) return <Tv className="h-5 w-5 mr-2" />
      if (amenityLower.includes('aire') || amenityLower.includes('clima')) return <Wind className="h-5 w-5 mr-2" />
      if (amenityLower.includes('baño') || amenityLower.includes('jacuzzi')) return <Bath className="h-5 w-5 mr-2" />
      if (amenityLower.includes('gimnasio') || amenityLower.includes('ejercicio')) return <Dumbbell className="h-5 w-5 mr-2" />
      if (amenityLower.includes('café') || amenityLower.includes('desayuno')) return <Coffee className="h-5 w-5 mr-2" />
      if (amenityLower.includes('parking') || amenityLower.includes('estacionamiento')) return <Car className="h-5 w-5 mr-2" />
      if (amenityLower.includes('nevera') || amenityLower.includes('minibar')) return <Snowflake className="h-5 w-5 mr-2" />
      return <Check className="h-5 w-5 mr-2" />
    }
    
    return (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex justify-between items-center p-6 border-b">
            <h3 className="text-2xl font-bold text-gray-900">{selectedRoomDetails.name}</h3>
            <button 
              onClick={() => setShowRoomDetails(false)}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              ✕
            </button>
          </div>
          
          {/* Carousel de imágenes */}
          <div className="relative h-80">
            <img 
              src={selectedRoomDetails.images?.[currentSlideIndex] || selectedRoomDetails.images?.[0]} 
              alt={selectedRoomDetails.name}
              className="w-full h-full object-cover"
            />
            
            {/* Controles del carousel */}
            {selectedRoomDetails.images && selectedRoomDetails.images.length > 1 && (
              <>
                <button 
                  onClick={() => changeRoomSlide(selectedRoomDetails.id, 'prev')}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/80 text-gray-800 p-2 rounded-full hover:bg-white shadow-md"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button 
                  onClick={() => changeRoomSlide(selectedRoomDetails.id, 'next')}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/80 text-gray-800 p-2 rounded-full hover:bg-white shadow-md"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
                
                {/* Indicadores */}
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                  {selectedRoomDetails.images.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setRoomSlides(prev => ({ ...prev, [selectedRoomDetails.id]: index }))}
                      className={`h-3 w-3 rounded-full ${index === currentSlideIndex ? 'bg-primary-500' : 'bg-white/70'}`}
                    />
                  ))}
                </div>
              </>
            )}
            
            {/* Número de imagen */}
            <div className="absolute top-4 left-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
              {currentSlideIndex + 1} / {selectedRoomDetails.images?.length || 1}
            </div>
          </div>
          
          {/* Contenido */}
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Columna izquierda */}
              <div className="md:col-span-2">
                <div className="mb-6">
                  <h4 className="text-lg font-semibold mb-2 text-gray-900">Descripción</h4>
                  <p className="text-gray-600">{selectedRoomDetails.description}</p>
                </div>
                
                <div className="mb-6">
                  <h4 className="text-lg font-semibold mb-3 text-gray-900">Amenidades</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {selectedRoomDetails.amenities?.map((amenity, index) => (
                      <div key={index} className="flex items-center text-gray-700">
                        {getAmenityIcon(amenity)}
                        <span>{amenity}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Columna derecha - Detalles */}
              <div className="bg-gray-50 p-6 rounded-lg">
                <h4 className="text-lg font-semibold mb-4 text-gray-900">Detalles</h4>
                
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tipo:</span>
                    <span className="font-medium text-gray-900">{selectedRoomDetails.tipo}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Número:</span>
                    <span className="font-medium text-gray-900">{selectedRoomDetails.number}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Capacidad:</span>
                    <span className="font-medium text-gray-900">Hasta {selectedRoomDetails.capacity} personas</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Calificación:</span>
                    <div className="flex items-center">
                      <Star className="h-4 w-4 text-yellow-400 mr-1" />
                      <span className="font-medium text-gray-900">{selectedRoomDetails.rating?.toFixed(1)}/5.0</span>
                    </div>
                  </div>
                  <div className="pt-4 border-t">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Precio por noche:</span>
                      <span className="text-2xl font-bold text-primary-600">${selectedRoomDetails.price.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={() => {
                    handleRoomSelect(selectedRoomDetails)
                    setShowRoomDetails(false)
                  }}
                  className={`w-full mt-6 py-3 rounded-lg font-medium ${
                    formData.roomId === selectedRoomDetails.id
                      ? "bg-green-600 hover:bg-green-700 text-white"
                      : "bg-primary-500 hover:bg-primary-600 text-white"
                  }`}
                >
                  {formData.roomId === selectedRoomDetails.id
                    ? "✓ Habitación seleccionada"
                    : "Seleccionar esta habitación"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Componente para el modo cine simplificado - SIN "Vista de Asientos"
  const CinemaView = () => {
    // Organizar en filas de 5 habitaciones cada una
    const rows = []
    for (let i = 0; i < filteredRooms.length; i += 5) {
      rows.push(filteredRooms.slice(i, i + 5))
    }

    const handleSeatClick = (room) => {
      handleRoomSelect(room)
    }

    const getSeatColor = (room) => {
      if (formData.roomId === room.id) return 'bg-red-500 border-red-600 hover:bg-red-600 text-white'
      return 'bg-green-500 border-green-600 hover:bg-green-600 text-white'
    }

    return (
      <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
        {/* Título cambiado: Solo icono de cama */}
        <div className="flex items-center justify-center mb-8">
          <Bed className="h-8 w-8 text-gray-700 mr-3" />
          <h3 className="text-2xl font-bold text-gray-900">Selección de Habitaciones</h3>
        </div>

        {/* Asientos (Habitaciones) */}
        <div className="space-y-8">
          {rows.map((row, rowIndex) => (
            <div key={rowIndex} className="flex justify-center space-x-4">
              {row.map((room, seatIndex) => (
                <div 
                  key={room.id} 
                  className="relative"
                >
                  <button
                    onClick={() => handleSeatClick(room)}
                    className={`
                      w-20 h-20 rounded-lg border-2 flex flex-col items-center justify-center p-2
                      transition-all duration-200 transform hover:scale-105 shadow-md
                      ${getSeatColor(room)}
                      cursor-pointer
                    `}
                  >
                    <div className="text-center font-bold">
                      <div className="text-xl">{room.number}</div>
                    </div>
                  </button>

                  {/* Info adicional */}
                  <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-center text-xs text-gray-600 whitespace-nowrap">
                    ${room.price.toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Leyenda simplificada */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-white rounded-lg border">
          <div className="flex items-center justify-center">
            <div className="w-6 h-6 bg-green-500 border border-green-600 rounded mr-2"></div>
            <div className="text-gray-700">
              <span className="font-medium">Verde:</span> Habitación disponible
            </div>
          </div>
          <div className="flex items-center justify-center">
            <div className="w-6 h-6 bg-red-500 border border-red-600 rounded mr-2"></div>
            <div className="text-gray-700">
              <span className="font-medium">Rojo:</span> Habitación seleccionada
            </div>
          </div>
        </div>

        {/* Información de la habitación seleccionada */}
        {formData.roomId && (
          <div className="mt-8 p-6 bg-white rounded-lg border border-gray-200">
            <h4 className="text-gray-900 font-semibold text-lg mb-4">Habitación Seleccionada:</h4>
            <div className="flex items-center">
              <div className="w-20 h-20 bg-red-100 rounded-lg mr-4 flex items-center justify-center">
                <span className="text-red-600 text-3xl font-bold">
                  {availableRooms.find(r => r.id === formData.roomId)?.number || ''}
                </span>
              </div>
              <div className="flex-1">
                <p className="text-gray-900 font-medium text-lg">{formData.roomName}</p>
                <p className="text-gray-600">${formData.price.toLocaleString()}/noche</p>
                <p className="text-gray-500 text-sm">{formData.nights} noches</p>
              </div>
              <button
                onClick={() => setFormData(prev => ({ ...prev, roomId: "" }))}
                className="text-gray-500 hover:text-gray-700 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cambiar
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }

  // FUNCIÓN PARA ENVIAR RESERVA
  const submitBooking = useCallback(async () => {
    if (!validateStep(3)) {
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      console.log('📝 Starting booking process...')

      // Preparar datos de la reserva
      const reservationData = {
        room_id: formData.roomId ? parseInt(formData.roomId) : null,
        start_date: formData.checkIn || null,
        end_date: formData.checkOut || null,
        services: selectedServices.map(service => ({
          id_servicio: service.id ? parseInt(service.id) : null,
          cantidad: service.cantidad ? parseInt(service.cantidad.toString()) : 1,
          precio_total: service.price ? parseFloat(service.price.toString()) * (service.cantidad || 1) : 0
        })).filter(service => service.id_servicio !== null),
        guests: formData.guests ? parseInt(formData.guests.toString()) : 1,
        total_price: formData.total ? parseFloat(formData.total.toString()) : 0,
        special_requests: formData.specialRequests || null,
        nombre_cliente: formData.name || null,
        correo_cliente: formData.email || null,
        telefono_cliente: formData.phone || null
      }

      // Validación adicional
      if (!reservationData.room_id || isNaN(reservationData.room_id)) {
        throw new Error('ID de habitación no válido')
      }
      
      if (!reservationData.start_date || !reservationData.end_date) {
        throw new Error('Fechas de reserva no válidas')
      }

      // Validar fechas
      const startDate = new Date(reservationData.start_date)
      const endDate = new Date(reservationData.end_date)
      
      if (!isValid(startDate) || !isValid(endDate)) {
        throw new Error('Las fechas seleccionadas no son válidas')
      }

      if (startDate >= endDate) {
        throw new Error('La fecha de salida debe ser posterior a la fecha de entrada')
      }

      console.log('📦 Final reservation data to send:', reservationData)

      // USAR LA RUTA PÚBLICA
      const response = await fetch('http://localhost:5000/api/reservations/public', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reservationData),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Error ${response.status}: ${errorText}`)
      }

      const result = await response.json()
      console.log('✅ Reservation created:', result)

      setBookingId(result.reservation_id || result.id || `RES-${Date.now()}`)
      setBookingComplete(true)

    } catch (error) {
      console.error('❌ Error creating reservation:', error)
      setError(`Error al crear la reserva: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }, [formData, selectedServices, validateStep])

  // Renderizar confirmación de reserva
  if (bookingComplete) {
    return (
      <div className="py-16 bg-gray-50 min-h-screen">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="h-10 w-10 text-green-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">¡Reserva Confirmada!</h2>
            <p className="text-gray-600 text-lg">
              Su reserva ha sido confirmada con éxito. Hemos enviado un correo electrónico de confirmación con todos los
              detalles a <span className="font-medium">{formData.email}</span>.
            </p>
          </div>

          <div className="bg-white p-8 rounded-lg shadow-md mb-8">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold">Detalles de la Reserva</h3>
              <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                Confirmada
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <p className="text-sm text-gray-500">Número de Reserva</p>
                <p className="font-medium text-lg">{bookingId}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Fecha de Reserva</p>
                <p className="font-medium">{format(new Date(), "PPP", { locale: es })}</p>
              </div>
            </div>

            <div className="flex mb-6">
              <div className="w-24 h-24 bg-gray-200 rounded-md flex items-center justify-center mr-4">
                {formData.roomImage ? (
                  <img 
                    src={formData.roomImage} 
                    alt={formData.roomName}
                    className="w-full h-full object-cover rounded-md"
                  />
                ) : (
                  <span className="text-gray-500 text-sm">Imagen</span>
                )}
              </div>
              <div>
                <h4 className="font-semibold text-lg">{formData.roomName}</h4>
                <div className="flex items-center text-gray-600 mt-1">
                  <Calendar className="h-4 w-4 mr-1" />
                  <span>
                    {formData.checkIn ? format(new Date(formData.checkIn), "PPP", { locale: es }) : "N/A"} -
                    {formData.checkOut ? format(new Date(formData.checkOut), "PPP", { locale: es }) : "N/A"}
                  </span>
                </div>
                <div className="flex items-center text-gray-600 mt-1">
                  <Users className="h-4 w-4 mr-1" />
                  <span>{formData.guests} huéspedes</span>
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Subtotal</span>
                <span>${formData.subtotal.toFixed(2)}</span>
              </div>
              {promoApplied && (
                <div className="flex justify-between mb-2 text-green-600">
                  <span>Descuento (15%)</span>
                  <span>-${(formData.price * 0.15 * formData.nights).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Impuestos</span>
                <span>${formData.taxes.toFixed(2)}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Tarifa de servicio</span>
                <span>${formData.serviceFee.toFixed(2)}</span>
              </div>
              {selectedServices.length > 0 && (
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Servicios adicionales</span>
                  <span>${selectedServices.reduce((total, service) => 
                    total + (service.price * (service.cantidad || 1)), 0).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-lg pt-2 border-t mt-2">
                <span>Total</span>
                <span>${(formData.total + selectedServices.reduce((total, service) => 
                  total + (service.price * (service.cantidad || 1)), 0)).toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 p-6 rounded-lg mb-8">
            <h3 className="text-lg font-semibold mb-4 text-blue-800">Información Importante</h3>
            <div className="space-y-3">
              <div className="flex items-start">
                <Calendar className="h-5 w-5 text-blue-600 mr-2 mt=0.5" />
                <div>
                  <p className="font-medium text-blue-800">Horarios de Check-in y Check-out</p>
                  <p className="text-blue-700">Check-in: a partir de las 15:00 | Check-out: hasta las 12:00</p>
                </div>
              </div>
              <div className="flex items-start">
                <Info className="h-5 w-5 text-blue-600 mr-2 mt=0.5" />
                <div>
                  <p className="font-medium text-blue-800">Política de Cancelación</p>
                  <p className="text-blue-700">Cancelación gratuita hasta 48 horas antes de la fecha de llegada.</p>
                </div>
              </div>
              <div className="flex items-start">
                <Shield className="h-5 w-5 text-blue-600 mr-2 mt=0.5" />
                <div>
                  <p className="font-medium text-blue-800">Documentación Necesaria</p>
                  <p className="text-blue-700">
                    Todos los huéspedes deben presentar un documento de identidad válido al momento del check-in.
                  </p>
                </div>
              </div>
              {formData.paymentMethod === "hotel" && (
                <div className="flex items-start">
                  <Wallet className="h-5 w-5 text-blue-600 mr-2 mt=0.5" />
                  <div>
                    <p className="font-medium text-blue-800">Pago en el Hotel</p>
                    <p className="text-blue-700">
                      Deberá realizar el pago al momento del check-in. Aceptamos efectivo y tarjetas.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-center space-x-4">
            <button 
              onClick={() => navigate('/')}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Volver al Inicio
            </button>
            <button 
              onClick={() => navigate('/cliente/reservas')}
              className="px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
            >
              Ver Mis Reservas
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="py-16 bg-gray-50 min-h-screen">
      {/* Modales */}
      {showServicesModal && <ServicesModal />}
      {showRoomDetails && <RoomDetailsModal />}

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-gray-900">Reservar Habitación</h1>
          <p className="mt-4 text-lg text-gray-600">Completa el formulario paso a paso para realizar tu reserva</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8">
          {/* Indicador de pasos */}
          <div className="flex justify-between items-center mb-8">
            <div className={`flex items-center ${step >= 1 ? "text-primary-600" : "text-gray-400"}`}>
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center mr-2 ${step >= 1 ? "bg-primary-600 text-white" : "bg-gray-200 text-gray-600"}`}
              >
                1
              </div>
              <span className="font-medium">Información</span>
            </div>
            <div className="h-px w-16 bg-gray-300"></div>
            <div className={`flex items-center ${step >= 2 ? "text-primary-600" : "text-gray-400"}`}>
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center mr-2 ${step >= 2 ? "bg-primary-600 text-white" : "bg-gray-200 text-gray-600"}`}
              >
                2
              </div>
              <span className="font-medium">Pago</span>
            </div>
            <div className="h-px w-16 bg-gray-300"></div>
            <div className={`flex items-center ${step >= 3 ? "text-primary-600" : "text-gray-400"}`}>
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center mr-2 ${step >= 3 ? "bg-primary-600 text-white" : "bg-gray-200 text-gray-600"}`}
              >
                3
              </div>
              <span className="font-medium">Confirmación</span>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                <p className="text-red-700">{error}</p>
              </div>
            </div>
          )}

          {/* Paso 1: Información del huésped */}
          {step === 1 && (
            <div>
              <h2 className="text-2xl font-bold mb-6">Información del Huésped</h2>

              {/* Selección de fechas */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold mb-3">Fechas de Estancia</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label htmlFor="checkIn" className="block text-sm font-medium text-gray-700 mb-1">
                      Fecha de Llegada
                    </label>
                    <input
                      type="date"
                      id="checkIn"
                      name="checkIn"
                      value={formData.checkIn}
                      onChange={(e) => handleDateChange("checkIn", new Date(e.target.value))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="checkOut" className="block text-sm font-medium text-gray-700 mb-1">
                      Fecha de Salida
                    </label>
                    <input
                      type="date"
                      id="checkOut"
                      name="checkOut"
                      value={formData.checkOut}
                      onChange={(e) => handleDateChange("checkOut", new Date(e.target.value))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>

                <div className="flex items-center">
                  <label htmlFor="guests" className="text-sm font-medium text-gray-700 mr-2">
                    Huéspedes:
                  </label>
                  <select
                    id="guests"
                    name="guests"
                    value={formData.guests}
                    onChange={handleGuestsChange}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    {[1, 2, 3, 4, 5, 6].map((num) => (
                      <option key={num} value={num}>
                        {num} {num === 1 ? "huésped" : "huéspedes"}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* HABITACIONES */}
              <div className="mb-8">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Selección de Habitación</h3>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setViewMode("list")}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        viewMode === "list" ? "bg-primary-100 text-primary-600" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      Vista Lista
                    </button>
                    <button
                      onClick={() => setViewMode("cinema")}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center ${
                        viewMode === "cinema" ? "bg-primary-100 text-primary-600" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      <Film className="h-4 w-4 mr-2" />
                      Vista Asientos
                    </button>
                  </div>
                </div>

                <div className="flex items-center mb-4 space-x-2">
                  <div className="relative flex-grow">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="text"
                      placeholder="Buscar habitaciones por número, tipo o descripción..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center transition-colors"
                  >
                    <Filter size={18} className="mr-2" />
                    Filtros
                  </button>
                </div>

                {showFilters && (
                  <div className="bg-gray-50 p-4 rounded-lg mb-4 border border-gray-200">
                    <h4 className="font-medium mb-3 text-gray-900">Filtros Avanzados</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Rango de Precio
                        </label>
                        <div className="flex items-center space-x-2 mt-1">
                          <input
                            type="number"
                            value={minPrice}
                            onChange={(e) => setMinPrice(Math.max(0, parseInt(e.target.value, 10) || 0))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                            min="0"
                            placeholder="Mínimo"
                          />
                          <span className="text-gray-500">-</span>
                          <input
                            type="number"
                            value={maxPrice}
                            onChange={(e) => setMaxPrice(Math.max(minPrice, parseInt(e.target.value, 10) || maxPrice))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                            min={minPrice}
                            placeholder="Máximo"
                          />
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          ${minPrice.toLocaleString()} - ${maxPrice.toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Capacidad Mínima</label>
                        <select
                          value={capacity}
                          onChange={(e) => setCapacity(parseInt(e.target.value, 10))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        >
                          {[1, 2, 3, 4, 5, 6].map((num) => (
                            <option key={num} value={num}>
                              {num} {num === 1 ? "persona" : "personas"}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Habitación</label>
                        <select
                          value={searchTerm}
                          onChange={(e) => {
                            if (e.target.value === '') {
                              setSearchTerm('')
                            } else {
                              setSearchTerm(e.target.value)
                            }
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        >
                          <option value="">Todos los tipos</option>
                          <option value="sencilla">Sencilla</option>
                          <option value="doble">Doble</option>
                          <option value="suite">Suite</option>
                          <option value="ejecutiva">Ejecutiva</option>
                          <option value="familiar">Familiar</option>
                        </select>
                      </div>
                    </div>
                    <div className="mt-3 flex justify-between items-center">
                      <div className="text-sm text-gray-600">
                        Mostrando {filteredRooms.length} de {availableRooms.length} habitaciones disponibles
                      </div>
                      <button 
                        onClick={() => {
                          setMinPrice(0)
                          setMaxPrice(500000)
                          setCapacity(1)
                          setSearchTerm("")
                        }}
                        className="px-3 py-1 text-sm text-primary-600 hover:text-primary-800"
                      >
                        Restablecer filtros
                      </button>
                    </div>
                  </div>
                )}

                {isLoading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Cargando habitaciones disponibles...</p>
                  </div>
                ) : filteredRooms.length === 0 ? (
                  <div className="text-center py-12 bg-yellow-50 rounded-lg border border-yellow-200">
                    <Bed className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-yellow-800 mb-2">
                      No se encontraron habitaciones
                    </h3>
                    <p className="text-yellow-700">
                      No hay habitaciones disponibles que coincidan con tus criterios de búsqueda.
                    </p>
                  </div>
                ) : viewMode === "list" ? (
                  <>
                    <div className="space-y-6">
                      {currentRooms.map((room) => {
                        const currentSlideIndex = roomSlides[room.id] || 0
                        
                        return (
                          <div
                            key={room.id}
                            className={`border rounded-xl overflow-hidden transition-all duration-200 ${
                              formData.roomId === room.id 
                                ? "border-primary-600 ring-2 ring-primary-600/20 shadow-md" 
                                : "border-gray-200 hover:border-gray-300 hover:shadow-sm"
                            }`}
                          >
                            <div className="flex flex-col md:flex-row">
                              <div className="md:w-1/3 h-64 md:h-auto bg-gray-200 relative">
                                {/* Carousel de imágenes */}
                                <div className="relative h-full">
                                  <img 
                                    src={room.images?.[currentSlideIndex] || room.images?.[0]} 
                                    alt={room.name}
                                    className="w-full h-full object-cover transition-opacity duration-300"
                                  />
                                  
                                  {/* Controles del carousel */}
                                  {room.images && room.images.length > 1 && (
                                    <>
                                      <button 
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          changeRoomSlide(room.id, 'prev')
                                        }}
                                        className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white/80 text-gray-800 p-2 rounded-full hover:bg-white shadow-md"
                                      >
                                        <ChevronLeft className="h-4 w-4" />
                                      </button>
                                      <button 
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          changeRoomSlide(room.id, 'next')
                                        }}
                                        className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white/80 text-gray-800 p-2 rounded-full hover:bg-white shadow-md"
                                      >
                                        <ChevronRight className="h-4 w-4" />
                                      </button>
                                      
                                      {/* Indicadores */}
                                      <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1">
                                        {room.images.map((_, index) => (
                                          <button
                                            key={index}
                                            onClick={(e) => {
                                              e.stopPropagation()
                                              setRoomSlides(prev => ({ ...prev, [room.id]: index }))
                                            }}
                                            className={`h-2 w-2 rounded-full ${index === currentSlideIndex ? 'bg-primary-500' : 'bg-white/70'}`}
                                          />
                                        ))}
                                      </div>
                                    </>
                                  )}
                                </div>
                                
                                {/* Botón para ver en pantalla completa */}
                                <button
                                  onClick={() => showRoomDetailModal(room)}
                                  className="absolute top-3 right-3 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
                                  title="Ver detalles"
                                >
                                  <Eye className="h-4 w-4" />
                                </button>
                                
                                {/* Número de imagen */}
                                {room.images && room.images.length > 1 && (
                                  <div className="absolute top-3 left-3 bg-black/50 text-white px-2 py-1 rounded text-xs">
                                    {currentSlideIndex + 1}/{room.images.length}
                                  </div>
                                )}
                              </div>
                              <div className="md:w-2/3 p-6">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <h4 className="text-xl font-semibold text-gray-900">{room.name}</h4>
                                    <div className="flex items-center mt-2 space-x-4">
                                      <div className="flex items-center text-gray-600">
                                        <Users className="h-4 w-4 mr-1" />
                                        <span>Hasta {room.capacity} huéspedes</span>
                                      </div>
                                      <div className="flex items-center">
                                        <Star className="h-4 w-4 text-yellow-400 mr-1" />
                                        <span className="font-medium">{room.rating?.toFixed(1)}</span>
                                        <span className="text-gray-500 text-sm ml-1">({room.reviews} reseñas)</span>
                                      </div>
                                    </div>
                                  </div>
                                  <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                                    Disponible
                                  </span>
                                </div>

                                <p className="text-gray-600 mt-3">{room.description}</p>

                                <div className="flex flex-wrap gap-2 mt-4">
                                  {room.amenities?.slice(0, 4).map((amenity, index) => (
                                    <span key={index} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                                      {amenity}
                                    </span>
                                  ))}
                                  {room.amenities && room.amenities.length > 4 && (
                                    <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                                      +{room.amenities.length - 4} más
                                    </span>
                                  )}
                                </div>

                                <div className="flex justify-between items-center mt-6 pt-6 border-t">
                                  <div>
                                    <span className="text-3xl font-bold text-gray-900">${room.price.toLocaleString()}</span>
                                    <span className="text-gray-500"> / noche</span>
                                  </div>

                                  <div className="flex space-x-3">
                                    <button
                                      onClick={() => showRoomDetailModal(room)}
                                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                                    >
                                      Ver Detalles
                                    </button>
                                    <button
                                      onClick={() => handleRoomSelect(room)}
                                      className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                                        formData.roomId === room.id
                                          ? "bg-green-600 hover:bg-green-700 text-white"
                                          : "bg-primary-500 hover:bg-primary-600 text-white"
                                      }`}
                                    >
                                      {formData.roomId === room.id
                                        ? "Seleccionada ✓"
                                        : "Seleccionar"}
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    {/* Paginación */}
                    {totalPages > 1 && (
                      <div className="flex justify-center mt-8">
                        <nav className="flex items-center space-x-2">
                          <button
                            onClick={() => paginate(Math.max(1, currentPage - 1))}
                            disabled={currentPage === 1}
                            className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                          >
                            ←
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
                            className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                          >
                            →
                          </button>
                        </nav>
                      </div>
                    )}
                  </>
                ) : (
                  <CinemaView />
                )}
              </div>

              {formData.roomId && (
                <>
                  {/* Panel de servicios */}
                  <div className="mb-8">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold">Servicios Adicionales</h3>
                      <button
                        onClick={() => setShowServicesModal(true)}
                        className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors flex items-center"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Agregar servicios
                      </button>
                    </div>
                    
                    {selectedServices.length > 0 ? (
                      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <h4 className="font-medium mb-3">Servicios seleccionados:</h4>
                        <div className="space-y-3">
                          {selectedServices.map((service) => (
                            <div key={service.id} className="flex justify-between items-center p-3 bg-white rounded border">
                              <div>
                                <span className="font-medium">{service.name}</span>
                                <div className="text-sm text-gray-600">
                                  ${service.price.toLocaleString()} × {service.cantidad || 1}
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <div className="flex items-center bg-gray-100 rounded">
                                  <button
                                    onClick={() => handleUpdateServiceQuantity(service.id, (service.cantidad || 1) - 1)}
                                    className="p-2 hover:bg-gray-200"
                                  >
                                    <Minus className="h-3 w-3" />
                                  </button>
                                  <span className="font-medium w-8 text-center">{service.cantidad || 1}</span>
                                  <button
                                    onClick={() => handleUpdateServiceQuantity(service.id, (service.cantidad || 1) + 1)}
                                    className="p-2 hover:bg-gray-200"
                                  >
                                    <Plus className="h-3 w-3" />
                                  </button>
                                </div>
                                <span className="font-medium">
                                  ${(service.price * (service.cantidad || 1)).toLocaleString()}
                                </span>
                                <button
                                  onClick={() => handleRemoveService(service.id)}
                                  className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                                >
                                  ✕
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 text-center">
                        <p className="text-gray-600">No hay servicios seleccionados</p>
                      </div>
                    )}
                  </div>

                  <div className="bg-gray-50 p-6 rounded-xl mb-6 border border-gray-200">
                    <h3 className="font-semibold mb-4 text-gray-900">Habitación Seleccionada</h3>
                    <div className="flex items-center">
                      <div className="w-20 h-20 mr-4 bg-gray-200 rounded-lg flex items-center justify-center overflow-hidden">
                        {formData.roomImage ? (
                          <img 
                            src={formData.roomImage} 
                            alt={formData.roomName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Bed className="h-8 w-8 text-gray-400" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-lg text-gray-900">{formData.roomName}</p>
                        <p className="text-sm text-gray-600">
                          {formData.nights} {formData.nights === 1 ? "noche" : "noches"} x ${formData.price.toLocaleString()} = $
                          {formData.subtotal.toFixed(2)}
                        </p>
                        <p className="text-sm text-gray-500">Número: {availableRooms.find(r => r.id === formData.roomId)?.number}</p>
                      </div>
                      <button
                        onClick={() => setFormData(prev => ({ ...prev, roomId: "" }))}
                        className="text-red-600 hover:text-red-800 font-medium"
                      >
                        Cambiar
                      </button>
                    </div>
                  </div>
                </>
              )}

              {/* Código promocional */}
              {formData.roomId && (
                <div className="mb-8">
                  <h3 className="text-lg font-semibold mb-3">¿Tienes un código promocional?</h3>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      placeholder="Ingresa tu código promocional"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value)}
                      className="flex-grow px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                    <button
                      onClick={handleApplyPromo}
                      disabled={!promoCode}
                      className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Aplicar
                    </button>
                  </div>
                  {promoApplied && (
                    <div className="mt-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex">
                        <Check className="h-5 w-5 text-green-600 mr-2" />
                        <p className="text-green-600">¡Código promocional aplicado! 15% de descuento.</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Información personal */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold mb-4">Información Personal</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre Completo *
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                      Correo Electrónico *
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                      Teléfono *
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="specialRequests" className="block text-sm font-medium text-gray-700 mb-1">
                    Solicitudes Especiales (Opcional)
                  </label>
                  <textarea
                    id="specialRequests"
                    name="specialRequests"
                    value={formData.specialRequests}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Por ejemplo: cama adicional, alergias, preferencias de comida..."
                  />
                </div>
              </div>

              {formData.roomId && formData.checkIn && formData.checkOut && (
                <div className="border-t pt-6 mt-6">
                  <h3 className="text-lg font-semibold mb-4">Resumen de Costos</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">
                        ${promoApplied ? (formData.price * 0.85).toFixed(2) : formData.price.toLocaleString()} x {formData.nights}{" "}
                        {formData.nights === 1 ? "noche" : "noches"}
                      </span>
                      <span className="font-medium">${formData.subtotal.toFixed(2)}</span>
                    </div>
                    {promoApplied && (
                      <div className="flex justify-between text-green-600">
                        <span>Descuento (15%)</span>
                        <span className="font-medium">-${(formData.price * 0.15 * formData.nights).toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-600">Impuestos (12%)</span>
                      <span className="font-medium">${formData.taxes.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tarifa de servicio</span>
                      <span className="font-medium">${formData.serviceFee.toFixed(2)}</span>
                    </div>
                    {selectedServices.length > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Servicios adicionales</span>
                        <span className="font-medium">${selectedServices.reduce((total, service) => 
                          total + (service.price * (service.cantidad || 1)), 0).toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-lg pt-2 border-t mt-2">
                      <span>Total</span>
                      <span>${(formData.total + selectedServices.reduce((total, service) => 
                        total + (service.price * (service.cantidad || 1)), 0)).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end mt-8">
                <button
                  onClick={nextStep}
                  disabled={
                    !formData.roomId ||
                    !formData.checkIn ||
                    !formData.checkOut ||
                    !formData.name ||
                    !formData.email ||
                    !formData.phone
                  }
                  className="px-8 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed text-lg font-medium transition-colors"
                >
                  Continuar al Pago
                </button>
              </div>
            </div>
          )}

          {/* Paso 2: Información de pago */}
          {step === 2 && (
            <div>
              <h2 className="text-2xl font-bold mb-6">Información de Pago</h2>

              <div className="mb-8">
                <div className="border-b border-gray-200">
                  <nav className="flex space-x-4">
                    <button
                      onClick={() => setPaymentTab("hotel")}
                      className={`py-3 px-6 border-b-2 font-medium text-sm rounded-t-lg transition-colors ${
                        paymentTab === "hotel"
                          ? "border-primary-500 text-primary-600 bg-primary-50"
                          : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center">
                        <Building className="h-5 w-5 mr-2" />
                        Pagar en Hotel
                      </div>
                    </button>
                    <button
                      onClick={() => setPaymentTab("credit-card")}
                      className={`py-3 px-6 border-b-2 font-medium text-sm rounded-t-lg transition-colors ${
                        paymentTab === "credit-card"
                          ? "border-primary-500 text-primary-600 bg-primary-50"
                          : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center">
                        <CreditCard className="h-5 w-5 mr-2" />
                        Tarjeta de Crédito
                      </div>
                    </button>
                  </nav>
                </div>

                <div className="mt-8">
                  {paymentTab === "hotel" && (
                    <div className="bg-blue-50 p-8 rounded-xl border border-blue-200">
                      <div className="text-center mb-6">
                        <Building className="h-16 w-16 text-blue-500 mx-auto mb-4" />
                        <h3 className="text-2xl font-semibold mb-2 text-blue-900">Pagar en el Hotel</h3>
                        <p className="text-gray-600 max-w-2xl mx-auto">
                          Reserve ahora y pague directamente en el hotel al momento del check-in. 
                          Sin cargos anticipados y con total flexibilidad.
                        </p>
                      </div>
                      <div className="bg-white p-6 rounded-lg border border-gray-200">
                        <h4 className="font-medium text-lg mb-4">Ventajas de pagar en el hotel:</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="text-center p-4">
                            <Check className="h-8 w-8 text-green-500 mx-auto mb-2" />
                            <p className="font-medium">Sin cargos anticipados</p>
                            <p className="text-sm text-gray-600 mt-1">Pague solo cuando llegue</p>
                          </div>
                          <div className="text-center p-4">
                            <Check className="h-8 w-8 text-green-500 mx-auto mb-2" />
                            <p className="font-medium">Múltiples métodos</p>
                            <p className="text-sm text-gray-600 mt-1">Efectivo o tarjeta</p>
                          </div>
                          <div className="text-center p-4">
                            <Check className="h-8 w-8 text-green-500 mx-auto mb-2" />
                            <p className="font-medium">Cancelación gratuita</p>
                            <p className="text-sm text-gray-600 mt-1">Hasta 48 horas antes</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {paymentTab === "credit-card" && (
                    <div className="space-y-6">
                      <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                        <h4 className="font-medium text-lg mb-4">Datos de la Tarjeta</h4>
                        <div className="space-y-4">
                          <div>
                            <label htmlFor="cardNumber" className="block text-sm font-medium text-gray-700 mb-1">
                              Número de Tarjeta
                            </label>
                            <input
                              type="text"
                              id="cardNumber"
                              name="cardNumber"
                              placeholder="1234 5678 9012 3456"
                              value={formData.cardNumber}
                              onChange={handleInputChange}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                              required
                            />
                          </div>

                          <div>
                            <label htmlFor="cardName" className="block text-sm font-medium text-gray-700 mb-1">
                              Nombre en la Tarjeta
                            </label>
                            <input
                              type="text"
                              id="cardName"
                              name="cardName"
                              placeholder="JUAN PEREZ"
                              value={formData.cardName}
                              onChange={handleInputChange}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                              required
                            />
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label htmlFor="cardExpiry" className="block text-sm font-medium text-gray-700 mb-1">
                                Fecha de Expiración (MM/YY)
                              </label>
                              <input
                                type="text"
                                id="cardExpiry"
                                name="cardExpiry"
                                placeholder="MM/YY"
                                value={formData.cardExpiry}
                                onChange={handleInputChange}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                required
                              />
                            </div>
                            <div>
                              <label htmlFor="cardCvc" className="block text-sm font-medium text-gray-700 mb-1">
                                CVC
                              </label>
                              <input
                                type="text"
                                id="cardCvc"
                                name="cardCvc"
                                placeholder="123"
                                value={formData.cardCvc}
                                onChange={handleInputChange}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                required
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex">
                          <Shield className="h-5 w-5 text-blue-600 mr-2" />
                          <p className="text-blue-600 text-sm">
                            Tus datos están protegidos con encriptación de 256-bit. No almacenamos información de tarjetas de crédito.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-between mt-8">
                <button
                  onClick={prevStep}
                  className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  ← Atrás
                </button>
                <button
                  onClick={nextStep}
                  className="px-8 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
                >
                  Continuar a Confirmación
                </button>
              </div>
            </div>
          )}

          {/* Paso 3: Confirmación */}
          {step === 3 && (
            <div>
              <h2 className="text-2xl font-bold mb-6">Confirmación de Reserva</h2>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                  <div className="bg-gray-50 p-6 rounded-xl mb-6 border border-gray-200">
                    <h3 className="text-lg font-semibold mb-4">Términos y Condiciones</h3>

                    <div className="space-y-4 max-h-60 overflow-y-auto p-4 bg-white rounded-lg border border-gray-200">
                      <div>
                        <h4 className="font-medium mb-2">Política de Cancelación</h4>
                        <p className="text-sm text-gray-600">
                          Puedes cancelar tu reserva de forma gratuita hasta 48 horas antes de tu fecha de check-in. 
                          Las cancelaciones realizadas con menos de 48 horas de antelación estarán sujetas a un cargo 
                          equivalente a la primera noche de estancia.
                        </p>
                      </div>

                      <div>
                        <h4 className="font-medium mb-2">Política de No Show</h4>
                        <p className="text-sm text-gray-600">
                          En caso de no presentarse el día del check-in sin previa cancelación, se cobrará el importe 
                          total de la estancia reservada.
                        </p>
                      </div>

                      <div>
                        <h4 className="font-medium mb-2">Política de Huéspedes</h4>
                        <p className="text-sm text-gray-600">
                          El número de huéspedes no puede exceder la capacidad máxima de la habitación. 
                          Se requiere identificación válida para todos los huéspedes al momento del check-in.
                        </p>
                      </div>

                      <div>
                        <h4 className="font-medium mb-2">Horarios</h4>
                        <p className="text-sm text-gray-600">
                          Check-in: a partir de las 15:00 | Check-out: hasta las 12:00. 
                          Horarios fuera de este rango están sujetos a disponibilidad y pueden generar cargos adicionales.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 mt-4 p-3 bg-white rounded-lg border border-gray-200">
                      <input
                        type="checkbox"
                        id="terms"
                        checked={termsAccepted}
                        onChange={(e) => setTermsAccepted(e.target.checked)}
                        className="h-5 w-5 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                      <label htmlFor="terms" className="text-sm text-gray-700">
                        He leído y acepto los <span className="text-primary-600 cursor-pointer hover:underline">términos y condiciones</span> y la <span className="text-primary-600 cursor-pointer hover:underline">política de privacidad</span>
                      </label>
                    </div>
                  </div>

                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mb-6">
                    <div className="flex">
                      <Info className="h-5 w-5 text-blue-600 mr-2" />
                      <p className="text-blue-600">
                        Al completar esta reserva, aceptas nuestras políticas y autorizas el cargo correspondiente 
                        en tu método de pago. Recibirás un correo de confirmación inmediatamente.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-1">
                  <div className="bg-gray-50 p-6 rounded-xl sticky top-4 border border-gray-200">
                    <h3 className="text-lg font-semibold mb-4">Resumen Final</h3>

                    <div className="flex items-center mb-4 pb-4 border-b">
                      <div className="w-16 h-16 mr-3 bg-gray-200 rounded-lg flex items-center justify-center overflow-hidden">
                        {formData.roomImage ? (
                          <img 
                            src={formData.roomImage} 
                            alt={formData.roomName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Bed className="h-6 w-6 text-gray-400" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{formData.roomName}</p>
                        <p className="text-sm text-gray-600">
                          {formData.nights} {formData.nights === 1 ? "noche" : "noches"}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3 text-sm mb-4">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Fechas</span>
                        <span className="text-right text-gray-900">
                          {formData.checkIn ? format(new Date(formData.checkIn), "dd/MM/yy") : "N/A"} -{" "}
                          {formData.checkOut ? format(new Date(formData.checkOut), "dd/MM/yy") : "N/A"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Huéspedes</span>
                        <span className="text-gray-900">{formData.guests}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Método de pago</span>
                        <span className="capitalize text-gray-900">
                          {formData.paymentMethod === "hotel" ? "Pago en Hotel" : "Tarjeta de Crédito"}
                        </span>
                      </div>
                    </div>

                    <div className="border-t pt-4">
                      <div className="flex justify-between text-lg font-bold">
                        <span className="text-gray-900">Total a Pagar</span>
                        <span className="text-primary-600">${(formData.total + selectedServices.reduce((total, service) => 
                          total + (service.price * (service.cantidad || 1)), 0)).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-between mt-8">
                <button
                  onClick={prevStep}
                  className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  ← Atrás
                </button>
                <button
                  onClick={submitBooking}
                  disabled={isLoading || !termsAccepted}
                  className="px-8 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed text-lg font-medium transition-colors"
                >
                  {isLoading ? (
                    <span className="flex items-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Procesando...
                    </span>
                  ) : (
                    "Confirmar y Realizar Reserva"
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Booking