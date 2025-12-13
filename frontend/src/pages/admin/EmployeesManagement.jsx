import React, { useState, useEffect } from 'react'
import { getEmployees, createEmployee, updateEmployee, deleteEmployee, updateEmployeeStatus } from '../../services/api'
import { Users, Mail, Phone, Calendar, Search, Filter, UserPlus, Edit, Trash2, UserCheck, UserX, Briefcase } from 'lucide-react'

const EmployeesManagement = () => {
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [positionFilter, setPositionFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showModal, setShowModal] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState(null)
  const [formData, setFormData] = useState({
    nombre_empleado: '',
    apellido_empleado: '',
    correo_empleado: '',
    telefono_empleado: '',
    cargo_empleado: 'Recepcionista',
    fecha_contratacion: new Date().toISOString().split('T')[0],
    contraseña: ''
  })
  const [formErrors, setFormErrors] = useState({})

  useEffect(() => {
    loadEmployees()
  }, [])

  const loadEmployees = async () => {
    try {
      setLoading(true)
      const employeesData = await getEmployees()
      console.log('📊 Employees loaded:', employeesData)
      
      // getEmployees() ya devuelve un array directamente
      setEmployees(employeesData)
    } catch (error) {
      console.error('Error loading employees:', error)
      alert('Error al cargar los empleados: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const filteredEmployees = employees.filter(employee => {
    const nombre = employee.nombre_empleado || employee.nombre || ''
    const apellido = employee.apellido_empleado || employee.apellido || ''
    const email = employee.correo_empleado || employee.email || ''
    const cargo = employee.cargo_empleado || employee.cargo || ''
    const estado = employee.estado_usuario || employee.estado || employee.status || ''
    
    const matchesSearch = (
      nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      apellido.toLowerCase().includes(searchTerm.toLowerCase()) ||
      email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cargo.toLowerCase().includes(searchTerm.toLowerCase())
    )
    
    const matchesPosition = positionFilter === 'all' || cargo === positionFilter
    const matchesStatus = statusFilter === 'all' || estado === statusFilter
    
    return matchesSearch && matchesPosition && matchesStatus
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    const errors = validateForm()
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      return
    }
    
    try {
      console.log('📤 Submitting employee data:', formData)
      
      if (editingEmployee) {
        const employeeId = editingEmployee.id_empleado || editingEmployee.id
        const result = await updateEmployee(employeeId.toString(), formData)
        
        if (result.success) {
          alert('Empleado actualizado exitosamente')
        } else {
          throw new Error(result.message || 'Error al actualizar el empleado')
        }
      } else {
        const result = await createEmployee(formData)
        
        if (result.success) {
          alert('Empleado creado exitosamente')
        } else {
          throw new Error(result.message || 'Error al crear el empleado')
        }
      }
      
      await loadEmployees()
      setShowModal(false)
      resetForm()
      setFormErrors({})
    } catch (error) {
      console.error('Error saving employee:', error)
      alert('Error al guardar el empleado: ' + error.message)
    }
  }

  const validateForm = () => {
    const errors = {}
    
    if (!formData.nombre_empleado.trim()) {
      errors.nombre_empleado = 'El nombre es requerido'
    }
    
    if (!formData.apellido_empleado.trim()) {
      errors.apellido_empleado = 'El apellido es requerido'
    }
    
    if (!formData.correo_empleado.trim()) {
      errors.correo_empleado = 'El correo es requerido'
    } else if (!/\S+@\S+\.\S+/.test(formData.correo_empleado)) {
      errors.correo_empleado = 'Correo electrónico inválido'
    }
    
    if (!formData.cargo_empleado) {
      errors.cargo_empleado = 'El cargo es requerido'
    }
    
    return errors
  }

  const handleEdit = (employee) => {
    console.log('✏️ Editing employee:', employee)
    setEditingEmployee(employee)
    setFormData({
      nombre_empleado: employee.nombre_empleado || employee.nombre || '',
      apellido_empleado: employee.apellido_empleado || employee.apellido || '',
      correo_empleado: employee.correo_empleado || employee.email || '',
      telefono_empleado: employee.telefono_empleado || employee.telefono || '',
      cargo_empleado: employee.cargo_empleado || employee.cargo || 'Recepcionista',
      fecha_contratacion: employee.fecha_contratacion || employee.hire_date || new Date().toISOString().split('T')[0],
      contraseña: ''
    })
    setFormErrors({})
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este empleado? Esta acción no se puede deshacer.')) {
      try {
        const result = await deleteEmployee(id.toString())
        
        if (result.success) {
          alert('Empleado eliminado exitosamente')
          await loadEmployees()
        } else {
          throw new Error(result.message || 'Error al eliminar el empleado')
        }
      } catch (error) {
        console.error('Error deleting employee:', error)
        alert('Error al eliminar el empleado: ' + error.message)
      }
    }
  }

  const handleStatusChange = async (employee, newStatus) => {
    const action = newStatus === 'Activo' ? 'activar' : 'desactivar'
    if (window.confirm(`¿Estás seguro de que quieres ${action} a ${employee.nombre_empleado || employee.nombre} ${employee.apellido_empleado || employee.apellido}?`)) {
      try {
        const employeeId = employee.id_empleado || employee.id
        const result = await updateEmployeeStatus(employeeId.toString(), newStatus)
        
        if (result.success) {
          alert(`Estado del empleado actualizado a ${newStatus}`)
          await loadEmployees()
        } else {
          throw new Error(result.message || 'Error al cambiar el estado del empleado')
        }
      } catch (error) {
        console.error('Error updating employee status:', error)
        alert('Error al cambiar estado: ' + error.message)
      }
    }
  }

  const resetForm = () => {
    setFormData({
      nombre_empleado: '',
      apellido_empleado: '',
      correo_empleado: '',
      telefono_empleado: '',
      cargo_empleado: 'Recepcionista',
      fecha_contratacion: new Date().toISOString().split('T')[0],
      contraseña: ''
    })
    setEditingEmployee(null)
    setFormErrors({})
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'No especificada'
    try {
      return new Date(dateString).toLocaleDateString('es-CO')
    } catch {
      return 'Fecha inválida'
    }
  }

  const getPositionColor = (position) => {
    const colors = {
      'Recepcionista': 'bg-blue-100 text-blue-800',
      'Administrador': 'bg-purple-100 text-purple-800',
      'Limpieza': 'bg-green-100 text-green-800'
    }
    return colors[position] || 'bg-gray-100 text-gray-800'
  }

  const getStatusColor = (status) => {
    return status === 'Activo' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
  }

  const positions = ['Recepcionista', 'Administrador', 'Limpieza']

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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Empleados</h1>
          <p className="text-gray-600 mt-2">
            Administra los empleados del hotel ({employees.length} registrados)
          </p>
        </div>
        <button
          onClick={() => {
            resetForm()
            setShowModal(true)
          }}
          className="flex items-center px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors duration-200"
        >
          <UserPlus className="h-5 w-5 mr-2" />
          Nuevo Empleado
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Buscar empleados..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <select
              value={positionFilter}
              onChange={(e) => setPositionFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent appearance-none"
            >
              <option value="all">Todos los cargos</option>
              {positions.map(position => (
                <option key={position} value={position}>
                  {position}
                </option>
              ))}
            </select>
          </div>

          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent appearance-none"
            >
              <option value="all">Todos los estados</option>
              <option value="Activo">Activos</option>
              <option value="Inactivo">Inactivos</option>
            </select>
          </div>
        </div>
      </div>

      {/* Employees Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredEmployees.map((employee) => {
          const nombre = employee.nombre_empleado || employee.nombre || ''
          const apellido = employee.apellido_empleado || employee.apellido || ''
          const email = employee.correo_empleado || employee.email || ''
          const telefono = employee.telefono_empleado || employee.telefono || ''
          const cargo = employee.cargo_empleado || employee.cargo || ''
          const estado = employee.estado_usuario || employee.estado || employee.status || 'Activo'
          const fechaContratacion = employee.fecha_contratacion || employee.hire_date || ''
          const employeeId = employee.id_empleado || employee.id

          return (
            <div key={employeeId} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center space-x-4 mb-4">
                <div className="bg-primary-100 text-primary-600 p-3 rounded-lg">
                  <Users className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {nombre} {apellido}
                  </h3>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPositionColor(cargo)}`}>
                      <Briefcase className="h-3 w-3 mr-1" />
                      {cargo}
                    </span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(estado)}`}>
                      {estado === 'Activo' ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center text-sm text-gray-600">
                  <Mail className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span className="truncate">{email}</span>
                </div>

                {telefono && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Phone className="h-4 w-4 mr-2 flex-shrink-0" />
                    <span>{telefono}</span>
                  </div>
                )}

                <div className="flex items-center text-sm text-gray-600">
                  <Calendar className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span>Contratado: {formatDate(fechaContratacion)}</span>
                </div>
              </div>

              <div className="mt-6 flex space-x-2">
                <button
                  onClick={() => handleEdit(employee)}
                  className="flex-1 flex items-center justify-center px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors duration-200"
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Editar
                </button>
                
                {estado === 'Activo' ? (
                  <button
                    onClick={() => handleStatusChange(employee, 'Inactivo')}
                    className="flex-1 flex items-center justify-center px-3 py-2 bg-yellow-500 hover:bg-yellow-600 text-white text-sm font-medium rounded-lg transition-colors duration-200"
                  >
                    <UserX className="h-4 w-4 mr-1" />
                    Desactivar
                  </button>
                ) : (
                  <button
                    onClick={() => handleStatusChange(employee, 'Activo')}
                    className="flex-1 flex items-center justify-center px-3 py-2 bg-green-500 hover:bg-green-600 text-white text-sm font-medium rounded-lg transition-colors duration-200"
                  >
                    <UserCheck className="h-4 w-4 mr-1" />
                    Activar
                  </button>
                )}
                
                <button
                  onClick={() => handleDelete(employeeId)}
                  className="px-3 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-lg transition-colors duration-200"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {filteredEmployees.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-200">
          <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm || positionFilter !== 'all' || statusFilter !== 'all'
              ? 'No se encontraron empleados' 
              : 'No hay empleados registrados'
            }
          </h3>
          <p className="text-gray-600 mb-4">
            {searchTerm || positionFilter !== 'all' || statusFilter !== 'all'
              ? 'Intenta cambiar los filtros de búsqueda.' 
              : 'Haz clic en "Nuevo Empleado" para agregar el primero.'
            }
          </p>
          {!searchTerm && positionFilter === 'all' && statusFilter === 'all' && (
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors duration-200 mx-auto"
            >
              <UserPlus className="h-5 w-5 mr-2" />
              Nuevo Empleado
            </button>
          )}
        </div>
      )}

      {/* Modal para crear/editar empleado */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                {editingEmployee ? 'Editar Empleado' : 'Nuevo Empleado'}
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.nombre_empleado}
                      onChange={(e) => {
                        setFormData({...formData, nombre_empleado: e.target.value})
                        setFormErrors({...formErrors, nombre_empleado: ''})
                      }}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                        formErrors.nombre_empleado ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {formErrors.nombre_empleado && (
                      <p className="mt-1 text-sm text-red-600">{formErrors.nombre_empleado}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Apellido *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.apellido_empleado}
                      onChange={(e) => {
                        setFormData({...formData, apellido_empleado: e.target.value})
                        setFormErrors({...formErrors, apellido_empleado: ''})
                      }}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                        formErrors.apellido_empleado ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {formErrors.apellido_empleado && (
                      <p className="mt-1 text-sm text-red-600">{formErrors.apellido_empleado}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Correo Electrónico *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.correo_empleado}
                    onChange={(e) => {
                      setFormData({...formData, correo_empleado: e.target.value})
                      setFormErrors({...formErrors, correo_empleado: ''})
                    }}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                      formErrors.correo_empleado ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {formErrors.correo_empleado && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.correo_empleado}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    value={formData.telefono_empleado}
                    onChange={(e) => setFormData({...formData, telefono_empleado: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Ej: 3001234567"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cargo *
                  </label>
                  <select
                    required
                    value={formData.cargo_empleado}
                    onChange={(e) => {
                      setFormData({...formData, cargo_empleado: e.target.value})
                      setFormErrors({...formErrors, cargo_empleado: ''})
                    }}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                      formErrors.cargo_empleado ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    {positions.map(position => (
                      <option key={position} value={position}>
                        {position}
                      </option>
                    ))}
                  </select>
                  {formErrors.cargo_empleado && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.cargo_empleado}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha de Contratación
                  </label>
                  <input
                    type="date"
                    value={formData.fecha_contratacion}
                    onChange={(e) => setFormData({...formData, fecha_contratacion: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                {!editingEmployee && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Contraseña (opcional)
                    </label>
                    <input
                      type="password"
                      placeholder="Dejar vacío para contraseña por defecto (1234)"
                      value={formData.contraseña}
                      onChange={(e) => setFormData({...formData, contraseña: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                    <p className="mt-1 text-sm text-gray-500">
                      La contraseña se truncará a 4 caracteres máximo
                    </p>
                  </div>
                )}

                <div className="flex space-x-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-primary-500 hover:bg-primary-600 text-white py-2 px-4 rounded-lg transition-colors duration-200"
                  >
                    {editingEmployee ? 'Actualizar' : 'Crear'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false)
                      resetForm()
                    }}
                    className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded-lg transition-colors duration-200"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default EmployeesManagement