import React, { useState } from 'react'
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { 
  LayoutDashboard, 
  Bed, 
  Calendar, 
  Users, 
  Settings, 
  Menu, 
  X, 
  LogOut,
  User,
  Building,
  Briefcase,
  DollarSign
} from 'lucide-react'

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const navigation = [
    { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { name: 'Habitaciones', href: '/admin/habitaciones', icon: Bed },
    { name: 'Reservas', href: '/admin/reservas', icon: Calendar },
    { name: 'Usuarios', href: '/admin/usuarios', icon: Users },
    { name: 'Empleados', href: '/admin/empleados', icon: Briefcase },
    { name: 'Servicios', href: '/admin/servicios', icon: DollarSign },
    { name: 'Configuración', href: '/admin/configuracion', icon: Settings },
  ]

  const isActive = (path) => location.pathname === path

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  // Función para obtener el nombre del usuario
  const getUserName = () => {
    if (!user) return 'Administrador'
    
    // Priorizar nombre_empleado si existe
    if (user.nombre_empleado) {
      return user.nombre_empleado
    }
    
    // Si no, usar nombre_cliente (para casos mixtos)
    if (user.nombre_cliente) {
      return user.nombre_cliente
    }
    
    // Si no hay nombre, usar email
    if (user.email) {
      return user.email.split('@')[0]
    }
    
    return 'Administrador'
  }

  // Función para obtener el cargo/rol del usuario
  const getUserRole = () => {
    if (!user) return 'Administrador'
    
    // Priorizar cargo_empleado si existe
    if (user.cargo_empleado) {
      return user.cargo_empleado
    }
    
    // Si no, usar role o usuario_acceso
    if (user.role) {
      return user.role.charAt(0).toUpperCase() + user.role.slice(1)
    }
    
    if (user.usuario_acceso) {
      return user.usuario_acceso
    }
    
    return 'Administrador'
  }

  // Función para obtener el email del usuario
  const getUserEmail = () => {
    if (!user) return ''
    
    // Priorizar correo_empleado si existe
    if (user.correo_empleado) {
      return user.correo_empleado
    }
    
    // Si no, usar correo_usuario
    if (user.correo_usuario) {
      return user.correo_usuario
    }
    
    // Si no, usar email
    if (user.email) {
      return user.email
    }
    
    return ''
  }

  console.log('🏢 AdminLayout - Datos del usuario:', user)

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar para desktop */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <div className="flex flex-col w-64">
          <div className="flex flex-col flex-grow bg-white border-r border-gray-200 pt-5 pb-4 overflow-y-auto">
            {/* Logo */}
            <div className="flex items-center flex-shrink-0 px-4">
              <div className="flex items-center space-x-3">
                <div className="bg-primary-500 text-white p-2 rounded-lg">
                  <Building className="h-6 w-6" />
                </div>
                <div>
                  <div className="font-bold text-lg text-gray-900">DC ADMIN</div>
                  <div className="text-xs text-gray-500">Panel de Control</div>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <div className="mt-8 flex-grow flex flex-col">
              <nav className="flex-1 px-4 space-y-2">
                {navigation.map((item) => {
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                        isActive(item.href)
                          ? 'bg-primary-50 text-primary-600 border-r-2 border-primary-600'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <Icon className={`flex-shrink-0 h-5 w-5 mr-3 ${
                        isActive(item.href) ? 'text-primary-600' : 'text-gray-400'
                      }`} />
                      {item.name}
                    </Link>
                  )
                })}
              </nav>
            </div>

            {/* User section */}
            <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
              <div className="flex items-center w-full">
                <div className="flex-shrink-0">
                  <div className="bg-primary-100 text-primary-600 h-10 w-10 rounded-full flex items-center justify-center">
                    <User className="h-5 w-5" />
                  </div>
                </div>
                <div className="ml-3 flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {getUserName()}
                  </p>
                  <p className="text-xs text-gray-500">
                    {getUserRole()}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {getUserEmail()}
                  </p>
                </div>
                <button
                  onClick={handleLogout}
                  className="ml-3 flex-shrink-0 text-gray-400 hover:text-gray-500"
                  title="Cerrar sesión"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile sidebar */}
      {sidebarOpen && (
        <div className="lg:hidden">
          <div className="fixed inset-0 flex z-40">
            <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
            <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
              <div className="absolute top-0 right-0 -mr-12 pt-2">
                <button
                  className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                  onClick={() => setSidebarOpen(false)}
                >
                  <X className="h-6 w-6 text-white" />
                </button>
              </div>
              <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
                <div className="flex-shrink-0 flex items-center px-4">
                  <div className="flex items-center space-x-3">
                    <div className="bg-primary-500 text-white p-2 rounded-lg">
                      <Building className="h-6 w-6" />
                    </div>
                    <div>
                      <div className="font-bold text-lg text-gray-900">DC ADMIN</div>
                      <div className="text-xs text-gray-500">Panel de Control</div>
                    </div>
                  </div>
                </div>
                <nav className="mt-8 px-4 space-y-2">
                  {navigation.map((item) => {
                    const Icon = item.icon
                    return (
                      <Link
                        key={item.name}
                        to={item.href}
                        className={`group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                          isActive(item.href)
                            ? 'bg-primary-50 text-primary-600 border-r-2 border-primary-600'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        }`}
                        onClick={() => setSidebarOpen(false)}
                      >
                        <Icon className={`flex-shrink-0 h-5 w-5 mr-3 ${
                          isActive(item.href) ? 'text-primary-600' : 'text-gray-400'
                        }`} />
                        {item.name}
                      </Link>
                    )
                  })}
                </nav>
              </div>
              <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
                <div className="flex items-center w-full">
                  <div className="flex-shrink-0">
                    <div className="bg-primary-100 text-primary-600 h-10 w-10 rounded-full flex items-center justify-center">
                      <User className="h-5 w-5" />
                    </div>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">
                      {getUserName()}
                    </p>
                    <p className="text-xs text-gray-500">
                      {getUserRole()}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {getUserEmail()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        {/* Top bar */}
        <div className="lg:hidden pl-1 pt-1 sm:pl-3 sm:pt-3">
          <button
            className="-ml-0.5 -mt-0.5 h-12 w-12 inline-flex items-center justify-center rounded-md text-gray-500 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>

        <main className="flex-1 relative z-0 overflow-y-auto focus:outline-none">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <Outlet />
            </div>
          </div>
        </main>

        {/* Footer del admin */}
        <footer className="bg-white border-t border-gray-200 py-4 px-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-gray-600">
              © {new Date().getFullYear()} Hotel DC Company. Todos los derechos reservados.
            </p>
            <p className="text-sm text-gray-500 mt-2 md:mt-0">
              Sistema de Gestión Hotelera v1.0
            </p>
          </div>
        </footer>
      </div>
    </div>
  )
}

export default AdminLayout