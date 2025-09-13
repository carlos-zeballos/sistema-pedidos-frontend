import React, { useState, useEffect } from 'react';
import { Calendar, Download, Trash2, Filter } from 'lucide-react';
import api from '../services/api';
import './ReportsView.css';

// Trigger: Autodeploy - Limpieza de duplicados completada

interface PaymentMethodReport {
  method: string;
  icon: string;
  color: string;
  ordersCount: number;
  finalTotal: number;
}

interface DeliveryPaymentReport {
  method: string;
  icon: string;
  color: string;
  deliveryOrdersCount: number;
  finalTotal: number;
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

const ReportsView: React.FC = () => {
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
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());
  const [showBulkDelete, setShowBulkDelete] = useState(false);

  // Filtros
  const [filters, setFilters] = useState<ReportsFilters>({
    from: new Date().toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0],
    status: '',
    method: '',
    spaceType: ''
  });

  // Funciones para generar reportes basados en datos de órdenes
  const generatePaymentMethodsReport = (orders: OrderReport[]): PaymentMethodReport[] => {
    const methodMap = new Map<string, {
      method: string;
      icon: string;
      color: string;
      ordersCount: Set<string>;
      finalTotal: number;
    }>();

    // Procesar cada orden - SOLO montos de órdenes base (NO delivery)
    orders.forEach(order => {
      // Obtener SOLO los pagos que NO son de delivery
      const basePayments = order.payments.filter(payment => !payment.isDelivery);
      
      // Agrupar pagos por método para esta orden
      const paymentsByMethod = new Map<string, number>();
      basePayments.forEach(payment => {
        const method = payment.method;
        const amount = payment.baseAmount || payment.amount;
        paymentsByMethod.set(method, (paymentsByMethod.get(method) || 0) + amount);
      });
      
      // Procesar cada método de pago usado en esta orden
      paymentsByMethod.forEach((amount, method) => {
        if (!methodMap.has(method)) {
          const methodConfig = getPaymentMethodConfig(method);
          methodMap.set(method, {
            method: method,
            icon: methodConfig.icon,
            color: methodConfig.color,
            ordersCount: new Set(),
            finalTotal: 0
          });
        }

        const methodData = methodMap.get(method)!;
        methodData.ordersCount.add(order.id);
        methodData.finalTotal += order.finalTotal;  // Solo TOTAL FINAL - valor único y verdadero
      });
    });

    // Convertir a array de reportes
    return Array.from(methodMap.values()).map(method => ({
      method: method.method,
      icon: method.icon,
      color: method.color,
      ordersCount: method.ordersCount.size,
      finalTotal: method.finalTotal
    }));
  };

  const generateDeliveryPaymentsReport = (orders: OrderReport[]): DeliveryPaymentReport[] => {
    const methodMap = new Map<string, {
      method: string;
      icon: string;
      color: string;
      deliveryOrdersCount: Set<string>;
      finalTotal: number;
    }>();

    // Procesar solo órdenes de delivery
    const deliveryOrders = orders.filter(order => order.spaceType === 'DELIVERY');

    deliveryOrders.forEach(order => {
      // Obtener SOLO los pagos que SÍ son de delivery
      const deliveryPayments = order.payments.filter(payment => payment.isDelivery);
      
      // Procesar cada pago de delivery
      deliveryPayments.forEach(payment => {
        const method = payment.method;
        const amount = payment.surchargeAmount || payment.amount;
        
        if (!methodMap.has(method)) {
          const methodConfig = getPaymentMethodConfig(method);
          methodMap.set(method, {
            method: method,
            icon: methodConfig.icon,
            color: methodConfig.color,
            deliveryOrdersCount: new Set(),
            finalTotal: 0
          });
        }

        const methodData = methodMap.get(method)!;
        methodData.deliveryOrdersCount.add(order.id);
        methodData.finalTotal += order.finalTotal;  // Solo TOTAL FINAL - valor único y verdadero
      });
    });

    // Convertir a array de reportes
    return Array.from(methodMap.values()).map(method => ({
      method: method.method,
      icon: method.icon,
      color: method.color,
      deliveryOrdersCount: method.deliveryOrdersCount.size,
      finalTotal: method.finalTotal
    }));
  };

  const getPaymentMethodConfig = (method: string) => {
    const configs: Record<string, { icon: string; color: string }> = {
      'EFECTIVO': { icon: '💵', color: '#4caf50' },
      'TARJETA': { icon: '💳', color: '#2196f3' },
      'TRANSFERENCIA': { icon: '🏦', color: '#ff9800' },
      'YAPE': { icon: '📱', color: '#9c27b0' },
      'PLIN': { icon: '📱', color: '#00bcd4' },
      'BIM': { icon: '📱', color: '#795548' }
    };
    
    return configs[method] || { icon: '💰', color: '#666' };
  };

  // Cargar datos según la pestaña activa
  useEffect(() => {
    loadData();
  }, [activeTab, filters, ordersPage]);

  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Siempre cargar datos de órdenes primero (fuente de verdad)
      const ordersResponse = await api.get('/reports/orders', {
        params: {
          from: filters.from,
          to: filters.to,
          page: ordersPage,
          limit: ordersLimit,
          status: filters.status,
          spaceType: filters.spaceType
        }
      });
      
      const ordersData = ordersResponse.data.orders;
      setOrdersData(ordersData);
      setOrdersTotal(ordersResponse.data.total);

      // Generar reportes basados en los datos de órdenes
      switch (activeTab) {
        case 'payments': {
          const paymentMethodsData = generatePaymentMethodsReport(ordersData);
          setPaymentMethodsData(paymentMethodsData);
          break;
        }

        case 'delivery': {
          const deliveryPaymentsData = generateDeliveryPaymentsReport(ordersData);
          setDeliveryPaymentsData(deliveryPaymentsData);
          break;
        }

        case 'orders': {
          // Los datos ya están cargados arriba
          break;
        }
      }
    } catch (err: any) {
      setError(err.message);
      console.error('Error loading reports data:', err);
    } finally {
      setLoading(false);
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
      
      // Recargar datos
      loadData();
    } catch (err: any) {
      alert(`Error: ${err.response?.data?.message || err.message}`);
    }
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

    const reason = prompt('Motivo de eliminación masiva (opcional):') || 'Eliminación masiva por administrador';

    try {
      const deletePromises = Array.from(selectedOrders).map(orderId =>
        api.delete(`/reports/orders/${orderId}`, {
          data: { reason }
        })
      );

      await Promise.all(deletePromises);
      
      alert(`${selectedOrders.size} órdenes eliminadas exitosamente`);
      setSelectedOrders(new Set());
      setShowBulkDelete(false);
      
      // Recargar datos
      loadData();
    } catch (err: any) {
      alert(`Error al eliminar órdenes: ${err.response?.data?.message || err.message}`);
    }
  };

  const handleExport = async () => {
    try {
      const response = await api.get('/reports/export/orders', {
        params: {
          from: filters.from,
          to: filters.to
        }
      });

      const result = response.data;
      
      // Descargar archivo CSV
      const blob = new Blob([result.csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = result.filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      alert(`Error al exportar: ${err.response?.data?.message || err.message}`);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('es-PE', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return dateString; // Fallback si hay error en el formato
    }
  };

  return (
    <div className="reports-view">
      <div className="reports-header">
        <h1>📊 Reportes del Sistema</h1>
        <div className="reports-actions">
          <button 
            className="export-btn"
            onClick={handleExport}
            disabled={loading}
          >
            <Download size={16} />
            Exportar CSV
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="reports-filters">
        <div className="filter-group">
          <label>
            <Calendar size={16} />
            Desde:
          </label>
          <input
            type="date"
            value={filters.from || ''}
            onChange={(e) => setFilters({ ...filters, from: e.target.value })}
          />
        </div>
        <div className="filter-group">
          <label>
            <Calendar size={16} />
            Hasta:
          </label>
          <input
            type="date"
            value={filters.to || ''}
            onChange={(e) => setFilters({ ...filters, to: e.target.value })}
          />
        </div>
        
        {/* Filtros adicionales para la pestaña de órdenes */}
        {activeTab === 'orders' && (
          <>
            <div className="filter-group">
              <label>Estado:</label>
              <select
                value={filters.status || ''}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              >
                <option value="">Todos los estados</option>
                <option value="PENDIENTE">Pendiente</option>
                <option value="EN_PREPARACION">En Preparación</option>
                <option value="LISTO">Listo</option>
                <option value="ENTREGADO">Entregado</option>
                <option value="CANCELADO">Cancelado</option>
              </select>
            </div>
            <div className="filter-group">
              <label>Tipo de Espacio:</label>
              <select
                value={filters.spaceType || ''}
                onChange={(e) => setFilters({ ...filters, spaceType: e.target.value })}
              >
                <option value="">Todos los tipos</option>
                <option value="MESA">Mesa</option>
                <option value="BARRA">Barra</option>
                <option value="DELIVERY">Delivery</option>
                <option value="RESERVA">Reserva</option>
              </select>
            </div>
          </>
        )}
        
        <button 
          className="apply-filters-btn"
          onClick={loadData}
          disabled={loading}
        >
          <Filter size={16} />
          Aplicar Filtros
        </button>
        
        <button 
          className="clear-filters-btn"
          onClick={() => {
            setFilters({
              from: new Date().toISOString().split('T')[0],
              to: new Date().toISOString().split('T')[0],
              status: '',
              method: '',
              spaceType: ''
            });
            setOrdersPage(1);
          }}
          disabled={loading}
        >
          Limpiar
        </button>
      </div>

      {/* Pestañas */}
      <div className="reports-tabs">
        <button
          className={`tab ${activeTab === 'payments' ? 'active' : ''}`}
          onClick={() => setActiveTab('payments')}
        >
          💳 Métodos de Pago
        </button>
        <button
          className={`tab ${activeTab === 'delivery' ? 'active' : ''}`}
          onClick={() => setActiveTab('delivery')}
        >
          🚚 Delivery por Método
        </button>
        <button
          className={`tab ${activeTab === 'orders' ? 'active' : ''}`}
          onClick={() => setActiveTab('orders')}
        >
          📋 Ventas Totales
        </button>
      </div>

      {/* Contenido de las pestañas */}
      <div className="reports-content">
        {loading && (
          <div className="loading">
            <div className="spinner"></div>
            <p>Cargando datos...</p>
          </div>
        )}

        {error && (
          <div className="error">
            <p>❌ {error}</p>
            <button onClick={loadData}>Reintentar</button>
          </div>
        )}

        {!loading && !error && (
          <>
            {/* Pestaña Métodos de Pago */}
            {activeTab === 'payments' && (
              <div className="payments-tab">
                <h2>💳 Resumen por Método de Pago</h2>
                {paymentMethodsData.length === 0 ? (
                  <div className="no-data">
                    <p>📊 No hay datos de pagos para mostrar en el rango de fechas seleccionado.</p>
                    <p>Intenta cambiar las fechas o crear algunas órdenes con pagos.</p>
                  </div>
                ) : (
                  <div className="payments-grid">
                    {paymentMethodsData.map((payment) => (
                    <div key={payment.method} className="payment-card">
                      <div className="payment-header">
                        <span className="payment-icon" style={{ color: payment.color }}>
                          {payment.icon}
                        </span>
                        <h3>{payment.method}</h3>
                      </div>
                      <div className="payment-stats">
                        <div className="stat">
                          <span className="stat-label">Pedidos:</span>
                          <span className="stat-value">{payment.ordersCount}</span>
                        </div>
                        <div className="stat highlight">
                          <span className="stat-label">Total Final:</span>
                          <span className="stat-value">{formatCurrency(payment.finalTotal)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                )}
              </div>
            )}

            {/* Pestaña Delivery por Método */}
            {activeTab === 'delivery' && (
              <div className="delivery-tab">
                <h2>🚚 Delivery por Método de Pago</h2>
                <div className="delivery-grid">
                  {deliveryPaymentsData.map((delivery) => (
                    <div key={delivery.method} className="delivery-card">
                      <div className="delivery-header">
                        <span className="delivery-icon" style={{ color: delivery.color }}>
                          {delivery.icon}
                        </span>
                        <h3>{delivery.method}</h3>
                      </div>
                      <div className="delivery-stats">
                        <div className="stat">
                          <span className="stat-label">Deliverys:</span>
                          <span className="stat-value">{delivery.deliveryOrdersCount}</span>
                        </div>
                        <div className="stat highlight">
                          <span className="stat-label">Total Final:</span>
                          <span className="stat-value">{formatCurrency(delivery.finalTotal)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Pestaña Ventas Totales */}
            {activeTab === 'orders' && (
              <div className="orders-tab">
                <div className="orders-header">
                  <h2>📋 Ventas Totales</h2>
                  <div className="bulk-actions">
                    {selectedOrders.size > 0 && (
                      <div className="bulk-actions-bar">
                        <span className="selected-count">
                          {selectedOrders.size} órdenes seleccionadas
                        </span>
                        <button
                          className="bulk-delete-btn"
                          onClick={handleBulkDelete}
                        >
                          <Trash2 size={16} />
                          Eliminar Seleccionadas
                        </button>
                        <button
                          className="clear-selection-btn"
                          onClick={() => setSelectedOrders(new Set())}
                        >
                          Limpiar Selección
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <div className="orders-table-container">
                  <table className="orders-table">
                    <thead>
                      <tr>
                        <th>
                          <input
                            type="checkbox"
                            checked={selectedOrders.size === ordersData.length && ordersData.length > 0}
                            onChange={handleSelectAll}
                            title="Seleccionar todas"
                          />
                        </th>
                        <th>Orden</th>
                        <th>Fecha</th>
                        <th>Espacio</th>
                        <th>Cliente</th>
                        <th>Estado</th>
                        <th>Total Final</th>
                        <th>Pagado</th>
                        <th>Fee Delivery</th>
                        <th>Pagos</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ordersData.map((order) => (
                        <tr key={order.id} className={selectedOrders.has(order.id) ? 'selected' : ''}>
                          <td>
                            <input
                              type="checkbox"
                              checked={selectedOrders.has(order.id)}
                              onChange={() => handleSelectOrder(order.id)}
                              title="Seleccionar orden"
                            />
                          </td>
                          <td>{order.orderNumber}</td>
                          <td>{formatDate(order.createdAt)}</td>
                          <td>{order.spaceCode}</td>
                          <td>{order.customerName || '-'}</td>
                          <td>
                            <span className={`status-badge status-${order.status.toLowerCase()}`}>
                              {order.status}
                            </span>
                          </td>
                          <td>{formatCurrency(order.finalTotal)}</td>
                          <td>{formatCurrency(order.paidTotal)}</td>
                          <td>{formatCurrency(order.deliveryFeeTotal)}</td>
                          <td>
                            <div className="payments-tooltip">
                              {(() => {
                                // Mostrar cada pago individual pero evitar duplicaciones del mismo método
                                const seenPayments = new Set<string>();
                                const uniquePayments: Array<{
                                  method: string;
                                  amount: number;
                                  isDelivery: boolean;
                                }> = [];
                                
                                order.payments.forEach(payment => {
                                  const key = `${payment.method}-${payment.amount}-${payment.isDelivery}`;
                                  if (!seenPayments.has(key)) {
                                    seenPayments.add(key);
                                    uniquePayments.push(payment);
                                  }
                                });
                                
                                return uniquePayments.map((payment, index) => (
                                  <div key={`${payment.method}-${index}`} className="payment-item">
                                    {payment.method}: {formatCurrency(payment.amount)}
                                    {payment.isDelivery && ' (Delivery)'}
                                  </div>
                                ));
                              })()}
                            </div>
                          </td>
                          <td>
                            <button
                              className="delete-btn"
                              onClick={() => handleSoftDelete(order.id, order.orderNumber)}
                              title="Eliminar orden"
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Paginación */}
                <div className="pagination">
                  <button
                    onClick={() => setOrdersPage(ordersPage - 1)}
                    disabled={ordersPage === 1 || loading}
                  >
                    Anterior
                  </button>
                  <span>
                    Página {ordersPage} de {Math.ceil(ordersTotal / ordersLimit)}
                  </span>
                  <button
                    onClick={() => setOrdersPage(ordersPage + 1)}
                    disabled={ordersPage >= Math.ceil(ordersTotal / ordersLimit) || loading}
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ReportsView;
