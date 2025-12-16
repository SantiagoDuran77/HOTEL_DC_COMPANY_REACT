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
      const token = localStorage.getItem('accessToken')
      
      console.log('🔄 AuthContext - Verificando autenticación:', { 
        tieneUser: !!userData, 
        tieneToken: !!token 
      })
      
      if (userData && token) {
        try {
          const parsedUser = JSON.parse(userData)
          // Validar que el usuario tenga los campos mínimos
          if (parsedUser && (parsedUser.correo_usuario || parsedUser.email)) {
            console.log('✅ AuthContext - Usuario cargado:', parsedUser)
            setUser(parsedUser)
          } else {
            console.log('⚠️  AuthContext - Datos de usuario inválidos')
            localStorage.removeItem('user')
            localStorage.removeItem('accessToken')
            setUser(null)
          }
        } catch (parseError) {
          console.error('❌ Error parsing user data:', parseError)
          localStorage.removeItem('user')
          localStorage.removeItem('accessToken')
          setUser(null)
        }
      } else {
        console.log('🔓 AuthContext - No hay usuario autenticado')
        setUser(null)
      }
    } catch (error) {
      console.error('❌ Error checking auth:', error)
      setUser(null)
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
    console.log('👋 AuthContext - Logout')
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('user')
    setUser(null)
    window.location.href = '/auth/login'
  }

  // 🆕 NUEVA FUNCIÓN: Actualizar datos del usuario
  const updateUser = (updatedData) => {
    console.log('🔄 AuthContext - Actualizando datos del usuario:', updatedData)
    
    if (!user) {
      console.log('⚠️  No hay usuario para actualizar')
      return
    }
    
    try {
      // 1. Combinar datos existentes con los nuevos
      const updatedUser = { ...user, ...updatedData }
      
      // 2. Actualizar estado local
      setUser(updatedUser)
      
      // 3. Actualizar localStorage para persistencia
      localStorage.setItem('user', JSON.stringify(updatedUser))
      
      console.log('✅ AuthContext - Usuario actualizado:', updatedUser)
      return updatedUser
    } catch (error) {
      console.error('❌ Error al actualizar usuario:', error)
      throw error
    }
  }

  // Función que verifica autenticación CORREGIDA
  const isAuthenticated = () => {
    const token = localStorage.getItem('accessToken')
    const userData = localStorage.getItem('user')
    
    // Verificar que ambos existan y sean válidos
    if (!token || !userData) {
      console.log('🔐 isAuthenticated: false - Falta token o user data')
      return false
    }
    
    try {
      const parsedUser = JSON.parse(userData)
      const isValid = !!token && !!parsedUser && (parsedUser.correo_usuario || parsedUser.email)
      console.log('🔐 isAuthenticated:', isValid, { 
        tokenExists: !!token,
        userValid: !!parsedUser,
        emailExists: !!(parsedUser.correo_usuario || parsedUser.email)
      })
      return isValid
    } catch (error) {
      console.error('❌ Error parsing user in isAuthenticated:', error)
      return false
    }
  }

  // Función que verifica si es ADMIN/EMPLEADO
  const isAdmin = () => {
    if (!isAuthenticated()) {
      console.log('❌ No está autenticado, no puede ser admin')
      return false
    }
    
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
    if (!isAuthenticated()) {
      console.log('🔍 getUserRole: No autenticado')
      return null
    }
    
    const currentUser = user || JSON.parse(localStorage.getItem('user') || 'null')
    
    if (!currentUser) {
      console.log('🔍 getUserRole: No hay usuario')
      return null
    }
    
    // Verificar si es admin/empleado
    if (isAdmin()) {
      console.log('🔍 getUserRole: Es Empleado (Admin)')
      return 'Empleado' // En tu sistema, "Empleado" equivale a "Admin"
    }
    
    console.log('🔍 getUserRole: Es Cliente')
    return 'Cliente'
  }

  // 🔧 Valor del contexto - AÑADIR updateUser aquí
  const value = {
    user,
    loading,
    login,
    logout,
    isAuthenticated,
    isAdmin,
    getUserRole,
    checkAuth,
    updateUser
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}