import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Header from './components/layout/Header'
import Footer from './components/layout/Footer'

// Layouts de administración
import AdminLayout from './components/layout/AdminLayout'
import ClientLayout from './components/layout/ClientLayout'

// Componente de ruta protegida
import ProtectedRoute from './components/auth/ProtectedRoute'

// Páginas públicas
import Home from './pages/public/Home'
import Rooms from './pages/public/Rooms'
import Services from './pages/public/Services'
import Contact from './pages/public/Contact'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import ForgotPassword from './pages/auth/ForgotPassword'
import ResetPassword from './pages/auth/ResetPassword'
import VerifyEmail from './pages/auth/VerifyEmail'

// Páginas de cliente
import ClientDashboard from './pages/client/Dashboard'
import ClientReservations from './pages/client/Reservations'
import ClientProfile from './pages/client/Profile'

// Páginas de administración
import AdminDashboard from './pages/admin/Dashboard'
import RoomsManagement from './pages/admin/RoomsManagement'
import ReservationsManagement from './pages/admin/ReservationsManagement'
import UsersManagement from './pages/admin/UsersManagement'
import ServicesManagement from './pages/admin/ServicesManagement'
import EmployeesManagement from './pages/admin/EmployeesManagement'

// Componente de layout principal
const MainLayout = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  )
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="App">
          <Routes>
            {/* ===== RUTAS PÚBLICAS ===== */}
            <Route path="/" element={<MainLayout><Home /></MainLayout>} />
            <Route path="/habitaciones" element={<MainLayout><Rooms /></MainLayout>} />
            <Route path="/servicios" element={<MainLayout><Services /></MainLayout>} />
            <Route path="/contacto" element={<MainLayout><Contact /></MainLayout>} />

            {/* ===== RUTAS DE AUTENTICACIÓN ===== */}
            <Route path="/auth/login" element={<Login />} />
            <Route path="/auth/register" element={<Register />} />
            <Route path="/auth/forgot-password" element={<ForgotPassword />} />
            <Route path="/auth/reset-password" element={<ResetPassword />} />
            <Route path="/auth/verify-email" element={<VerifyEmail />} />

            {/* ===== RUTAS DE CLIENTE ===== */}
            <Route path="/cliente/*" element={
              <ProtectedRoute allowedRoles={['Cliente']}>
                <ClientLayout />
              </ProtectedRoute>
            }>
              <Route index element={<ClientDashboard />} />
              <Route path="reservas" element={<ClientReservations />} />
              <Route path="perfil" element={<ClientProfile />} />
            </Route>

            {/* ===== RUTAS DE ADMINISTRACIÓN (para EMPLEADOS) ===== */}
            <Route path="/admin/*" element={
              <ProtectedRoute allowedRoles={['Empleado']}>
                <AdminLayout />
              </ProtectedRoute>
            }>
              <Route index element={<AdminDashboard />} />
              <Route path="habitaciones" element={<RoomsManagement />} />
              <Route path="reservas" element={<ReservationsManagement />} />
              <Route path="usuarios" element={<UsersManagement />} />
              <Route path="servicios" element={<ServicesManagement />} />
              <Route path="empleados" element={<EmployeesManagement />} />
            </Route>

            {/* ===== RUTA POR DEFECTO ===== */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </AuthProvider>
    </Router>
  )
}

export default App