import { Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import HomePage from './pages/HomePage'
import ShopPage from './pages/ShopPage'
import CategoriesPage from './pages/CategoriesPage'
import AboutPage from './pages/AboutPage'
import ContactPage from './pages/ContactPage'
import AdminRoute from './components/AdminRoute'
import AdminLayout from './layouts/AdminLayout'
import StoreLayout from './layouts/StoreLayout'
import AdminDashboard from './pages/admin/AdminDashboard'
import PartsManager from './pages/admin/PartsManager'
import CategoriesManager from './pages/admin/CategoriesManager'
import RoleManager from './pages/admin/RoleManager'
import PermissionManager from './pages/admin/PermissionManager'
import UserManager from './pages/admin/UserManager'
import ProfileSettings from './pages/ProfileSettings'
import AppointmentsPage from './pages/AppointmentsPage'
import { api } from './services/api'
import './App.css'

// Staff Pages
import StaffLayout from './layouts/StaffLayout';
import StaffRoute from './components/StaffRoute';
import StaffDashboard from './pages/staff/StaffDashboard';
import RegisterCustomer from './pages/staff/RegisterCustomer';
import PointOfSale from './pages/staff/PointOfSale';
import CustomerDirectory from './pages/staff/CustomerDirectory';
import CustomerDetails from './pages/staff/CustomerDetails';
import StaffInvoice from './pages/staff/StaffInvoice';
import CustomerReports from './pages/staff/CustomerReports';
import AppointmentsManager from './pages/staff/AppointmentsManager';

function App() {
  return (
    <Routes>
      {/* Auth Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      
      {/* Public Storefront Routes with Layout */}
      <Route element={<StoreLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/shop" element={<ShopPage />} />
        <Route path="/categories" element={<CategoriesPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/settings" element={<ProfileSettings />} />
        <Route path="/appointments" element={<AppointmentsPage />} />
      </Route>
      
      {/* Staff Routes */}
      <Route path="/staff" element={
        <StaffRoute>
          <StaffLayout />
        </StaffRoute>
      }>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<StaffDashboard />} />
        <Route path="pos" element={<PointOfSale />} />
        <Route path="customers" element={<CustomerDirectory />} />
        <Route path="customers/:id" element={<CustomerDetails />} />
        <Route path="register-customer" element={<RegisterCustomer />} />
        <Route path="invoice/:id" element={<StaffInvoice />} />
        <Route path="reports" element={<CustomerReports />} />
        <Route path="appointments" element={<AppointmentsManager />} />
      </Route>

      {/* Admin Routes - Protected by AdminRoute */}
      <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
        <Route index element={<AdminDashboard />} />
        <Route path="parts" element={<PartsManager />} />
        <Route path="categories" element={<CategoriesManager />} />
        <Route path="roles" element={<RoleManager />} />
        <Route path="permissions" element={<PermissionManager />} />
        <Route path="users" element={<UserManager />} />
        <Route path="settings" element={<ProfileSettings />} />
        <Route path="orders" element={<div>Order Management Coming Soon</div>} />
      </Route>

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  )
}

export default App
