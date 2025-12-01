import React, { useState } from 'react'
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { 
  LayoutDashboard, 
  Calendar, 
  User, 
  Menu, 
  X, 
  LogOut,
  CreditCard
} from 'lucide-react'

const ClientLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const navigation = [
    { name: 'Mi Panel', href: '/cliente', icon: LayoutDashboard },
    { name: 'Mis Reservas', href: '/cliente/reservas', icon: Calendar },
    { name: 'Mi Perfil', href: '/cliente/perfil', icon: User },
  ]

  const isActive = (path) => location.pathname === path

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar para desktop */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <div className="flex flex-col w-64">
          <div className="flex flex-col flex-grow bg-white border-r border-gray-200 pt-5 pb-4 overflow-y-auto">
            {/* Logo y bienvenida */}
            <div className="flex items-center flex-shrink-0 px-4">
              <div className="flex items-center space-x-3">
                <div className="bg-primary-500 text-white p-2 rounded-lg">
                  <User className="h-6 w-6" />
                </div>
                <div>
                  <div className="font-bold text-lg text-gray-900">MI CUENTA</div>
                  <div className="text-xs text-gray-500">Panel del Cliente</div>
                </div>
              </div>
            </div>

            {/* Información del usuario */}
            <div className="mt-6 px-4">
              <div className="bg-primary-50 rounded-lg p-4">
                <p className="text-sm font-medium text-primary-900">
                  Hola, {user?.nombre_cliente || 'Cliente'}
                </p>
                <p className="text-xs text-primary-600 mt-1">
                  {user?.correo_cliente}
                </p>
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

            {/* Acciones rápidas */}
            <div className="flex-shrink-0 border-t border-gray-200 p-4">
              <Link
                to="/habitaciones"
                className="w-full flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-secondary-500 hover:bg-secondary-600 transition-colors duration-200"
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Nueva Reserva
              </Link>
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center px-4 py-2 mt-3 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors duration-200"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Cerrar Sesión
              </button>
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
                      <User className="h-6 w-6" />
                    </div>
                    <div>
                      <div className="font-bold text-lg text-gray-900">MI CUENTA</div>
                      <div className="text-xs text-gray-500">Panel del Cliente</div>
                    </div>
                  </div>
                </div>
                <div className="mt-6 px-4">
                  <div className="bg-primary-50 rounded-lg p-4">
                    <p className="text-sm font-medium text-primary-900">
                      Hola, {user?.nombre_cliente || 'Cliente'}
                    </p>
                    <p className="text-xs text-primary-600 mt-1">
                      {user?.correo_cliente}
                    </p>
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
              <div className="flex-shrink-0 border-t border-gray-200 p-4">
                <Link
                  to="/habitaciones"
                  className="w-full flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-secondary-500 hover:bg-secondary-600 transition-colors duration-200"
                  onClick={() => setSidebarOpen(false)}
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  Nueva Reserva
                </Link>
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
      </div>
    </div>
  )
}

export default ClientLayout