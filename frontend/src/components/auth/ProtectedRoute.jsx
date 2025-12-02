import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, isAuthenticated, getUserRole, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  if (!isAuthenticated()) {
    // Redirigir al login guardando la ubicación actual
    return <Navigate to="/auth/login" state={{ from: location }} replace />
  }

  // Verificar roles si se especifican
  if (allowedRoles.length > 0) {
    const userRole = getUserRole()
    
    console.log('🔍 ProtectedRoute - Verificación de rol:', {
      userRole,
      allowedRoles,
      userData: user,
      usuario_acceso: user?.usuario_acceso,
      role: user?.role,
      cargo_empleado: user?.cargo_empleado
    })
    
    if (!allowedRoles.includes(userRole)) {
      // Redirigir según el tipo de usuario
      if (userRole === 'Empleado') {
        console.log('⛔ Usuario no tiene acceso, redirigiendo a /admin')
        return <Navigate to="/admin" replace />
      } else {
        console.log('⛔ Usuario no tiene acceso, redirigiendo a /cliente')
        return <Navigate to="/cliente" replace />
      }
    }
  }

  return children
}

export default ProtectedRoute