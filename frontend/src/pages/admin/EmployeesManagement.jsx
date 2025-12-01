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

  useEffect(() => {
    loadEmployees()
  }, [])

  const loadEmployees = async () => {
    try {
      const employeesData = await getEmployees()
      setEmployees(employeesData)
    } catch (error) {
      console.error('Error loading employees:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredEmployees = employees.filter(employee =>
    (employee.nombre_empleado.toLowerCase().includes(searchTerm.toLowerCase()) ||
     employee.apellido_empleado.toLowerCase().includes(searchTerm.toLowerCase()) ||
     employee.correo_empleado.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (positionFilter === 'all' || employee.cargo_empleado === positionFilter) &&
    (statusFilter === 'all' || employee.estado_usuario === statusFilter)
  )

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingEmployee) {
        await updateEmployee(editingEmployee.id_empleado, formData)
      } else {
        await createEmployee(formData)
      }
      await loadEmployees()
      setShowModal(false)
      resetForm()
    } catch (error) {
      console.error('Error saving employee:', error)
    }
  }

  const handleEdit = (employee) => {
    setEditingEmployee(employee)
    setFormData({
      nombre_empleado: employee.nombre_empleado,
      apellido_empleado: employee.apellido_empleado,
      correo_empleado: employee.correo_empleado,
      telefono_empleado: employee.telefono_empleado || '',
      cargo_empleado: employee.cargo_empleado,
      fecha_contratacion: employee.fecha_contratacion,
      contraseña: ''
    })
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este empleado?')) {
      try {
        await deleteEmployee(id)
        await loadEmployees()
      } catch (error) {
        console.error('Error deleting employee:', error)
      }
    }
  }

  const handleStatusChange = async (id, newStatus) => {
    try {
      await updateEmployeeStatus(id, newStatus)
      await loadEmployees()
    } catch (error) {
      console.error('Error updating employee status:', error)
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
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-CO')
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
            Administra los empleados del hotel
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
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
        {filteredEmployees.map((employee) => (
          <div key={employee.id_empleado} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-4 mb-4">
              <div className="bg-primary-100 text-primary-600 p-3 rounded-lg">
                <Users className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900">
                  {employee.nombre_empleado} {employee.apellido_empleado}
                </h3>
                <div className="flex flex-wrap gap-2 mt-2">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPositionColor(employee.cargo_empleado)}`}>
                    <Briefcase className="h-3 w-3 mr-1" />
                    {employee.cargo_empleado}
                  </span>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(employee.estado_usuario)}`}>
                    {employee.estado_usuario}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center text-sm text-gray-600">
                <Mail className="h-4 w-4 mr-2" />
                <span className="truncate">{employee.correo_empleado}</span>
              </div>

              {employee.telefono_empleado && (
                <div className="flex items-center text-sm text-gray-600">
                  <Phone className="h-4 w-4 mr-2" />
                  <span>{employee.telefono_empleado}</span>
                </div>
              )}

              <div className="flex items-center text-sm text-gray-600">
                <Calendar className="h-4 w-4 mr-2" />
                <span>Contratado: {formatDate(employee.fecha_contratacion)}</span>
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
              
              {employee.estado_usuario === 'Activo' ? (
                <button
                  onClick={() => handleStatusChange(employee.id_empleado, 'Inactivo')}
                  className="flex-1 flex items-center justify-center px-3 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-lg transition-colors duration-200"
                >
                  <UserX className="h-4 w-4 mr-1" />
                  Desactivar
                </button>
              ) : (
                <button
                  onClick={() => handleStatusChange(employee.id_empleado, 'Activo')}
                  className="flex-1 flex items-center justify-center px-3 py-2 bg-green-500 hover:bg-green-600 text-white text-sm font-medium rounded-lg transition-colors duration-200"
                >
                  <UserCheck className="h-4 w-4 mr-1" />
                  Activar
                </button>
              )}
              
              <button
                onClick={() => handleDelete(employee.id_empleado)}
                className="px-3 py-2 bg-gray-500 hover:bg-gray-600 text-white text-sm font-medium rounded-lg transition-colors duration-200"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredEmployees.length === 0 && (
        <div className="text-center py-12">
          <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No hay empleados
          </h3>
          <p className="text-gray-600">
            {searchTerm || positionFilter !== 'all' || statusFilter !== 'all'
              ? 'No se encontraron empleados que coincidan con tu búsqueda.' 
              : 'No hay empleados registrados en el sistema.'
            }
          </p>
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
                      onChange={(e) => setFormData({...formData, nombre_empleado: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Apellido *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.apellido_empleado}
                      onChange={(e) => setFormData({...formData, apellido_empleado: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
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
                    onChange={(e) => setFormData({...formData, correo_empleado: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
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
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cargo *
                  </label>
                  <select
                    required
                    value={formData.cargo_empleado}
                    onChange={(e) => setFormData({...formData, cargo_empleado: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    {positions.map(position => (
                      <option key={position} value={position}>
                        {position}
                      </option>
                    ))}
                  </select>
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