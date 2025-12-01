import React from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Star, Shield, Clock } from 'lucide-react'

const Home = () => {
  const features = [
    {
      icon: <Star className="h-8 w-8" />,
      title: 'Servicio Premium',
      description: 'Experiencia de lujo con atención personalizada las 24 horas.'
    },
    {
      icon: <Shield className="h-8 w-8" />,
      title: 'Seguridad Garantizada',
      description: 'Sistemas de seguridad avanzados para tu tranquilidad.'
    },
    {
      icon: <Clock className="h-8 w-8" />,
      title: 'Check-in Flexible',
      description: 'Horarios flexibles de check-in y check-out según tus necesidades.'
    }
  ]

  return (
    <div className="flex-1">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-primary-600 to-primary-800 text-white">
        <div className="absolute inset-0 bg-black opacity-20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Bienvenido a{' '}
              <span className="text-secondary-400">Hotel DC Company</span>
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-gray-200 max-w-3xl mx-auto">
              Descubre el lujo y la comodidad en el corazón de la ciudad. 
              Donde cada momento se convierte en una experiencia inolvidable.
            </p>
            <p className="text-lg mb-8 text-secondary-300 font-medium">
              "Reserva tu escape, colecciona momentos"
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/habitaciones"
                className="bg-secondary-500 hover:bg-secondary-600 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-colors duration-200 flex items-center justify-center"
              >
                Ver Habitaciones
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <Link
                to="/auth/register"
                className="border-2 border-white text-white hover:bg-white hover:text-primary-600 px-8 py-4 rounded-lg text-lg font-semibold transition-colors duration-200"
              >
                Crear Cuenta
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Por qué elegirnos
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Ofrecemos una experiencia hotelera única que combina lujo, 
              comodidad y servicio excepcional.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="text-center p-6 rounded-lg hover:shadow-lg transition-shadow duration-200"
              >
                <div className="bg-primary-100 text-primary-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gray-900 text-white py-16">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            ¿Listo para tu próxima estadía?
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Descubre la excelencia en servicio y comodidad que nos caracteriza.
          </p>
          <Link
            to="/auth/register"
            className="bg-secondary-500 hover:bg-secondary-600 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-colors duration-200 inline-flex items-center"
          >
            Comenzar Ahora
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </div>
      </section>
    </div>
  )
}

export default Home