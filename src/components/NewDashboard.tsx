import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { orderService, tableService } from '../services/api';
import './NewDashboard.css';

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: number;
  customerName: string;
  createdAt: string;
  updatedAt: string;
  items: any[];
  space: {
    id: string;
    name: string;
    type: string;
    capacity: number;
    status: string;
  };
}

interface Space {
  id: string;
  name: string;
  type: string;
  capacity: number;
  status: string;
}

const NewDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState({
    totalSpaces: 0,
    availableSpaces: 0,
    recentOrders: 0,
    pendingOrders: 0
  });

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [ordersData, spacesData] = await Promise.all([
        orderService.getOrders(),
        tableService.getSpaces()
      ]);

      setSpaces(spacesData);
      setOrders(ordersData);

      // Calcular estadísticas
      const today = new Date().toISOString().split('T')[0];
      const todayOrders = ordersData.filter((order: Order) => {
        const orderDate = new Date(order.createdAt).toISOString().split('T')[0];
        return orderDate === today;
      });

      const activeOrders = todayOrders.filter((order: Order) => 
        ['PENDIENTE', 'EN_PREPARACION', 'LISTO'].includes(order.status)
      );

      setStats({
        totalSpaces: spacesData.length,
        availableSpaces: spacesData.filter((space: Space) => space.status === 'LIBRE').length,
        recentOrders: todayOrders.length,
        pendingOrders: activeOrders.length
      });

    } catch (error: any) {
      console.error('Error cargando datos:', error);
      setError('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAction = (route: string) => {
    navigate(route);
  };

  const getTimeElapsed = (dateString: string) => {
    const now = new Date();
    const orderTime = new Date(dateString);
    const diffMs = now.getTime() - orderTime.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    return `${diffMins} MIN`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDIENTE': return 'pending';
      case 'EN_PREPARACION': return 'preparing';
      case 'LISTO': return 'ready';
      case 'PAGADO': return 'paid';
      default: return 'default';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PENDIENTE': return 'PENDIENTE';
      case 'EN_PREPARACION': return 'EN PREPARACIÓN';
      case 'LISTO': return 'LISTO';
      case 'PAGADO': return 'PAGADO';
      default: return status;
    }
  };

  const getRoleText = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'ADMIN';
      case 'WAITER': return 'MOZO';
      case 'KITCHEN': return 'COCINA';
      default: return role;
    }
  };

  if (loading) {
    return (
      <div className="new-dashboard">
        <div className="loading">
          <div className="spinner"></div>
          <p>Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="new-dashboard">
        <div className="error">
          <div className="error-icon">⚠️</div>
          <h3>Error</h3>
          <p>{error}</p>
          <button onClick={loadData} className="retry-btn">Reintentar</button>
        </div>
      </div>
    );
  }

  return (
    <div className="new-dashboard">
      {/* Header */}
      <div className="header">
        <h1>Dashboard</h1>
        <div className="user-badge">
          {getRoleText(user?.role || '')}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats">
        <div className="stat-card">
          <div className="stat-icon">🪑</div>
          <div className="stat-content">
            <div className="stat-number">{stats.totalSpaces}</div>
            <div className="stat-label">Espacios disponibles</div>
            <div className="stat-change positive">+8% vs mes anterior</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🪑</div>
          <div className="stat-content">
            <div className="stat-number">{stats.availableSpaces}</div>
            <div className="stat-label">Disponibles ahora</div>
            <div className="stat-change positive">+12% vs mes anterior</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🕐</div>
          <div className="stat-content">
            <div className="stat-number">{stats.recentOrders}</div>
            <div className="stat-label">Últimas 24 horas</div>
            <div className="stat-change positive">+19% vs mes anterior</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🕐</div>
          <div className="stat-content">
            <div className="stat-number">{stats.pendingOrders}</div>
            <div className="stat-label">En espera</div>
            <div className="stat-change negative">-9% vs mes anterior</div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <h2>Acciones Rápidas</h2>
        <div className="actions-grid">
          <button 
            className="action-card"
            onClick={() => handleQuickAction('/new-order')}
          >
            <div className="action-icon">➕</div>
            <div className="action-title">Nueva Orden</div>
            <div className="action-description">Crear nueva orden</div>
          </button>

          <button 
            className="action-card"
            onClick={() => handleQuickAction('/kitchen')}
          >
            <div className="action-icon">👨‍🍳</div>
            <div className="action-title">Vista Cocina</div>
            <div className="action-description">Panel de cocina</div>
          </button>

          <button 
            className="action-card"
            onClick={() => handleQuickAction('/tables')}
          >
            <div className="action-icon">🪑</div>
            <div className="action-title">Gestionar Espacios</div>
            <div className="action-description">Gestión de mesas</div>
          </button>

          <button 
            className="action-card"
            onClick={() => handleQuickAction('/catalog')}
          >
            <div className="action-icon">📖</div>
            <div className="action-title">Catálogo</div>
            <div className="action-description">Ver catálogo de productos</div>
          </button>

          <button 
            className="action-card"
            onClick={() => handleQuickAction('/catalog-management')}
          >
            <div className="action-icon">⚙️</div>
            <div className="action-title">Gestión Catálogo</div>
            <div className="action-description">Crear y editar productos, categorías y espacios</div>
          </button>

          <button 
            className="action-card"
            onClick={() => handleQuickAction('/combo-management')}
          >
            <div className="action-icon">📦</div>
            <div className="action-title">Gestión Combos</div>
            <div className="action-description">Crear y editar combos personalizables</div>
          </button>

          <button 
            className="action-card"
            onClick={() => handleQuickAction('/users')}
          >
            <div className="action-icon">👥</div>
            <div className="action-title">Usuarios</div>
            <div className="action-description">Gestión de usuarios</div>
          </button>

        </div>
      </div>

      {/* Bottom Section */}
      <div className="bottom-section">
        {/* Recent Orders */}
        <div className="recent-orders">
          <div className="section-header">
            <div className="section-icon">🕐</div>
            <h2>Órdenes Recientes</h2>
          </div>
          
          <div className="orders-list">
            {orders
              .filter(order => ['PENDIENTE', 'EN_PREPARACION', 'LISTO'].includes(order.status))
              .slice(0, 3)
              .map(order => (
                <div key={order.id} className="order-item">
                  <div className="order-icon">🕐</div>
                  <div className="order-info">
                    <div className="order-number">#{order.orderNumber}</div>
                    <div className="order-space">{order.space?.name || 'Sin espacio'}</div>
                  </div>
                  <div className="order-status">
                    <span className={`status-badge ${getStatusColor(order.status)}`}>
                      {getStatusText(order.status)}
                    </span>
                    <div className="order-time">{getTimeElapsed(order.createdAt)}</div>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* System Status */}
        <div className="system-status">
          <div className="section-header">
            <div className="section-icon">📈</div>
            <h2>Estado del Sistema</h2>
          </div>
          
          <div className="status-list">
            <div className="status-item">
              <div className="status-label">Servidor</div>
              <span className="status-badge online">ON LINE</span>
            </div>
            <div className="status-item">
              <div className="status-label">Base de Datos</div>
              <span className="status-badge online">CONECTADO</span>
            </div>
            <div className="status-item">
              <div className="status-label">Impresora</div>
              <span className="status-badge connecting">CONECTANDO...</span>
            </div>
            <div className="status-item">
              <div className="status-label">Red</div>
              <span className="status-badge online">ESTABLE</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewDashboard;





