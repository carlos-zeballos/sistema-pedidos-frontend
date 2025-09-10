import React, { useState, useEffect } from 'react';
import { Calendar, Download, Trash2, Filter } from 'lucide-react';
import './ReportsView.css';

interface PaymentMethodReport {
  method: string;
  icon: string;
  color: string;
  ordersCount: number;
  paidByMethod: number;
  originalTotal: number;
  finalTotal: number;
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
  const [ordersLimit] = useState(50);

  // Filtros
  const [filters, setFilters] = useState<ReportsFilters>({
    from: new Date().toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0],
    status: '',
    method: '',
    spaceType: ''
  });

  // Cargar datos según la pestaña activa
  useEffect(() => {
    loadData();
  }, [activeTab, filters, ordersPage]);

  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:3000';
      const token = localStorage.getItem('token');

      if (!token) {
        throw new Error('No hay token de autenticación');
      }

      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      switch (activeTab) {
        case 'payments': {
          const paymentsResponse = await fetch(
            `${baseUrl}/reports/payments?from=${filters.from}&to=${filters.to}`,
            { headers }
          );
          if (!paymentsResponse.ok) throw new Error('Error al cargar métodos de pago');
          const paymentsData = await paymentsResponse.json();
          setPaymentMethodsData(paymentsData);
          break;
        }

        case 'delivery': {
          const deliveryResponse = await fetch(
            `${baseUrl}/reports/delivery-payments?from=${filters.from}&to=${filters.to}`,
            { headers }
          );
          if (!deliveryResponse.ok) throw new Error('Error al cargar pagos de delivery');
          const deliveryData = await deliveryResponse.json();
          setDeliveryPaymentsData(deliveryData);
          break;
        }

        case 'orders': {
          const ordersResponse = await fetch(
            `${baseUrl}/reports/orders?from=${filters.from}&to=${filters.to}&page=${ordersPage}&limit=${ordersLimit}`,
            { headers }
          );
          if (!ordersResponse.ok) throw new Error('Error al cargar órdenes');
          const ordersResult = await ordersResponse.json();
          setOrdersData(ordersResult.orders);
          setOrdersTotal(ordersResult.total);
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
      const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:3000';
      const token = localStorage.getItem('token');

      const response = await fetch(`${baseUrl}/reports/orders/${orderId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason })
      });

      if (!response.ok) throw new Error('Error al eliminar la orden');

      const result = await response.json();
      alert(result.message);
      
      // Recargar datos
      loadData();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleExport = async () => {
    try {
      const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:3000';
      const token = localStorage.getItem('token');

      const response = await fetch(
        `${baseUrl}/reports/export/orders?from=${filters.from}&to=${filters.to}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (!response.ok) throw new Error('Error al exportar datos');

      const result = await response.json();
      
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
      alert(`Error al exportar: ${err.message}`);
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
                        <div className="stat">
                          <span className="stat-label">Total Original:</span>
                          <span className="stat-value">{formatCurrency(payment.originalTotal)}</span>
                        </div>
                        <div className="stat">
                          <span className="stat-label">Total Final:</span>
                          <span className="stat-value">{formatCurrency(payment.finalTotal)}</span>
                        </div>
                        <div className="stat highlight">
                          <span className="stat-label">Total Cobrado:</span>
                          <span className="stat-value">{formatCurrency(payment.paidByMethod)}</span>
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
                        <div className="stat">
                          <span className="stat-label">Total Pedidos:</span>
                          <span className="stat-value">{formatCurrency(delivery.orderTotalsPaid)}</span>
                        </div>
                        <div className="stat">
                          <span className="stat-label">Fees Delivery:</span>
                          <span className="stat-value">{formatCurrency(delivery.deliveryFeesPaid)}</span>
                        </div>
                        <div className="stat highlight">
                          <span className="stat-label">Total General:</span>
                          <span className="stat-value">{formatCurrency(delivery.totalPaid)}</span>
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
                <h2>📋 Ventas Totales</h2>
                <div className="orders-table-container">
                  <table className="orders-table">
                    <thead>
                      <tr>
                        <th>Orden</th>
                        <th>Fecha</th>
                        <th>Espacio</th>
                        <th>Cliente</th>
                        <th>Estado</th>
                        <th>Original</th>
                        <th>Final</th>
                        <th>Pagado</th>
                        <th>Fee Delivery</th>
                        <th>Pagos</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ordersData.map((order) => (
                        <tr key={order.id}>
                          <td>{order.orderNumber}</td>
                          <td>{formatDate(order.createdAt)}</td>
                          <td>{order.spaceCode}</td>
                          <td>{order.customerName || '-'}</td>
                          <td>
                            <span className={`status-badge status-${order.status.toLowerCase()}`}>
                              {order.status}
                            </span>
                          </td>
                          <td>{formatCurrency(order.originalTotal)}</td>
                          <td>{formatCurrency(order.finalTotal)}</td>
                          <td>{formatCurrency(order.paidTotal)}</td>
                          <td>{formatCurrency(order.deliveryFeeTotal)}</td>
                          <td>
                            <div className="payments-tooltip">
                              {order.payments.map((payment) => (
                                <div key={`${payment.method}-${payment.amount}`} className="payment-item">
                                  {payment.method}: {formatCurrency(payment.amount)}
                                  {payment.isDelivery && ' (Delivery)'}
                                </div>
                              ))}
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
