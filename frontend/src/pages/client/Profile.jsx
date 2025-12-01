import React, { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { User, Mail, Phone, MapPin, Globe, Save, Edit } from 'lucide-react'

const ClientProfile = () => {
  const { user } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    last_name: '',
    email: '',
    phone: '',
    address: '',
    nationality: ''
  })

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.nombre_cliente || '',
        last_name: user.apellido_cliente || '',
        email: user.correo_cliente || user.email || '',
        phone: user.telefono_cliente || '',
        address: user.direccion_cliente || '',
        nationality: user.nacionalidad || 'Colombiana'
      })
    }
  }, [user])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    
    // Simular actualización
    setTimeout(() => {
      setLoading(false)
      setIsEditing(false)
      alert('Perfil actualizado correctamente')
    }, 2000)
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const nacionalidades = [
    'Colombiana', 'Mexicana', 'Argentina', 'Peruana', 
    'Chilena', 'Ecuatoriana', 'Venezolana', 'Española',
    'Estadounidense', 'Otra'
  ]

  if (!user) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Mi Perfil</h1>
          <p className="text-gray-600 mt-2">
            Gestiona tu información personal
          </p>
        </div>
        <button
          onClick={() => setIsEditing(!isEditing)}
          className="flex items-center px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors duration-200"
        >
          {isEditing ? (
            <>
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </>
          ) : (
            <>
              <Edit className="h-4 w-4 mr-2" />
              Editar Perfil
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="text-center">
              <div className="bg-primary-100 text-primary-600 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="h-10 w-10" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">
                {formData.name} {formData.last_name}
              </h2>
              <p className="text-gray-600 mt-1">{formData.email}</p>
              <div className="mt-4 space-y-2 text-sm text-gray-600">
                <div className="flex items-center justify-center">
                  <Phone className="h-4 w-4 mr-2" />
                  <span>{formData.phone || 'No especificado'}</span>
                </div>
                <div className="flex items-center justify-center">
                  <Globe className="h-4 w-4 mr-2" />
                  <span>{formData.nationality}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Form */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Nombre *
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    disabled={!isEditing}
                    value={formData.name}
                    onChange={handleChange}
                    className="mt-1 input-field disabled:bg-gray-50 disabled:text-gray-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Apellido *
                  </label>
                  <input
                    type="text"
                    name="last_name"
                    required
                    disabled={!isEditing}
                    value={formData.last_name}
                    onChange={handleChange}
                    className="mt-1 input-field disabled:bg-gray-50 disabled:text-gray-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Correo Electrónico *
                </label>
                <div className="mt-1 relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="email"
                    name="email"
                    required
                    disabled={!isEditing}
                    value={formData.email}
                    onChange={handleChange}
                    className="mt-1 input-field pl-10 disabled:bg-gray-50 disabled:text-gray-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Teléfono
                </label>
                <div className="mt-1 relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="tel"
                    name="phone"
                    disabled={!isEditing}
                    value={formData.phone}
                    onChange={handleChange}
                    className="mt-1 input-field pl-10 disabled:bg-gray-50 disabled:text-gray-500"
                    placeholder="+57 300 123 4567"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Dirección
                </label>
                <div className="mt-1 relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="text"
                    name="address"
                    disabled={!isEditing}
                    value={formData.address}
                    onChange={handleChange}
                    className="mt-1 input-field pl-10 disabled:bg-gray-50 disabled:text-gray-500"
                    placeholder="Tu dirección completa"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Nacionalidad
                </label>
                <select
                  name="nationality"
                  disabled={!isEditing}
                  value={formData.nationality}
                  onChange={handleChange}
                  className="mt-1 input-field disabled:bg-gray-50 disabled:text-gray-500"
                >
                  {nacionalidades.map((nacionalidad) => (
                    <option key={nacionalidad} value={nacionalidad}>
                      {nacionalidad}
                    </option>
                  ))}
                </select>
              </div>

              {isEditing && (
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex items-center px-6 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors duration-200"
                  >
                    {loading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Guardar Cambios
                      </>
                    )}
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ClientProfile