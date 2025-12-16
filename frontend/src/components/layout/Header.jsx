import React, { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Menu, X, User, LogOut, Settings } from 'lucide-react'

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const { user, logout, isAuthenticated, isAdmin } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
    setIsUserMenuOpen(false)
  }

  const navigation = [
    { name: 'Inicio', href: '/' },
    { name: 'Habitaciones', href: '/habitaciones' },
    { name: 'Servicios', href: '/servicios' },
    { name: 'Contacto', href: '/contacto' },
    { name: 'Reservar', href: '/reservar' },
  ]

  const isActive = (path) => location.pathname === path

  // Función MEJORADA para obtener el nombre del usuario
  const getUserDisplayName = () => {
    console.log('🔍 User en Header:', user) // Para depuración
    
    if (!user || Object.keys(user).length === 0) {
      return 'Usuario'
    }
    
    // 1. Buscar nombre completo de cliente
    if (user.nombre_cliente && user.apellido_cliente) {
      return `${user.nombre_cliente} ${user.apellido_cliente}`
    }
    
    // 2. Buscar solo nombre de cliente
    if (user.nombre_cliente) {
      return user.nombre_cliente
    }
    
    // 3. Buscar nombre completo de empleado
    if (user.nombre_empleado && user.apellido_empleado) {
      return `${user.nombre_empleado} ${user.apellido_empleado}`
    }
    
    // 4. Buscar solo nombre de empleado
    if (user.nombre_empleado) {
      return user.nombre_empleado
    }
    
    // 5. Buscar campo "nombre" general
    if (user.nombre) {
      return user.nombre
    }
    
    // 6. EXTRAER del correo (GARANTIZADO)
    if (user.correo_usuario) {
      const nombreDelCorreo = user.correo_usuario.split('@')[0]
      return nombreDelCorreo.charAt(0).toUpperCase() + nombreDelCorreo.slice(1)
    }
    
    if (user.email) {
      const nombreDelCorreo = user.email.split('@')[0]
      return nombreDelCorreo.charAt(0).toUpperCase() + nombreDelCorreo.slice(1)
    }
    
    if (user.correo_cliente) {
      const nombreDelCorreo = user.correo_cliente.split('@')[0]
      return nombreDelCorreo.charAt(0).toUpperCase() + nombreDelCorreo.slice(1)
    }
    
    if (user.correo_empleado) {
      const nombreDelCorreo = user.correo_empleado.split('@')[0]
      return nombreDelCorreo.charAt(0).toUpperCase() + nombreDelCorreo.slice(1)
    }
    
    // 7. Si no hay nada
    return 'Usuario'
  }

  // Función para obtener el correo
  const getUserEmail = () => {
    if (!user) return ''
    
    return user.correo_usuario || user.email || user.correo_cliente || user.correo_empleado || ''
  }

  return (
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
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`
                  px-3 py-2 
                  rounded-md 
                  text-sm 
                  font-medium 
                  transition-all 
                  duration-300 
                  ease-in-out
                  ${isActive(item.href)
                    ? 'text-primary-600 bg-primary-50 font-semibold'
                    : 'text-gray-700 hover:text-white hover:bg-primary-500'
                  }
                `}
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
                    {getUserDisplayName()}
                  </span>
                </button>

                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900">
                        {getUserDisplayName()}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {getUserEmail()}
                      </p>
                    </div>
                    
                    {isAdmin() ? (
                      <Link
                        to="/admin"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-primary-600"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        <Settings className="h-4 w-4 mr-2" />
                        Panel Admin
                      </Link>
                    ) : (
                      <Link
                        to="/cliente"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-primary-600"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        <User className="h-4 w-4 mr-2" />
                        Mi Cuenta
                      </Link>
                    )}
                    
                    <button
                      onClick={handleLogout}
                      className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 hover:text-red-700"
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
                  className="text-gray-700 hover:text-primary-600 hover:bg-gray-100 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200"
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
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 rounded-md text-gray-700 hover:text-primary-600 hover:bg-gray-100 transition-colors duration-200"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-2">
            <div className="flex flex-col space-y-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`
                    px-3 py-2 
                    rounded-md 
                    text-base 
                    font-medium 
                    transition-all 
                    duration-300 
                    ease-in-out
                    ${isActive(item.href)
                      ? 'text-primary-600 bg-primary-50 font-semibold'
                      : 'text-gray-700 hover:text-white hover:bg-primary-500'
                    }
                  `}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
              
              {!isAuthenticated() && (
                <>
                  <Link
                    to="/auth/login"
                    className="px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-100 transition-colors duration-200"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Iniciar Sesión
                  </Link>
                  <Link
                    to="/auth/register"
                    className="px-3 py-2 rounded-md text-base font-medium text-white bg-primary-500 hover:bg-primary-600 transition-colors duration-200"
                    onClick={() => setIsMenuOpen(false)}
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
}

export default Header