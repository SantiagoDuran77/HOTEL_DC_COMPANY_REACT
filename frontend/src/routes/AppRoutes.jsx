import React from 'react'
import { Routes, Route } from 'react-router-dom'
import { getRooms, getReservations, getUsers } from '../services/api'

// Layouts
import MainLayout from '../components/layout/MainLayout'
import AdminLayout from '../components/layout/AdminLayout'
import ClientLayout from '../components/layout/ClientLayout'

// Public Pages
import Home from '../pages/public/Home'
import Rooms from '../pages/public/Rooms'
import Services from '../pages/public/Services'
import Contact from '../pages/public/Contact'

// Auth Pages
import Login from '../pages/auth/Login'
import Register from '../pages/auth/Register'
import ForgotPassword from '../pages/auth/ForgotPassword'

// Client Pages
import ClientDashboard from '../pages/client/Dashboard'
import ClientReservations from '../pages/client/Reservations'
import ClientProfile from '../pages/client/Profile'

// Admin Pages
import AdminDashboard from '../pages/admin/Dashboard'
import RoomsManagement from '../pages/admin/RoomsManagement'
import ReservationsManagement from '../pages/admin/ReservationsManagement'
import UsersManagement from '../pages/admin/UsersManagement'
import ServicesManagement from '../pages/admin/ServicesManagement'

// Protected Route Component
import ProtectedRoute from '../components/auth/ProtectedRoute'

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<MainLayout />}>
        <Route index element={<Home />} />
        <Route path="habitaciones" element={<Rooms />} />
        <Route path="servicios" element={<Services />} />
        <Route path="contacto" element={<Contact />} />
      </Route>

      {/* Auth Routes */}
      <Route path="/auth" element={<MainLayout />}>
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route path="forgot-password" element={<ForgotPassword />} />
      </Route>

      {/* Client Routes */}
      <Route 
        path="/cliente" 
        element={
          <ProtectedRoute allowedRoles={['Cliente']}>
            <ClientLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<ClientDashboard />} />
        <Route path="reservas" element={<ClientReservations />} />
        <Route path="perfil" element={<ClientProfile />} />
      </Route>

      {/* Admin Routes */}
      <Route 
        path="/admin" 
        element={
          <ProtectedRoute allowedRoles={['Empleado', 'admin']}>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="habitaciones" element={<RoomsManagement />} />
        <Route path="reservas" element={<ReservationsManagement />} />
        <Route path="usuarios" element={<UsersManagement />} />
        <Route path="servicios" element={<ServicesManagement />} />
      </Route>

      {/* 404 Route */}
      <Route path="*" element={<div>404 - Página no encontrada</div>} />
    </Routes>
  )
}

export default AppRoutes