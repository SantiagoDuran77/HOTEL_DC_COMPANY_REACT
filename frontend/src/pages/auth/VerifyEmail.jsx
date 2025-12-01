import React, { useState, useEffect } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { CheckCircle, XCircle, Hotel, Loader } from 'lucide-react'

const VerifyEmail = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [success, setSuccess] = useState(false)
  const [message, setMessage] = useState('')

  const token = searchParams.get('token')

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token) {
        setLoading(false)
        setSuccess(false)
        setMessage('Token de verificación no proporcionado')
        return
      }

      try {
        console.log('🔐 Verificando email con token:', token)
        
        const response = await fetch(`http://localhost:5000/api/auth/verify-email?token=${token}`)
        const data = await response.json()

        if (response.ok) {
          setSuccess(true)
          setMessage(data.message || 'Email verificado exitosamente')
        } else {
          setSuccess(false)
          setMessage(data.error || 'Error al verificar el email')
        }
      } catch (error) {
        console.error('❌ Email verification error:', error)
        setSuccess(false)
        setMessage('Error de conexión al verificar el email')
      } finally {
        setLoading(false)
      }
    }

    verifyEmail()
  }, [token])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="flex justify-center">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-500 text-white p-3 rounded-xl">
                <Hotel className="h-8 w-8" />
              </div>
              <div className="text-gray-900">
                <div className="font-bold text-2xl leading-6">DC</div>
                <div className="text-sm font-medium text-gray-500">COMPANY</div>
              </div>
            </div>
          </div>
          <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
            Verificando Email
          </h2>
          <div className="mt-8 text-center">
            <Loader className="h-12 w-12 text-blue-600 mx-auto animate-spin" />
            <p className="mt-4 text-gray-600">Verificando tu dirección de email...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="flex items-center space-x-3">
            <div className={`${success ? 'bg-green-500' : 'bg-red-500'} text-white p-3 rounded-xl`}>
              {success ? <CheckCircle className="h-8 w-8" /> : <XCircle className="h-8 w-8" />}
            </div>
            <div className="text-gray-900">
              <div className="font-bold text-2xl leading-6">DC</div>
              <div className="text-sm font-medium text-gray-500">COMPANY</div>
            </div>
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
          {success ? '¡Email Verificado!' : 'Error de Verificación'}
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 text-center">
          <div className={`${success ? 'bg-green-50 border-green-200 text-green-600' : 'bg-red-50 border-red-200 text-red-600'} border px-4 py-3 rounded-md text-sm mb-6`}>
            {message}
          </div>

          {success ? (
            <div className="space-y-4">
              <p className="text-gray-600">
                Tu cuenta ha sido activada exitosamente. Ahora puedes iniciar sesión y disfrutar de todos nuestros servicios.
              </p>
              <Link
                to="/auth/login"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors duration-200"
              >
                Iniciar Sesión
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-gray-600">
                El enlace de verificación es inválido o ha expirado.
              </p>
              <div className="space-y-2">
                <Link
                  to="/auth/register"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors duration-200 mr-2"
                >
                  Registrarse Nuevamente
                </Link>
                <Link
                  to="/auth/login"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors duration-200"
                >
                  Iniciar Sesión
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default VerifyEmail