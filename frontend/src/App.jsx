import { Routes, Route, useNavigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import CartDrawer from './components/CartDrawer';
import ProtectedRoute from './components/ProtectedRoute';

import Home from './pages/Home';
import ProductDetails from './pages/ProductDetails';
import Login from './pages/Login';
import Register from './pages/Register';
import Checkout from './pages/Checkout';
import MyDownloads from './pages/MyDownloads';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import AdminDashboard from './pages/AdminDashboard';

export default function App() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 transition-colors duration-200 selection:bg-indigo-500 selection:text-white">
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/store" element={<Home />} />
          <Route path="/product/:slug" element={<ProductDetails />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/forgot-password"
            element={<ForgotPassword onNavigate={(page, params) => navigate(`/${page}${params?.token ? `?token=${params.token}` : ''}`)} />}
          />
          <Route
            path="/reset-password"
            element={<ResetPassword onNavigate={(page) => navigate(`/${page}`)} />}
          />
          <Route path="/checkout" element={<Checkout />} />
          <Route
            path="/my-downloads"
            element={
              <ProtectedRoute>
                <MyDownloads />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminDashboard onNavigate={(page) => navigate(`/${page}`)} />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Home />} />
        </Routes>
      </main>
      <Footer />
      <CartDrawer />
    </div>
  );
}
