import React from 'react'
import { Link } from 'react-router-dom'
import { Phone, Mail, MapPin } from 'lucide-react'

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo and Description */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-3 mb-4">
              <div className="bg-primary-500 text-white p-2 rounded-lg">
                <span className="font-bold text-lg">HOTEL</span>
              </div>
              <div className="text-white">
                <div className="font-bold text-xl leading-5">DC</div>
                <div className="text-xs font-medium text-gray-300">COMPANY</div>
              </div>
            </div>
            <p className="text-gray-300 mb-4 max-w-md">
              Descubre el lujo y la comodidad en el corazón de la ciudad. 
              Hotel DC Company ofrece experiencias únicas con servicio excepcional.
            </p>
            <p className="text-secondary-400 font-medium">
              "Reserva tu escape, colecciona momentos"
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Enlaces Rápidos</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/habitaciones" className="text-gray-300 hover:text-white transition-colors">
                  Habitaciones
                </Link>
              </li>
              <li>
                <Link to="/servicios" className="text-gray-300 hover:text-white transition-colors">
                  Servicios
                </Link>
              </li>
              <li>
                <Link to="/contacto" className="text-gray-300 hover:text-white transition-colors">
                  Contacto
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Contacto</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <MapPin className="h-5 w-5 text-secondary-400" />
                <span className="text-gray-300">Calle Principal #123, Ciudad</span>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="h-5 w-5 text-secondary-400" />
                <span className="text-gray-300">+57 1 234 5678</span>
              </div>
              <div className="flex items-center space-x-3">
                <Mail className="h-5 w-5 text-secondary-400" />
                <span className="text-gray-300">info@hoteldccompany.com</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-700 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-400 text-sm">
            © 2025 Hotel DC Company. Todos los derechos reservados.
          </p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <a href="#" className="text-gray-400 hover:text-white transition-colors text-sm">
              Términos y Condiciones
            </a>
            <a href="#" className="text-gray-400 hover:text-white transition-colors text-sm">
              Política de Privacidad
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer