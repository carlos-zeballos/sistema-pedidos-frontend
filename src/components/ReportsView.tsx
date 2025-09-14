import React, { useState, useEffect } from 'react';
import { Download, Trash2, Filter, RefreshCw, Eye, EyeOff } from 'lucide-react';
import api from '../services/api';
import './ReportsView.css';

// =====================================================
// INTERFACES TYPESCRIPT
// =====================================================

interface PaymentMethodReport {
  method: string;
  icon: string;
  color: string;
  ordersCount: number;
  finalTotal: number;
  originalTotal: number;
  paidByMethod: number;
}

interface DeliveryPaymentReport {
  method: string;
  icon: string;
  color: string;
  deliveryOrdersCount: number;
  deliveryFeesPaid: number;
  orderTotalsPaid: number;
  totalPaid: number;
}

interface OrderReport {
  id: string;
  orderNumber: string;
  createdAt: string;
  spaceCode: string;
  spaceName: string;
  spaceType: string;
  customerName: string;
  status: string;
  originalTotal: number;
  finalTotal: number;
  paidTotal: number;
  deliveryFeeTotal: number;
  totalPaid: number;
  payments: Array<{
    method: string;
    amount: number;
    baseAmount?: number;
    surchargeAmount?: number;
    isDelivery: boolean;
    paymentDate: string;
  }>;
}

interface ReportsFilters {
  from?: string;
  to?: string;
  status?: string;
  method?: string;
  spaceType?: string;
}

// =====================================================
// COMPONENTE PRINCIPAL
// =====================================================

const ReportsView: React.FC = () => {
  // Estados principales
  const [activeTab, setActiveTab] = useState<'payments' | 'delivery' | 'orders'>('payments');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Estados para cada pestaña
  const [paymentMethodsData, setPaymentMethodsData] = useState<PaymentMethodReport[]>([]);
  const [deliveryPaymentsData, setDeliveryPaymentsData] = useState<DeliveryPaymentReport[]>([]);
  const [ordersData, setOrdersData] = useState<OrderReport[]>([]);
  const [ordersTotal, setOrdersTotal] = useState(0);
  const [ordersPage, setOrdersPage] = useState(1);
  const [ordersLimit] = useState(15);

  // Estados para selección y eliminación
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());

  // Filtros
  const [filters, setFilters] = useState<ReportsFilters>({
    from: new Date().toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0],
    status: '',
    method: '',
    spaceType: ''
  });

  // Estados para mostrar/ocultar detalles
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());

  // =====================================================
  // FUNCIONES DE CARGA DE DATOS
  // =====================================================

  const loadPaymentMethodsReport = async () => {
    try {
      const response = await api.get('/reports/payments', {
        params: {
          from: filters.from,
          to: filters.to
        }
      });
      setPaymentMethodsData(response.data);
    } catch (err: any) {
      console.error('Error loading payment methods report:', err);
      setError('Error cargando reporte de métodos de pago');
    }
  };

  const loadDeliveryPaymentsReport = async () => {
    try {
      const response = await api.get('/reports/delivery-payments', {
        params: {
          from: filters.from,
          to: filters.to
        }
      });
      setDeliveryPaymentsData(response.data);
    } catch (err: any) {
      console.error('Error loading delivery payments report:', err);
      setError('Error cargando reporte de delivery');
    }
  };

  const loadOrdersReport = async () => {
    try {
      const response = await api.get('/reports/orders', {
        params: {
          from: filters.from,
          to: filters.to,
          page: ordersPage,
          limit: ordersLimit,
          status: filters.status,
          spaceType: filters.spaceType
        }
      });
      
      setOrdersData(response.data.orders);
      setOrdersTotal(response.data.total);
    } catch (err: any) {
      console.error('Error loading orders report:', err);
      setError('Error cargando reporte de órdenes');
    }
  };

  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      switch (activeTab) {
        case 'payments':
          await loadPaymentMethodsReport();
          break;
        case 'delivery':
          await loadDeliveryPaymentsReport();
          break;
        case 'orders':
          await loadOrdersReport();
          break;
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // FUNCIONES DE MANEJO DE EVENTOS
  // =====================================================

  const handleTabChange = (tab: 'payments' | 'delivery' | 'orders') => {
    setActiveTab(tab);
    setSelectedOrders(new Set());
    setExpandedOrders(new Set());
  };

  const handleFilterChange = (key: keyof ReportsFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleApplyFilters = () => {
    setOrdersPage(1);
    loadData();
  };

  const handlePageChange = (newPage: number) => {
    setOrdersPage(newPage);
  };

  const handleSelectOrder = (orderId: string) => {
    const newSelected = new Set(selectedOrders);
    if (newSelected.has(orderId)) {
      newSelected.delete(orderId);
    } else {
      newSelected.add(orderId);
    }
    setSelectedOrders(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedOrders.size === ordersData.length) {
      setSelectedOrders(new Set());
    } else {
      setSelectedOrders(new Set(ordersData.map(order => order.id)));
    }
  };

  const handleSoftDelete = async (orderId: string, orderNumber: string) => {
    if (!window.confirm(`¿Estás seguro de que quieres eliminar la orden ${orderNumber}?`)) {
      return;
    }

    const reason = prompt('Motivo de eliminación (opcional):') || 'Eliminado por administrador';

    try {
      const response = await api.delete(`/reports/orders/${orderId}`, {
        data: { reason }
      });

      alert(response.data.message);
      loadData();
    } catch (err: any) {
      alert(`Error: ${err.response?.data?.message || err.message}`);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedOrders.size === 0) {
      alert('No hay órdenes seleccionadas para eliminar');
      return;
    }

    const orderNumbers = ordersData
      .filter(order => selectedOrders.has(order.id))
      .map(order => order.orderNumber)
      .join(', ');

    if (!window.confirm(`¿Estás seguro de que quieres eliminar ${selectedOrders.size} órdenes?\n\nÓrdenes: ${orderNumbers}`)) {
      return;
    }

    const reason = prompt('Motivo de eliminación (opcional):') || 'Eliminación masiva por administrador';

    try {
      const deletePromises = Array.from(selectedOrders).map(orderId =>
        api.delete(`/reports/orders/${orderId}`, { data: { reason } })
      );

      await Promise.all(deletePromises);
      alert(`${selectedOrders.size} órdenes eliminadas correctamente`);
      setSelectedOrders(new Set());
      loadData();
    } catch (err: any) {
      alert(`Error eliminando órdenes: ${err.response?.data?.message || err.message}`);
    }
  };

  const handleExportOrders = async () => {
    try {
      const response = await api.get('/reports/export/orders', {
        params: filters
      });

      const blob = new Blob([response.data.csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = response.data.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(`Error exportando reporte: ${err.response?.data?.message || err.message}`);
    }
  };

  const toggleOrderExpansion = (orderId: string) => {
    const newExpanded = new Set(expandedOrders);
    if (newExpanded.has(orderId)) {
      newExpanded.delete(orderId);
    } else {
      newExpanded.add(orderId);
    }
    setExpandedOrders(newExpanded);
  };

  // =====================================================
  // EFECTOS
  // =====================================================

  useEffect(() => {
    loadData();
  }, [activeTab, ordersPage]);

  // =====================================================
  // FUNCIONES DE FORMATEO
  // =====================================================

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-PE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      'PENDIENTE': '#F59E0B',
      'EN_PREPARACION': '#3B82F6',
      'LISTO': '#10B981',
      'PAGADO': '#059669',
      'CANCELADO': '#EF4444'
    };
    return colors[status] || '#6B7280';
  };

  // =====================================================
  // RENDERIZADO
  // =====================================================

  return (
    <div className="reports-container">
      {/* Header */}
      <div className="reports-header">
        <h1>📊 Reportes del Sistema</h1>
        <p>Análisis completo de ventas, métodos de pago y delivery</p>
      </div>

      {/* Filtros */}
      <div className="reports-filters">
        <div className="filter-group">
          <label htmlFor="from-date">📅 Fecha Desde:</label>
          <input
            id="from-date"
            type="date"
            value={filters.from || ''}
            onChange={(e) => handleFilterChange('from', e.target.value)}
          />
        </div>
        <div className="filter-group">
          <label htmlFor="to-date">📅 Fecha Hasta:</label>
          <input
            id="to-date"
            type="date"
            value={filters.to || ''}
            onChange={(e) => handleFilterChange('to', e.target.value)}
          />
        </div>
        {activeTab === 'orders' && (
          <>
            <div className="filter-group">
              <label htmlFor="status-filter">📋 Estado:</label>
              <select
                id="status-filter"
                value={filters.status || ''}
                onChange={(e) => handleFilterChange('status', e.target.value)}
              >
                <option value="">Todos los estados</option>
                <option value="PENDIENTE">Pendiente</option>
                <option value="EN_PREPARACION">En Preparación</option>
                <option value="LISTO">Listo</option>
                <option value="PAGADO">Pagado</option>
                <option value="CANCELADO">Cancelado</option>
              </select>
            </div>
            <div className="filter-group">
              <label htmlFor="space-type-filter">🏢 Tipo de Espacio:</label>
              <select
                id="space-type-filter"
                value={filters.spaceType || ''}
                onChange={(e) => handleFilterChange('spaceType', e.target.value)}
              >
                <option value="">Todos los tipos</option>
                <option value="MESA">Mesa</option>
                <option value="DELIVERY">Delivery</option>
                <option value="MOSTRADOR">Mostrador</option>
              </select>
            </div>
          </>
        )}
        <button onClick={handleApplyFilters} className="apply-filters-btn">
          <Filter className="icon" />
          Aplicar Filtros
        </button>
        <button onClick={loadData} className="refresh-btn">
          <RefreshCw className="icon" />
          Actualizar
        </button>
      </div>

      {/* Pestañas */}
      <div className="reports-tabs">
        <button
          className={`tab ${activeTab === 'payments' ? 'active' : ''}`}
          onClick={() => handleTabChange('payments')}
        >
          💳 Métodos de Pago
        </button>
        <button
          className={`tab ${activeTab === 'delivery' ? 'active' : ''}`}
          onClick={() => handleTabChange('delivery')}
        >
          🚚 Delivery
        </button>
        <button
          className={`tab ${activeTab === 'orders' ? 'active' : ''}`}
          onClick={() => handleTabChange('orders')}
        >
          📋 Órdenes
        </button>
      </div>

      {/* Contenido de las pestañas */}
      <div className="reports-content">
        {loading && (
          <div className="loading">
            <RefreshCw className="spinning" />
            <p>Cargando datos...</p>
          </div>
        )}

        {error && (
          <div className="error">
            <p>❌ {error}</p>
            <button onClick={loadData}>Reintentar</button>
          </div>
        )}

        {/* Pestaña Métodos de Pago */}
        {activeTab === 'payments' && !loading && !error && (
          <div className="payments-report">
            <div className="report-header">
              <h2>💳 Reporte de Métodos de Pago</h2>
              <p>Análisis de pagos por método de pago</p>
            </div>
            
            {paymentMethodsData.length === 0 ? (
              <div className="no-data">
                <p>📊 No hay datos para el período seleccionado</p>
              </div>
            ) : (
              <div className="payments-grid">
                {paymentMethodsData.map((method) => (
                  <div key={method.method} className="payment-method-card">
                    <div className="method-header">
                      <span className="method-icon" style={{ color: method.color }}>
                        {method.icon}
                      </span>
                      <h3>{method.method}</h3>
                    </div>
                    <div className="method-stats">
                      <div className="stat">
                        <span className="stat-label">Órdenes:</span>
                        <span className="stat-value">{method.ordersCount}</span>
                      </div>
                      <div className="stat">
                        <span className="stat-label">Total Pagado:</span>
                        <span className="stat-value">{formatCurrency(method.finalTotal)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Pestaña Delivery */}
        {activeTab === 'delivery' && !loading && !error && (
          <div className="delivery-report">
            <div className="report-header">
              <h2>🚚 Reporte de Delivery</h2>
              <p>Análisis de órdenes de delivery por método de pago</p>
            </div>
            
            {deliveryPaymentsData.length === 0 ? (
              <div className="no-data">
                <p>📊 No hay datos de delivery para el período seleccionado</p>
              </div>
            ) : (
              <div className="delivery-grid">
                {deliveryPaymentsData.map((method) => (
                  <div key={method.method} className="delivery-method-card">
                    <div className="method-header">
                      <span className="method-icon" style={{ color: method.color }}>
                        {method.icon}
                      </span>
                      <h3>{method.method}</h3>
                    </div>
                    <div className="method-stats">
                      <div className="stat">
                        <span className="stat-label">Órdenes Delivery:</span>
                        <span className="stat-value">{method.deliveryOrdersCount}</span>
                      </div>
                      <div className="stat">
                        <span className="stat-label">Total Pagado:</span>
                        <span className="stat-value">{formatCurrency(method.totalPaid)}</span>
                      </div>
                      <div className="stat">
                        <span className="stat-label">Comisiones:</span>
                        <span className="stat-value">{formatCurrency(method.deliveryFeesPaid)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Pestaña Órdenes */}
        {activeTab === 'orders' && !loading && !error && (
          <div className="orders-report">
            <div className="report-header">
              <h2>📋 Reporte de Órdenes</h2>
              <p>Lista detallada de todas las órdenes</p>
              <div className="report-actions">
                <button onClick={handleExportOrders} className="export-btn">
                  <Download className="icon" />
                  Exportar CSV
                </button>
                {selectedOrders.size > 0 && (
                  <button onClick={handleBulkDelete} className="bulk-delete-btn">
                    <Trash2 className="icon" />
                    Eliminar Seleccionadas ({selectedOrders.size})
                  </button>
                )}
              </div>
            </div>

            {ordersData.length === 0 ? (
              <div className="no-data">
                <p>📊 No hay órdenes para el período seleccionado</p>
              </div>
            ) : (
              <>
                <div className="orders-table-container">
                  <table className="orders-table">
                    <thead>
                      <tr>
                        <th>
                          <input
                            type="checkbox"
                            checked={selectedOrders.size === ordersData.length && ordersData.length > 0}
                            onChange={handleSelectAll}
                          />
                        </th>
                        <th>Número</th>
                        <th>Fecha</th>
                        <th>Cliente</th>
                        <th>Espacio</th>
                        <th>Estado</th>
                        <th>Total</th>
                        <th>Pagado</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ordersData.map((order) => (
                        <React.Fragment key={order.id}>
                          <tr className={selectedOrders.has(order.id) ? 'selected' : ''}>
                            <td>
                              <input
                                type="checkbox"
                                checked={selectedOrders.has(order.id)}
                                onChange={() => handleSelectOrder(order.id)}
                              />
                            </td>
                            <td>{order.orderNumber}</td>
                            <td>{formatDate(order.createdAt)}</td>
                            <td>{order.customerName}</td>
                            <td>{order.spaceCode}</td>
                            <td>
                              <span
                                className="status-badge"
                                style={{ backgroundColor: getStatusColor(order.status) }}
                              >
                                {order.status}
                              </span>
                            </td>
                            <td>{formatCurrency(order.finalTotal)}</td>
                            <td>{formatCurrency(order.totalPaid)}</td>
                            <td>
                              <div className="order-actions">
                                <button
                                  onClick={() => toggleOrderExpansion(order.id)}
                                  className="expand-btn"
                                >
                                  {expandedOrders.has(order.id) ? <EyeOff /> : <Eye />}
                                </button>
                                <button
                                  onClick={() => handleSoftDelete(order.id, order.orderNumber)}
                                  className="delete-btn"
                                >
                                  <Trash2 />
                                </button>
                              </div>
                            </td>
                          </tr>
                          {expandedOrders.has(order.id) && (
                            <tr className="order-details">
                              <td colSpan={9}>
                                <div className="order-details-content">
                                  <div className="order-info">
                                    <h4>📋 Detalles de la Orden</h4>
                                    <div className="info-grid">
                                      <div className="info-item">
                                        <span className="info-label">Tipo de Espacio:</span>
                                        <span className="info-value">{order.spaceType}</span>
                                      </div>
                                      <div className="info-item">
                                        <span className="info-label">Total Original:</span>
                                        <span className="info-value">{formatCurrency(order.originalTotal)}</span>
                                      </div>
                                      <div className="info-item">
                                        <span className="info-label">Comisión Delivery:</span>
                                        <span className="info-value">{formatCurrency(order.deliveryFeeTotal)}</span>
                                      </div>
                                    </div>
                                  </div>
                                  {order.payments.length > 0 && (
                                    <div className="payments-info">
                                      <h4>💳 Pagos Realizados</h4>
                                      <div className="payments-list">
                                        {order.payments.map((payment, index) => (
                                          <div key={`${order.id}-payment-${index}`} className="payment-item">
                                            <span className="payment-method">{payment.method}</span>
                                            <span className="payment-amount">{formatCurrency(payment.amount)}</span>
                                            <span className="payment-date">{formatDate(payment.paymentDate)}</span>
                                            {payment.isDelivery && (
                                              <span className="delivery-badge">🚚 Delivery</span>
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Paginación */}
                <div className="pagination">
                  <button
                    onClick={() => handlePageChange(ordersPage - 1)}
                    disabled={ordersPage === 1}
                    className="page-btn"
                  >
                    ← Anterior
                  </button>
                  <span className="page-info">
                    Página {ordersPage} de {Math.ceil(ordersTotal / ordersLimit)}
                    ({ordersTotal} órdenes total)
                  </span>
                  <button
                    onClick={() => handlePageChange(ordersPage + 1)}
                    disabled={ordersPage >= Math.ceil(ordersTotal / ordersLimit)}
                    className="page-btn"
                  >
                    Siguiente →
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportsView;
