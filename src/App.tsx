import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import { AppShell } from './components/layout/AppShell';
import { DashboardPage } from './pages/DashboardPage';
import OrderCreation from './components/OrderCreation';
import TestOrderCreation from './components/TestOrderCreation';
import OrdersManagement from './components/OrdersManagement';
import KitchenView from './components/KitchenView';
import WaitersView from './components/WaitersView';
import ReportsView from './components/ReportsView';
import Catalog from './components/Catalog';
import CatalogManagement from './components/CatalogManagementNew';
import ComboManagement from './components/ComboManagement';
import TablesManagement from './components/TablesManagement';
import ConnectionTest from './components/ConnectionTest';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import './App.css';
import './components/ContrastImprovements.css';

// Componente para rutas protegidas
const ProtectedRoute: React.FC<{ children: React.ReactNode; requiredRole?: string }> = ({ 
  children, 
  requiredRole 
}) => {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

function AppContent() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route 
            path="/" 
            element={
              <ProtectedRoute>
                <AppShell>
                  <DashboardPage />
                </AppShell>
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <AppShell>
                  <DashboardPage />
                </AppShell>
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/new-order" 
            element={
              <ProtectedRoute>
                <AppShell>
                  <OrderCreation />
                </AppShell>
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/test-order" 
            element={
              <ProtectedRoute>
                <AppShell>
                  <TestOrderCreation />
                </AppShell>
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/orders" 
            element={
              <ProtectedRoute>
                <AppShell>
                  <OrdersManagement />
                </AppShell>
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/kitchen" 
            element={
              <ProtectedRoute>
                <AppShell>
                  <KitchenView />
                </AppShell>
              </ProtectedRoute>
            } 
          />
          
          
          <Route 
            path="/waiters" 
            element={
              <ProtectedRoute>
                <AppShell>
                  <WaitersView />
                </AppShell>
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/reports" 
            element={
              <ProtectedRoute requiredRole="ADMIN">
                <AppShell>
                  <ReportsView />
                </AppShell>
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/catalog" 
            element={
              <ProtectedRoute>
                <AppShell>
                  <Catalog />
                </AppShell>
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/catalog-management" 
            element={
              <ProtectedRoute requiredRole="ADMIN">
                <AppShell>
                  <CatalogManagement />
                </AppShell>
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/combos" 
            element={
              <ProtectedRoute requiredRole="ADMIN">
                <AppShell>
                  <ComboManagement />
                </AppShell>
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/tables" 
            element={
              <ProtectedRoute requiredRole="ADMIN">
                <AppShell>
                  <TablesManagement />
                </AppShell>
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/test" 
            element={
              <ProtectedRoute>
                <AppShell>
                  <ConnectionTest />
                </AppShell>
              </ProtectedRoute>
            } 
          />
        </Routes>
      </div>
    </Router>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;


/* Catálogo simplificado activado: 2025-08-31T11:45:03.226Z */
