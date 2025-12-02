import React, { createContext, useState, useContext, useEffect } from 'react'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = () => {
    try {
      const userData = localStorage.getItem('user')
      if (userData) {
        const parsedUser = JSON.parse(userData)
        console.log('🔄 AuthContext - Usuario cargado:', parsedUser)
        setUser(parsedUser)
      }
    } catch (error) {
      console.error('Error checking auth:', error)
    } finally {
      setLoading(false)
    }
  }

  const login = (userData, token) => {
    console.log('✅ AuthContext - Login exitoso:', userData)
    localStorage.setItem('accessToken', token)
    localStorage.setItem('user', JSON.stringify(userData))
    setUser(userData)
  }

  const logout = () => {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('user')
    setUser(null)
    window.location.href = '/auth/login'
  }

  // Función que verifica autenticación
  const isAuthenticated = () => {
    const token = localStorage.getItem('accessToken')
    const userData = localStorage.getItem('user')
    const result = !!token && !!userData
    console.log('🔐 isAuthenticated:', result)
    return result
  }

  // Función que verifica si es ADMIN/EMPLEADO
  const isAdmin = () => {
    const currentUser = user || JSON.parse(localStorage.getItem('user') || 'null')
    
    if (!currentUser) {
      console.log('❌ No hay usuario para verificar admin')
      return false
    }
    
    console.log('👑 Verificando si es admin con datos:', currentUser)
    
    // Verificar si es admin/empleado de múltiples formas
    const usuarioAcceso = currentUser?.usuario_acceso?.toString() || ''
    const role = currentUser?.role?.toString() || ''
    
    const isEmployee = usuarioAcceso.toLowerCase() === 'empleado'
    const isRoleEmployee = role.toLowerCase() === 'empleado' || role.toLowerCase() === 'admin'
    
    const hasEmployeeFields = (
      (currentUser?.cargo_empleado && currentUser.cargo_empleado !== '' && currentUser.cargo_empleado !== null) ||
      (currentUser?.id_empleado && (currentUser.id_empleado > 0 || currentUser.id_empleado !== undefined)) ||
      (currentUser?.nombre_empleado && currentUser.nombre_empleado !== '' && currentUser.nombre_empleado !== null)
    )
    
    const result = isEmployee || isRoleEmployee || hasEmployeeFields
    console.log('👑 ¿Es admin/empleado?:', result, { 
      usuarioAcceso,
      role,
      isEmployee,
      isRoleEmployee,
      hasEmployeeFields,
      cargo_empleado: currentUser?.cargo_empleado,
      id_empleado: currentUser?.id_empleado,
      nombre_empleado: currentUser?.nombre_empleado
    })
    
    return result
  }

  // Función para obtener el rol del usuario
  const getUserRole = () => {
    const currentUser = user || JSON.parse(localStorage.getItem('user') || 'null')
    
    if (!currentUser) return null
    
    // Verificar si es admin/empleado
    if (isAdmin()) {
      return 'Empleado' // En tu sistema, "Empleado" equivale a "Admin"
    }
    
    return 'Cliente'
  }

  const value = {
    user,
    loading,
    login,
    logout,
    isAuthenticated,
    isAdmin,
    getUserRole,
    checkAuth
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}