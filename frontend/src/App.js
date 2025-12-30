import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { AuthProvider } from './context/AuthContext';
import { Toaster } from 'react-hot-toast';
import { queryClient } from './utils/queryClient';

// Layout & guards
import Layout from './components/layout/Layout';
import ProtectedRoute from './components/common/ProtectedRoute';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Sales from './pages/Sales';
import Production from './pages/Production';
import Inventory from './pages/Inventory';
import Finance from './pages/Finance';
import AIPage from './pages/AIPage';
import Business from './pages/Business';
import Upload from './pages/Upload';
import Profile from './pages/Profile';
import NotFound from './pages/NotFound';

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <AuthProvider>
          <Toaster position="top-right" />
          <Routes>
            {/* Public */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Protected */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="products" element={<Products />} />
              <Route path="sales" element={<Sales />} />
              <Route path="production" element={<Production />} />
              <Route path="inventory" element={<Inventory />} />
              <Route path="finance" element={<Finance />} />
              <Route path="ai" element={<AIPage />} />
              <Route path="business" element={<Business />} />
              <Route path="upload" element={<Upload />} />
              <Route path="profile" element={<Profile />} />
            </Route>

            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </Router>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

export default App;
