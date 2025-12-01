import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Header from './components/layout/Header'
import Footer from './components/layout/Footer'

// Páginas públicas
import Home from './pages/public/Home'
import Rooms from './pages/public/Rooms'
import Services from './pages/public/Services'
import Contact from './pages/public/Contact'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import ForgotPassword from './pages/auth/ForgotPassword'
import ResetPassword from './pages/auth/ResetPassword'
import VerifyEmail from './pages/auth/VerifyEmail' // NUEVO

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

// Componente de ruta protegida
const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const { isAuthenticated, isAdmin } = useAuth()
  
  if (!isAuthenticated) {
    return <Navigate to="/auth/login" replace />
  }
  
  if (requireAdmin && !isAdmin) {
    return <Navigate to="/cliente" replace />
  }
  
  return children
}

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

// Componente de layout de autenticación (sin header/footer)
const AuthLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      {children}
    </div>
  )
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="App">
          <Routes>
            {/* Rutas públicas con layout completo */}
            <Route path="/" element={
              <MainLayout>
                <Home />
              </MainLayout>
            } />
            <Route path="/habitaciones" element={
              <MainLayout>
                <Rooms />
              </MainLayout>
            } />
            <Route path="/servicios" element={
              <MainLayout>
                <Services />
              </MainLayout>
            } />
            <Route path="/contacto" element={
              <MainLayout>
                <Contact />
              </MainLayout>
            } />

            {/* Rutas de autenticación (sin layout) */}
            <Route path="/auth/login" element={
              <AuthLayout>
                <Login />
              </AuthLayout>
            } />
            <Route path="/auth/register" element={
              <AuthLayout>
                <Register />
              </AuthLayout>
            } />
            <Route path="/auth/forgot-password" element={
              <AuthLayout>
                <ForgotPassword />
              </AuthLayout>
            } />
            <Route path="/auth/reset-password" element={
              <AuthLayout>
                <ResetPassword />
              </AuthLayout>
            } />
            {/* NUEVA RUTA DE VERIFICACIÓN DE EMAIL */}
            <Route path="/auth/verify-email" element={
              <AuthLayout>
                <VerifyEmail />
              </AuthLayout>
            } />

            {/* Rutas de cliente protegidas */}
            <Route path="/cliente" element={
              <ProtectedRoute>
                <MainLayout>
                  <ClientDashboard />
                </MainLayout>
              </ProtectedRoute>
            } />
            <Route path="/cliente/reservas" element={
              <ProtectedRoute>
                <MainLayout>
                  <ClientReservations />
                </MainLayout>
              </ProtectedRoute>
            } />
            <Route path="/cliente/perfil" element={
              <ProtectedRoute>
                <MainLayout>
                  <ClientProfile />
                </MainLayout>
              </ProtectedRoute>
            } />

            {/* Rutas de administración protegidas */}
            <Route path="/admin" element={
              <ProtectedRoute requireAdmin={true}>
                <MainLayout>
                  <AdminDashboard />
                </MainLayout>
              </ProtectedRoute>
            } />
            <Route path="/admin/habitaciones" element={
              <ProtectedRoute requireAdmin={true}>
                <MainLayout>
                  <RoomsManagement />
                </MainLayout>
              </ProtectedRoute>
            } />
            <Route path="/admin/reservas" element={
              <ProtectedRoute requireAdmin={true}>
                <MainLayout>
                  <ReservationsManagement />
                </MainLayout>
              </ProtectedRoute>
            } />
            <Route path="/admin/usuarios" element={
              <ProtectedRoute requireAdmin={true}>
                <MainLayout>
                  <UsersManagement />
                </MainLayout>
              </ProtectedRoute>
            } />
            <Route path="/admin/servicios" element={
              <ProtectedRoute requireAdmin={true}>
                <MainLayout>
                  <ServicesManagement />
                </MainLayout>
              </ProtectedRoute>
            } />
            <Route path="/admin/empleados" element={
              <ProtectedRoute requireAdmin={true}>
                <MainLayout>
                  <EmployeesManagement />
                </MainLayout>
              </ProtectedRoute>
            } />

            {/* Ruta por defecto */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </AuthProvider>
    </Router>
  )
}

export default App