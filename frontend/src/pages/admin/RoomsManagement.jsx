import React, { useState, useEffect } from 'react'
import { getRooms, createRoom, updateRoom, deleteRoom } from '../../services/api'
import { Plus, Edit, Trash2, Bed, Search } from 'lucide-react'
import Modal from '../../components/ui/Modal'
import Button from '../../components/ui/Button'

const RoomsManagement = () => {
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingRoom, setEditingRoom] = useState(null)
  const [formData, setFormData] = useState({
    numero_habitacion: '',
    tipo_habitacion: 'Sencilla',
    precio: '',
    estado_habitacion: 'Disponible',
    descripcion: '',
    capacidad: '',
    servicios_incluidos: ''
  })
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(5) // Cambiado de 10 a 5

  useEffect(() => {
    loadRooms()
  }, [])

  const loadRooms = async () => {
    try {
      const roomsData = await getRooms()
      setRooms(roomsData)
    } catch (error) {
      console.error('Error loading rooms:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredRooms = rooms.filter(room =>
    room.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    room.tipo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    room.estado.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Lógica de paginación
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentRooms = filteredRooms.slice(indexOfFirstItem, indexOfLastItem)
  const totalPages = Math.ceil(filteredRooms.length / itemsPerPage)

  const paginate = (pageNumber) => setCurrentPage(pageNumber)
  const nextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1)
  }
  const prevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1)
  }

  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm])

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const roomData = {
        ...formData,
        precio: parseFloat(formData.precio),
        capacidad: parseInt(formData.capacidad)
      }

      if (editingRoom) {
        await updateRoom(editingRoom.id, roomData)
      } else {
        await createRoom(roomData)
      }

      await loadRooms()
      resetForm()
      setIsModalOpen(false)
    } catch (error) {
      console.error('Error saving room:', error)
    }
  }

  const handleEdit = (room) => {
    setEditingRoom(room)
    setFormData({
      numero_habitacion: room.number,
      tipo_habitacion: room.tipo,
      precio: room.precio.toString(),
      estado_habitacion: room.estado,
      descripcion: room.descripcion || '',
      capacidad: room.capacidad?.toString() || '2',
      servicios_incluidos: room.servicios_incluidos || ''
    })
    setIsModalOpen(true)
  }

  const handleDelete = async (roomId) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta habitación?')) {
      try {
        await deleteRoom(roomId)
        await loadRooms()
      } catch (error) {
        console.error('Error deleting room:', error)
      }
    }
  }

  const resetForm = () => {
    setFormData({
      numero_habitacion: '',
      tipo_habitacion: 'Sencilla',
      precio: '',
      estado_habitacion: 'Disponible',
      descripcion: '',
      capacidad: '',
      servicios_incluidos: ''
    })
    setEditingRoom(null)
  }

  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(price)
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'Disponible': return 'bg-green-100 text-green-800'
      case 'Ocupada': return 'bg-red-100 text-red-800'
      case 'Mantenimiento': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Habitaciones</h1>
          <p className="text-gray-600 mt-2">
            Administra las habitaciones del hotel
          </p>
        </div>
        <Button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nueva Habitación
        </Button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Buscar habitaciones..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Rooms Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Habitación
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Precio
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Capacidad
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentRooms.map((room) => (
                <tr key={room.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="bg-primary-100 text-primary-600 p-2 rounded-lg mr-3">
                        <Bed className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {room.number}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900 capitalize">{room.tipo}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-medium text-gray-900">
                      {formatPrice(room.precio)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(room.estado)}`}>
                      {room.estado}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">{room.capacidad} personas</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleEdit(room)}
                        className="text-primary-600 hover:text-primary-900 transition-colors duration-200"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(room.id)}
                        className="text-red-600 hover:text-red-900 transition-colors duration-200"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Componente de paginación */}
        {filteredRooms.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 bg-gray-50 border-t border-gray-200">
            <div className="mb-4 sm:mb-0">
              <p className="text-sm text-gray-700">
                Mostrando <span className="font-medium">{indexOfFirstItem + 1}</span> a{' '}
                <span className="font-medium">
                  {Math.min(indexOfLastItem, filteredRooms.length)}
                </span>{' '}
                de <span className="font-medium">{filteredRooms.length}</span> resultados
              </p>
            </div>
            
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1">
                <label htmlFor="itemsPerPage" className="text-sm text-gray-700 mr-2">
                  Mostrar:
                </label>
                <select
                  id="itemsPerPage"
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value))
                    setCurrentPage(1)
                  }}
                  className="text-sm border-gray-300 rounded focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="5">5</option>
                  <option value="10">10</option>
                  <option value="20">20</option>
                  <option value="50">50</option>
                </select>
              </div>
              
              <nav className="flex items-center space-x-2">
                <button
                  onClick={prevPage}
                  disabled={currentPage === 1}
                  className={`px-3 py-1 text-sm rounded-md ${
                    currentPage === 1
                      ? 'text-gray-400 cursor-not-allowed'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Anterior
                </button>
                
                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNumber
                    if (totalPages <= 5) {
                      pageNumber = i + 1
                    } else if (currentPage <= 3) {
                      pageNumber = i + 1
                    } else if (currentPage >= totalPages - 2) {
                      pageNumber = totalPages - 4 + i
                    } else {
                      pageNumber = currentPage - 2 + i
                    }
                    
                    return (
                      <button
                        key={pageNumber}
                        onClick={() => paginate(pageNumber)}
                        className={`px-3 py-1 text-sm rounded-md ${
                          currentPage === pageNumber
                            ? 'bg-primary-500 text-white'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        {pageNumber}
                      </button>
                    )
                  })}
                </div>
                
                <button
                  onClick={nextPage}
                  disabled={currentPage === totalPages}
                  className={`px-3 py-1 text-sm rounded-md ${
                    currentPage === totalPages
                      ? 'text-gray-400 cursor-not-allowed'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Siguiente
                </button>
              </nav>
            </div>
          </div>
        )}

        {filteredRooms.length === 0 && (
          <div className="text-center py-12">
            <Bed className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No hay habitaciones
            </h3>
            <p className="text-gray-600">
              {searchTerm ? 'No se encontraron habitaciones que coincidan con tu búsqueda.' : 'Comienza agregando una nueva habitación.'}
            </p>
          </div>
        )}
      </div>

      {/* Add/Edit Room Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          resetForm()
        }}
        title={editingRoom ? 'Editar Habitación' : 'Nueva Habitación'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Número de Habitación
              </label>
              <input
                type="text"
                required
                value={formData.numero_habitacion}
                onChange={(e) => setFormData({ ...formData, numero_habitacion: e.target.value })}
                className="mt-1 input-field"
                placeholder="Ej: 101"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Tipo de Habitación
              </label>
              <select
                required
                value={formData.tipo_habitacion}
                onChange={(e) => setFormData({ ...formData, tipo_habitacion: e.target.value })}
                className="mt-1 input-field"
              >
                <option value="Sencilla">Sencilla</option>
                <option value="Doble">Doble</option>
                <option value="Suite">Suite</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Precio por Noche
              </label>
              <input
                type="number"
                required
                min="0"
                step="1000"
                value={formData.precio}
                onChange={(e) => setFormData({ ...formData, precio: e.target.value })}
                className="mt-1 input-field"
                placeholder="Ej: 150000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Estado
              </label>
              <select
                required
                value={formData.estado_habitacion}
                onChange={(e) => setFormData({ ...formData, estado_habitacion: e.target.value })}
                className="mt-1 input-field"
              >
                <option value="Disponible">Disponible</option>
                <option value="Ocupada">Ocupada</option>
                <option value="Mantenimiento">Mantenimiento</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Capacidad
            </label>
            <input
              type="number"
              required
              min="1"
              max="10"
              value={formData.capacidad}
              onChange={(e) => setFormData({ ...formData, capacidad: e.target.value })}
              className="mt-1 input-field"
              placeholder="Número de personas"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Descripción
            </label>
            <textarea
              rows={3}
              value={formData.descripcion}
              onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              className="mt-1 input-field"
              placeholder="Descripción de la habitación..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Servicios Incluidos
            </label>
            <input
              type="text"
              value={formData.servicios_incluidos}
              onChange={(e) => setFormData({ ...formData, servicios_incluidos: e.target.value })}
              className="mt-1 input-field"
              placeholder="WiFi, TV, Aire acondicionado..."
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsModalOpen(false)
                resetForm()
              }}
            >
              Cancelar
            </Button>
            <Button type="submit">
              {editingRoom ? 'Actualizar' : 'Crear'} Habitación
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default RoomsManagement