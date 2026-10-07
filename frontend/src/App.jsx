import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";

/* AUTH */
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import ForgotPassword from "./pages/auth/ForgotPassword";
import RegisterSuccess from "./pages/auth/RegisterSuccess";

/* LAYOUTS */
import AdminLayout from "./layouts/AdminLayout";
import CustomerLayout from "./layouts/CustomerLayout";

/* ADMIN */
import StoreDashboard from "./pages/admin/StoreDashboard";
import Notifications from "./pages/admin/Notifications";
import UserManagement from "./pages/admin/UserManagement";
import CatalogManagement from "./pages/admin/CatalogManagement";
import StoreOrders from "./pages/admin/StoreOrders";

/* CUSTOMER */
import HomePage from "./pages/customer/HomePage";
import ProductsPage from "./pages/customer/ProductsPage";
import CartPage from "./pages/customer/CartPage";
import CheckoutPage from "./pages/customer/Checkout";
import OrdersPage from "./pages/customer/OrdersPage";
import BrandsPage from "./pages/customer/BrandsPage";
import ContactPage from "./pages/customer/ContactPage";
import ReturnPage from "./pages/customer/ReturnPage";
import CustomerProfilePage from "./pages/customer/CustomerProfilePage";
import Success from "./pages/customer/Success";
import CustomerSettings from "./pages/customer/CustomerSettings";
import ProductDetailPage from './pages/customer/ProductDetailPage';
import About from "./pages/customer/About";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/register-success" element={<RegisterSuccess />} />
      <Route path="/" element={<Navigate to="/customer" replace />} />

      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<StoreDashboard />} />
        <Route path="products" element={<CatalogManagement />} />
        <Route path="catalog" element={<CatalogManagement />} />
        <Route path="orders" element={<StoreOrders />} />
        <Route path="ordermanagement" element={<StoreOrders />} />
        <Route path="users" element={<UserManagement />} />
        <Route path="notifications" element={<Notifications />} />
      </Route>

      <Route path="/customer" element={<CustomerLayout />}>
        <Route index element={<HomePage />} />
        <Route path="products" element={<ProductsPage />} />
        <Route path="products/:id" element={<ProductDetailPage />} />
        <Route path="brands" element={<BrandsPage />} />
        <Route path="about" element={<About />} />
        <Route path="contact" element={<ContactPage />} />

        <Route element={<ProtectedRoute allowedRoles={["customer"]} />}>
          <Route path="cart" element={<CartPage />} />
          <Route path="checkout" element={<CheckoutPage />} />
          <Route path="checkout/success" element={<Success />} />
          <Route path="orders" element={<OrdersPage />} />
          <Route path="returns" element={<ReturnPage />} />
          <Route path="profile" element={<CustomerProfilePage />} />
          <Route path="settings" element={<CustomerSettings />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
