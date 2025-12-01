import React, { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { getRooms, getServices, createReservationWithPayment } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { 
  Calendar, 
  Users, 
  Bed, 
  Wifi, 
  Car, 
  Utensils, 
  Waves, 
  Check, 
  CreditCard,
  DollarSign,
  Clock
} from 'lucide-react'

const Booking = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { isAuthenticated, user } = useAuth()
  
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [rooms, setRooms] = useState([])
  const [services, setServices] = useState([])
  const [selectedRoom, setSelectedRoom] = useState(null)
  const [selectedServices, setSelectedServices] = useState([])
  
  // Datos del formulario
  const [formData, setFormData] = useState({
    start_date: searchParams.get('start_date') || '',
    end_date: searchParams.get('end_date') || '',
    guests: searchParams.get('guests') || '1',
    room_type: searchParams.get('room_type') || 'all',
    guest_info: {
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      document: ''
    },
    payment_method: 'Tarjeta',
    special_requests: ''
  })

  useEffect(() => {
    loadInitialData()
  }, [])

  const loadInitialData = async () => {
    try {
      setLoading(true)
      const [roomsData, servicesData] = await Promise.all([
        getRooms(),
        getServices()
      ])
      setRooms(roomsData)
      setServices(servicesData)
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredRooms = rooms.filter(room => 
    (formData.room_type === 'all' || room.tipo === formData.room_type) &&
    room.estado === 'Disponible' &&
    room.capacidad >= parseInt(formData.guests)
  )

  const calculateTotal = () => {
    let total = selectedRoom ? selectedRoom.precio : 0
    selectedServices.forEach(service => {
      total += service.price * service.quantity
    })
    return total
  }

  const handleServiceToggle = (service) => {
    setSelectedServices(prev => {
      const existing = prev.find(s => s.id === service.id)
      if (existing) {
        return prev.filter(s => s.id !== service.id)
      } else {
        return [...prev, { ...service, quantity: 1 }]
      }
    })
  }

  const handleServiceQuantityChange = (serviceId, quantity) => {
    setSelectedServices(prev =>
      prev.map(service =>
        service.id === serviceId ? { ...service, quantity: Math.max(1, quantity) } : service
      )
    )
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!isAuthenticated) {
      navigate('/auth/login', { state: { returnTo: '/reservar' } })
      return
    }

    if (!selectedRoom) {
      alert('Por favor selecciona una habitación')
      return
    }

    setLoading(true)
    try {
      const reservationData = {
        room_id: parseInt(selectedRoom.id),
        start_date: formData.start_date,
        end_date: formData.end_date,
        services: selectedServices.map(service => ({
          id: parseInt(service.id),
          quantity: service.quantity,
          total_price: service.price * service.quantity
        })),
        guest_info: formData.guest_info,
        payment_method: formData.payment_method,
        total_amount: calculateTotal(),
        special_requests: formData.special_requests
      }

      const result = await createReservationWithPayment(reservationData)
      
      alert('¡Reserva creada exitosamente!')
      navigate('/cliente/reservas')
      
    } catch (error) {
      console.error('Error creating reservation:', error)
      alert('Error al crear la reserva: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

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

  if (loading && step === 1) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Reserva tu Estadia
            </h1>
            <p className="text-xl text-gray-600">
              Completa los siguientes pasos para confirmar tu reserva
            </p>
          </div>

          {/* Progress Steps */}
          <div className="mt-8">
            <div className="flex justify-center">
              <div className="flex items-center space-x-8">
                {[1, 2, 3, 4].map((stepNumber) => (
                  <div key={stepNumber} className="flex items-center">
                    <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                      step >= stepNumber 
                        ? 'bg-primary-500 text-white' 
                        : 'bg-gray-200 text-gray-500'
                    }`}>
                      {step > stepNumber ? <Check className="h-5 w-5" /> : stepNumber}
                    </div>
                    {stepNumber < 4 && (
                      <div className={`w-16 h-1 ${
                        step > stepNumber ? 'bg-primary-500' : 'bg-gray-200'
                      }`} />
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-center mt-4 space-x-16">
              <span className={`text-sm ${step >= 1 ? 'text-primary-600 font-medium' : 'text-gray-500'}`}>
                Seleccionar Habitación
              </span>
              <span className={`text-sm ${step >= 2 ? 'text-primary-600 font-medium' : 'text-gray-500'}`}>
                Servicios Adicionales
              </span>
              <span className={`text-sm ${step >= 3 ? 'text-primary-600 font-medium' : 'text-gray-500'}`}>
                Información Personal
              </span>
              <span className={`text-sm ${step >= 4 ? 'text-primary-600 font-medium' : 'text-gray-500'}`}>
                Confirmación
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {step === 1 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  Selecciona tu Habitación
                </h2>

                {/* Search Filters */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fecha de Entrada
                    </label>
                    <input
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fecha de Salida
                    </label>
                    <input
                      type="date"
                      value={formData.end_date}
                      onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Huéspedes
                    </label>
                    <select
                      value={formData.guests}
                      onChange={(e) => setFormData({ ...formData, guests: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      {[1, 2, 3, 4].map(num => (
                        <option key={num} value={num}>{num} {num === 1 ? 'persona' : 'personas'}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tipo de Habitación
                    </label>
                    <select
                      value={formData.room_type}
                      onChange={(e) => setFormData({ ...formData, room_type: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="all">Todos los tipos</option>
                      <option value="Sencilla">Sencilla</option>
                      <option value="Doble">Doble</option>
                      <option value="Suite">Suite</option>
                    </select>
                  </div>
                </div>

                {/* Rooms Grid */}
                <div className="space-y-4">
                  {filteredRooms.map((room) => (
                    <div
                      key={room.id}
                      className={`border-2 rounded-xl p-4 cursor-pointer transition-all duration-200 ${
                        selectedRoom?.id === room.id
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:border-primary-300'
                      }`}
                      onClick={() => setSelectedRoom(room)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-3">
                            <div className="bg-primary-100 text-primary-600 p-2 rounded-lg">
                              <Bed className="h-5 w-5" />
                            </div>
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900">
                                Habitación {room.number}
                              </h3>
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                                {room.tipo}
                              </span>
                            </div>
                          </div>

                          <p className="text-gray-600 text-sm mb-3">
                            {room.descripcion}
                          </p>

                          <div className="flex items-center text-sm text-gray-500 mb-3">
                            <Users className="h-4 w-4 mr-1" />
                            <span>Capacidad: {room.capacidad} personas</span>
                          </div>

                          {room.amenities && room.amenities.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {room.amenities.slice(0, 4).map((amenity, index) => (
                                <div
                                  key={index}
                                  className="flex items-center space-x-1 bg-gray-50 px-2 py-1 rounded-md text-xs text-gray-600"
                                >
                                  {getAmenityIcon(amenity)}
                                  <span>{amenity}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="text-right">
                          <p className="text-2xl font-bold text-gray-900">
                            {formatPrice(room.precio)}
                          </p>
                          <p className="text-sm text-gray-500">por noche</p>
                          {selectedRoom?.id === room.id && (
                            <div className="mt-2 text-primary-600">
                              <Check className="h-5 w-5" />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  {filteredRooms.length === 0 && (
                    <div className="text-center py-8">
                      <Bed className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        No hay habitaciones disponibles
                      </h3>
                      <p className="text-gray-600">
                        No encontramos habitaciones que coincidan con tu búsqueda.
                      </p>
                    </div>
                  )}
                </div>

                {selectedRoom && (
                  <div className="mt-6 flex justify-end">
                    <button
                      onClick={() => setStep(2)}
                      className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200"
                    >
                      Continuar a Servicios
                    </button>
                  </div>
                )}
              </div>
            )}

            {step === 2 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  Servicios Adicionales
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {services.map((service) => (
                    <div
                      key={service.id}
                      className={`border-2 rounded-xl p-4 cursor-pointer transition-all duration-200 ${
                        selectedServices.find(s => s.id === service.id)
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:border-primary-300'
                      }`}
                      onClick={() => handleServiceToggle(service)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 mb-1">
                            {service.name}
                          </h3>
                          <p className="text-sm text-gray-600 mb-2">
                            {service.description}
                          </p>
                          <p className="text-lg font-bold text-primary-600">
                            {formatPrice(service.price)}
                          </p>
                        </div>
                        
                        {selectedServices.find(s => s.id === service.id) && (
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleServiceQuantityChange(service.id, selectedServices.find(s => s.id === service.id).quantity - 1)
                              }}
                              className="w-6 h-6 rounded-full bg-primary-500 text-white flex items-center justify-center"
                            >
                              -
                            </button>
                            <span className="w-8 text-center">
                              {selectedServices.find(s => s.id === service.id).quantity}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleServiceQuantityChange(service.id, selectedServices.find(s => s.id === service.id).quantity + 1)
                              }}
                              className="w-6 h-6 rounded-full bg-primary-500 text-white flex items-center justify-center"
                            >
                              +
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 flex justify-between">
                  <button
                    onClick={() => setStep(1)}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors duration-200"
                  >
                    Volver
                  </button>
                  <button
                    onClick={() => setStep(3)}
                    className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200"
                  >
                    Continuar a Información Personal
                  </button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  Información Personal
                </h2>

                <form className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nombre *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.guest_info.first_name}
                        onChange={(e) => setFormData({
                          ...formData,
                          guest_info: { ...formData.guest_info, first_name: e.target.value }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Apellido *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.guest_info.last_name}
                        onChange={(e) => setFormData({
                          ...formData,
                          guest_info: { ...formData.guest_info, last_name: e.target.value }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email *
                      </label>
                      <input
                        type="email"
                        required
                        value={formData.guest_info.email}
                        onChange={(e) => setFormData({
                          ...formData,
                          guest_info: { ...formData.guest_info, email: e.target.value }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Teléfono *
                      </label>
                      <input
                        type="tel"
                        required
                        value={formData.guest_info.phone}
                        onChange={(e) => setFormData({
                          ...formData,
                          guest_info: { ...formData.guest_info, phone: e.target.value }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Documento de Identidad
                    </label>
                    <input
                      type="text"
                      value={formData.guest_info.document}
                      onChange={(e) => setFormData({
                        ...formData,
                        guest_info: { ...formData.guest_info, document: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Método de Pago *
                    </label>
                    <select
                      value={formData.payment_method}
                      onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="Tarjeta">Tarjeta de Crédito/Débito</option>
                      <option value="Efectivo">Efectivo</option>
                      <option value="Transferencia">Transferencia Bancaria</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Solicitudes Especiales
                    </label>
                    <textarea
                      rows={3}
                      value={formData.special_requests}
                      onChange={(e) => setFormData({ ...formData, special_requests: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="Alergias alimenticias, requerimientos especiales, etc."
                    />
                  </div>
                </form>

                <div className="mt-6 flex justify-between">
                  <button
                    onClick={() => setStep(2)}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors duration-200"
                  >
                    Volver
                  </button>
                  <button
                    onClick={() => setStep(4)}
                    className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200"
                  >
                    Revisar y Confirmar
                  </button>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  Confirmación de Reserva
                </h2>

                <div className="space-y-6">
                  {/* Room Summary */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Habitación Seleccionada</h3>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold">Habitación {selectedRoom.number}</p>
                          <p className="text-gray-600 capitalize">{selectedRoom.tipo}</p>
                        </div>
                        <p className="text-lg font-bold text-primary-600">
                          {formatPrice(selectedRoom.precio)}/noche
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Services Summary */}
                  {selectedServices.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Servicios Adicionales</h3>
                      <div className="space-y-2">
                        {selectedServices.map((service) => (
                          <div key={service.id} className="flex justify-between items-center bg-gray-50 rounded-lg p-3">
                            <div>
                              <p className="font-medium">{service.name}</p>
                              <p className="text-sm text-gray-600">Cantidad: {service.quantity}</p>
                            </div>
                            <p className="font-semibold">
                              {formatPrice(service.price * service.quantity)}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Guest Info */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Información del Huésped</h3>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p><strong>Nombre:</strong> {formData.guest_info.first_name} {formData.guest_info.last_name}</p>
                      <p><strong>Email:</strong> {formData.guest_info.email}</p>
                      <p><strong>Teléfono:</strong> {formData.guest_info.phone}</p>
                      <p><strong>Método de Pago:</strong> {formData.payment_method}</p>
                    </div>
                  </div>

                  {/* Dates */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Fechas de Estadía</h3>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p><strong>Check-in:</strong> {new Date(formData.start_date).toLocaleDateString('es-CO')}</p>
                      <p><strong>Check-out:</strong> {new Date(formData.end_date).toLocaleDateString('es-CO')}</p>
                      <p><strong>Huéspedes:</strong> {formData.guests}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex justify-between">
                  <button
                    onClick={() => setStep(3)}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors duration-200"
                  >
                    Volver
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200 disabled:opacity-50"
                  >
                    {loading ? 'Procesando...' : 'Confirmar y Pagar'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar - Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Resumen de Reserva
              </h3>

              {selectedRoom && (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600">Habitación</p>
                    <p className="font-semibold">Habitación {selectedRoom.number} - {selectedRoom.tipo}</p>
                    <p className="text-sm text-gray-600">{formatPrice(selectedRoom.precio)}/noche</p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600">Fechas</p>
                    <p className="font-semibold">
                      {formData.start_date ? new Date(formData.start_date).toLocaleDateString('es-CO') : '-'} 
                      {' → '}
                      {formData.end_date ? new Date(formData.end_date).toLocaleDateString('es-CO') : '-'}
                    </p>
                  </div>

                  {selectedServices.length > 0 && (
                    <div>
                      <p className="text-sm text-gray-600 mb-2">Servicios</p>
                      <div className="space-y-1">
                        {selectedServices.map(service => (
                          <div key={service.id} className="flex justify-between text-sm">
                            <span>{service.name} (x{service.quantity})</span>
                            <span>{formatPrice(service.price * service.quantity)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold">Total</span>
                      <span className="text-xl font-bold text-primary-600">
                        {formatPrice(calculateTotal())}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {!selectedRoom && (
                <p className="text-gray-500 text-center py-4">
                  Selecciona una habitación para ver el resumen
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Booking