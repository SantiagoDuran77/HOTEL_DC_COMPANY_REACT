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
  CreditCard,
  // Icons para el Header
  Settings
} from 'lucide-react'

const ClientLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const { user, logout, isAuthenticated, isAdmin } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const navigation = [
    { name: 'Mi Panel', href: '/cliente', icon: LayoutDashboard },
    { name: 'Mis Reservas', href: '/cliente/reservas', icon: Calendar },
    { name: 'Mi Perfil', href: '/cliente/perfil', icon: User },
  ]

  // Navegación del Header
  const headerNavigation = [
    { name: 'Inicio', href: '/' },
    { name: 'Habitaciones', href: '/habitaciones' },
    { name: 'Servicios', href: '/servicios' },
    { name: 'Contacto', href: '/contacto' },
    { name: 'Reservar', href: '/reservar' },
  ]

  const isActive = (path) => location.pathname === path
  const isHeaderActive = (path) => location.pathname === path

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  // Componente Header integrado
  const Header = () => (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <div className="bg-primary-500 text-white p-2 rounded-lg">
                <span className="font-bold text-lg">HOTEL</span>
              </div>
              <div className="text-gray-900">
                <div className="font-bold text-xl leading-5">DC</div>
                <div className="text-xs font-medium text-gray-500">COMPANY</div>
              </div>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8">
            {headerNavigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                  isHeaderActive(item.href)
                    ? 'text-primary-600 bg-primary-50'
                    : 'text-gray-700 hover:text-primary-600 hover:bg-gray-50'
                }`}
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            {isAuthenticated() ? (
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center space-x-2 bg-gray-50 hover:bg-gray-100 rounded-full px-3 py-2 transition-colors duration-200"
                >
                  <User className="h-5 w-5 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">
                    {user?.nombre_cliente || user?.nombre_empleado || 'Usuario'}
                  </span>
                </button>

                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900">
                        {user?.nombre_cliente || user?.nombre_empleado || 'Usuario'}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {user?.correo_cliente || user?.correo_empleado || user?.email || ''}
                      </p>
                    </div>
                    
                    <Link
                      to="/cliente"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      <User className="h-4 w-4 mr-2" />
                      Mi Cuenta
                    </Link>
                    
                    <button
                      onClick={() => {
                        handleLogout()
                        setIsUserMenuOpen(false)
                      }}
                      className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-50"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Cerrar Sesión
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  to="/auth/login"
                  className="text-gray-700 hover:text-primary-600 px-3 py-2 text-sm font-medium transition-colors duration-200"
                >
                  Iniciar Sesión
                </Link>
                <Link
                  to="/auth/register"
                  className="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
                >
                  Registrarse
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden md:hidden p-2 rounded-md text-gray-700 hover:text-primary-600 hover:bg-gray-100"
            >
              {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {sidebarOpen && (
          <div className="md:hidden border-t border-gray-200 py-2">
            <div className="flex flex-col space-y-1">
              {headerNavigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`px-3 py-2 rounded-md text-base font-medium ${
                    isHeaderActive(item.href)
                      ? 'text-primary-600 bg-primary-50'
                      : 'text-gray-700 hover:text-primary-600 hover:bg-gray-50'
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
              
              {!isAuthenticated() && (
                <>
                  <Link
                    to="/auth/login"
                    className="px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-50"
                    onClick={() => setSidebarOpen(false)}
                  >
                    Iniciar Sesión
                  </Link>
                  <Link
                    to="/auth/register"
                    className="px-3 py-2 rounded-md text-base font-medium text-primary-600 hover:bg-primary-50"
                    onClick={() => setSidebarOpen(false)}
                  >
                    Registrarse
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header/Navbar principal */}
      <Header />
      
      <div className="flex">
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
          <main className="flex-1 relative z-0 overflow-y-auto focus:outline-none">
            <div className="py-6">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <Outlet />
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}

export default ClientLayout