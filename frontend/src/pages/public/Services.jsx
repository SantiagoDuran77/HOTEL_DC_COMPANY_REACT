import React, { useState, useEffect } from 'react'
import { getServices } from '../../services/api'
import { Star, Clock, CheckCircle } from 'lucide-react'

const Services = () => {
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('all')

  useEffect(() => {
    loadServices()
  }, [])

  const loadServices = async () => {
    try {
      const servicesData = await getServices()
      console.log('📊 Services loaded in public page:', servicesData)
      setServices(servicesData)
    } catch (error) {
      console.error('Error loading services:', error)
    } finally {
      setLoading(false)
    }
  }

  // Obtener categorías únicas
  const getUniqueCategories = () => {
    const categoriesSet = new Set()
    services.forEach(service => {
      if (service.category) {
        categoriesSet.add(service.category)
      }
    })
    return ['all', ...Array.from(categoriesSet)]
  }

  const categories = getUniqueCategories()

  const filteredServices = services.filter(service => {
    if (!service) return false
    return selectedCategory === 'all' || service.category === selectedCategory
  })

  const formatPrice = (price) => {
    if (!price && price !== 0) return 'Consultar precio'
    
    try {
      return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0
      }).format(price)
    } catch {
      return 'Consultar precio'
    }
  }

  const getServiceIcon = (category) => {
    if (!category) return '⭐'
    
    const lowerCategory = category.toLowerCase()
    
    if (lowerCategory.includes('alimento') || lowerCategory.includes('comida')) return '🍽️'
    if (lowerCategory.includes('spa') || lowerCategory.includes('bienestar')) return '💆'
    if (lowerCategory.includes('transporte') || lowerCategory.includes('taxi')) return '🚗'
    if (lowerCategory.includes('limpieza')) return '🧹'
    if (lowerCategory.includes('recreación') || lowerCategory.includes('recreacion')) return '🏊'
    if (lowerCategory.includes('tecnología') || lowerCategory.includes('tecnologia')) return '📡'
    if (lowerCategory.includes('estacionamiento')) return '🅿️'
    if (lowerCategory.includes('mascota')) return '🐕'
    if (lowerCategory.includes('comunicación') || lowerCategory.includes('comunicacion')) return '📞'
    return '⭐'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
          </div>
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
              Servicios Premium
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Descubre nuestra amplia gama de servicios diseñados para hacer tu estadía inolvidable
            </p>
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-wrap gap-4 justify-center mb-8">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-6 py-3 rounded-lg font-medium transition-colors duration-200 capitalize ${
                selectedCategory === category 
                  ? 'bg-primary-500 text-white' 
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              {category === 'all' ? 'Todos' : category}
            </button>
          ))}
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredServices.map((service) => {
            if (!service) return null
            
            const name = service.nombre_servicio || service.name || 'Servicio sin nombre'
            const description = service.descripcion_servicio || service.description || 'Descripción no disponible'
            const price = service.precio_servicio || service.price || 0
            const category = service.category || 'Otros'
            const isPopular = price > 50000 || name.toLowerCase().includes('masaje') || name.toLowerCase().includes('cena')
            const icon = getServiceIcon(category)

            return (
              <div key={service.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200">
                <div className="aspect-w-16 aspect-h-9 bg-gradient-to-br from-primary-500 to-secondary-500 relative">
                  <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center">
                    <span className="text-4xl">{icon}</span>
                  </div>
                  <div className="absolute top-4 right-4">
                    {isPopular && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        <Star className="h-3 w-3 mr-1 fill-current" />
                        Popular
                      </span>
                    )}
                  </div>
                  <div className="absolute bottom-4 left-4">
                    <span className="bg-white bg-opacity-90 px-3 py-1 rounded-lg text-sm font-semibold text-gray-900">
                      {formatPrice(price)}
                    </span>
                  </div>
                </div>

                <div className="p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {name}
                  </h3>
                  
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                    {description}
                  </p>

                  <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      <span>Varía según servicio</span>
                    </div>
                    <span className="capitalize bg-gray-100 px-2 py-1 rounded text-xs">
                      {category}
                    </span>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                      <span>Disponible 24/7</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                      <span>Reserva con anticipación</span>
                    </div>
                  </div>

                  <button className="w-full bg-primary-500 hover:bg-primary-600 text-white py-2 px-4 rounded-lg font-medium transition-colors duration-200">
                    Solicitar Servicio
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        {filteredServices.length === 0 && (
          <div className="text-center py-12">
            <Star className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No hay servicios disponibles
            </h3>
            <p className="text-gray-600">
              {selectedCategory !== 'all' 
                ? `No encontramos servicios en la categoría "${selectedCategory}".` 
                : 'No hay servicios registrados en el sistema.'
              }
            </p>
            {selectedCategory !== 'all' && (
              <button
                onClick={() => setSelectedCategory('all')}
                className="mt-4 bg-primary-500 hover:bg-primary-600 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200"
              >
                Ver todos los servicios
              </button>
            )}
          </div>
        )}
      </div>

      {/* Additional Info */}
      <div className="bg-white border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              ¿Necesitas un servicio personalizado?
            </h2>
            <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
              Contáctanos para consultas sobre servicios especiales o requerimientos específicos.
            </p>
            <button className="bg-secondary-500 hover:bg-secondary-600 text-white px-8 py-3 rounded-lg font-semibold transition-colors duration-200">
              Contactar Servicios
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Services