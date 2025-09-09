import React, { useState, useEffect, useCallback } from 'react';
import { orderService } from '../services/api';
import { Order } from '../types';
import './OrdersManagement.css';

const OrdersManagement: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('date');
  const [updating, setUpdating] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const ordersData = await orderService.getOrders();
      setOrders(ordersData);
    } catch (error: any) {
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortOrders = useCallback(() => {
    let filtered = [...orders];

    // Filtrar por búsqueda
    if (searchTerm) {
      filtered = filtered.filter(order =>
        order.id.toString().includes(searchTerm) ||
        order.orderNumber.includes(searchTerm) ||
        order.space?.name?.includes(searchTerm) ||
        order.customerName?.includes(searchTerm)
      );
    }

    // Filtrar por estado
    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    // Ordenar
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'status':
          return a.status.localeCompare(b.status);
        case 'total':
          return b.totalAmount - a.totalAmount;
        default:
          return 0;
      }
    });

    setFilteredOrders(filtered);
  }, [orders, searchTerm, statusFilter, sortBy]);

  useEffect(() => {
    loadOrders();
  }, []);

  useEffect(() => {
    filterAndSortOrders();
  }, [filterAndSortOrders]);

  const updateOrderStatus = async (orderId: string, newStatus: Order['status']) => {
    setUpdating(orderId);
    try {
      await orderService.updateOrderStatus(orderId, newStatus);
      await loadOrders();
    } catch (error: any) {
      console.error('Error updating order status:', error);
      alert('Error al actualizar el estado de la orden');
    } finally {
      setUpdating(null);
    }
  };

  const deleteOrder = async (orderId: string) => {
    setUpdating(orderId);
    try {
      await orderService.deleteOrder(orderId);
      await loadOrders();
      setShowDeleteModal(false);
      setOrderToDelete(null);
      alert('Pedido eliminado exitosamente');
    } catch (error: any) {
      console.error('Error deleting order:', error);
      alert('Error al eliminar el pedido');
    } finally {
      setUpdating(null);
    }
  };

  const confirmDeleteOrder = (order: Order) => {
    setOrderToDelete(order);
    setShowDeleteModal(true);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'PENDIENTE': return '#ff9800';
      case 'EN_PREPARACION': return '#2196f3';
      case 'LISTO': return '#4caf50';
      case 'ENTREGADO': return '#9e9e9e';
      case 'CANCELADO': return '#f44336';
      default: return '#666';
    }
  };

  const getStatusText = (status: Order['status']) => {
    switch (status) {
      case 'PENDIENTE': return 'Pendiente';
      case 'EN_PREPARACION': return 'Preparando';
      case 'LISTO': return 'Listo';
      case 'ENTREGADO': return 'Entregado';
      case 'CANCELADO': return 'Cancelado';
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="orders-management-container">
        <div className="loading">Cargando órdenes...</div>
      </div>
    );
  }

  return (
    <div className="orders-management-container">
      <div className="orders-header">
        <h1>📋 Gestión de Órdenes</h1>
        <p>Administra todas las órdenes del restaurante</p>
      </div>

      {/* Estadísticas */}
      <div className="stats-section">
        <div className="stat-card">
          <span className="stat-number">{orders.length}</span>
          <span className="stat-label">Total</span>
        </div>
        <div className="stat-card">
          <span className="stat-number">
            {orders.filter(o => o.status === 'PENDIENTE' || o.status === 'EN_PREPARACION').length}
          </span>
          <span className="stat-label">Activas</span>
        </div>
        <div className="stat-card">
          <span className="stat-number">
            ${orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0).toFixed(2)}
          </span>
          <span className="stat-label">Total Ventas</span>
        </div>
      </div>

      {/* Filtros y Búsqueda */}
      <div className="filters-section">
        <div className="search-box">
          <input
            type="text"
            placeholder="Buscar por número de orden, espacio o cliente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="filter-controls">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">Todos los estados</option>
            <option value="PENDIENTE">Pendiente</option>
            <option value="EN_PREPARACION">En Preparación</option>
            <option value="LISTO">Listo</option>
            <option value="ENTREGADO">Entregado</option>
            <option value="CANCELADO">Cancelado</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="sort-select"
          >
            <option value="date">Ordenar por fecha</option>
            <option value="status">Ordenar por estado</option>
            <option value="total">Ordenar por total</option>
          </select>
        </div>
      </div>

      {/* Tabla de Órdenes */}
      <div className="orders-table">
        <div className="table-header">
          <div className="table-cell">Orden</div>
          <div className="table-cell">Espacio</div>
          <div className="table-cell">Cliente</div>
          <div className="table-cell">Items</div>
          <div className="table-cell">Total</div>
          <div className="table-cell">Estado</div>
          <div className="table-cell">Fecha</div>
          <div className="table-cell">Acciones</div>
        </div>

        {filteredOrders.length === 0 ? (
          <div className="no-orders">
            <p>No se encontraron órdenes que coincidan con los filtros.</p>
          </div>
        ) : (
          filteredOrders.map(order => (
            <div key={order.id} className="table-row">
              <div className="table-cell order-number">
                #{order.orderNumber}
              </div>

              <div className="table-cell space-info">
                {order.space?.name || 'N/A'}
              </div>

              <div className="table-cell customer-info">
                {order.customerName || 'Cliente'}
                                  {order.customerPhone && (
                    <div className="customer-phone">{order.customerPhone}</div>
                  )}
              </div>

              <div className="table-cell order-items">
                <div className="items-preview">
                  {order.items && order.items.slice(0, 2).map((item, index) => (
                    <span key={index} className="item-tag">
                      {item.quantity}x {item.name}
                    </span>
                  ))}
                  {order.items && order.items.length > 2 && (
                    <span className="more-items">
                      +{order.items.length - 2} más
                    </span>
                  )}
                </div>
                <button 
                  className="view-details-btn"
                  onClick={() => setSelectedOrder(order)}
                  title="Ver detalles completos"
                >
                  👁️ Ver Detalles
                </button>
              </div>

              <div className="table-cell order-total">
                <strong>${(order.totalAmount || 0).toFixed(2)}</strong>
              </div>

              <div className="table-cell order-status">
                <span 
                  className="status-badge"
                  style={{ backgroundColor: getStatusColor(order.status) }}
                >
                  {getStatusText(order.status)}
                </span>
              </div>

              <div className="table-cell order-date">
                {formatDate(order.createdAt)}
              </div>

              <div className="table-cell order-actions">
                <div className="action-buttons">
                  {order.status === 'PENDIENTE' && (
                    <button
                      className="action-btn start-btn"
                      onClick={() => updateOrderStatus(order.id, 'EN_PREPARACION')}
                      disabled={updating === order.id}
                      title="Comenzar preparación"
                    >
                      ▶️
                    </button>
                  )}

                  {order.status === 'EN_PREPARACION' && (
                    <button
                      className="action-btn ready-btn"
                      onClick={() => updateOrderStatus(order.id, 'LISTO')}
                      disabled={updating === order.id}
                      title="Marcar como listo"
                    >
                      ✅
                    </button>
                  )}

                  {order.status === 'LISTO' && (
                    <button
                      className="action-btn deliver-btn"
                      onClick={() => updateOrderStatus(order.id, 'ENTREGADO')}
                      disabled={updating === order.id}
                      title="Marcar como entregado"
                    >
                      🚚
                    </button>
                  )}

                  {/* Botón de eliminar - solo para pedidos pendientes o cancelados */}
                  {(order.status === 'PENDIENTE' || order.status === 'CANCELADO') && (
                    <button
                      className="action-btn delete-btn"
                      onClick={() => confirmDeleteOrder(order)}
                      disabled={updating === order.id}
                      title="Eliminar pedido permanentemente"
                    >
                      🗑️
                    </button>
                  )}

                  {order.status !== 'ENTREGADO' && order.status !== 'CANCELADO' && (
                    <button
                      className="action-btn cancel-btn"
                      onClick={() => updateOrderStatus(order.id, 'CANCELADO')}
                      disabled={updating === order.id}
                      title="Cancelar orden"
                    >
                      ❌
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal de detalles de pedido */}
      {selectedOrder && (
        <div className="modal-overlay" onClick={() => setSelectedOrder(null)}>
          <div className="modal-content order-details-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>📋 Detalles del Pedido #{selectedOrder.orderNumber}</h2>
              <button className="close-btn" onClick={() => setSelectedOrder(null)}>×</button>
            </div>
            
            <div className="modal-body">
              <div className="order-info-grid">
                <div className="info-section">
                  <h3>📊 Información General</h3>
                  <div className="info-item">
                    <span className="label">Número de Orden:</span>
                    <span className="value">#{selectedOrder.orderNumber}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Espacio:</span>
                    <span className="value">{selectedOrder.space?.name || 'N/A'}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Cliente:</span>
                    <span className="value">{selectedOrder.customerName || 'Cliente'}</span>
                  </div>
                  {selectedOrder.customerPhone && (
                    <div className="info-item">
                      <span className="label">Teléfono:</span>
                      <span className="value">{selectedOrder.customerPhone}</span>
                    </div>
                  )}
                  <div className="info-item">
                    <span className="label">Estado:</span>
                    <span className="value">
                      <span 
                        className="status-badge"
                        style={{ backgroundColor: getStatusColor(selectedOrder.status) }}
                      >
                        {getStatusText(selectedOrder.status)}
                      </span>
                    </span>
                  </div>
                  <div className="info-item">
                    <span className="label">Fecha:</span>
                    <span className="value">{formatDate(selectedOrder.createdAt)}</span>
                  </div>
                </div>

                <div className="info-section">
                  <h3>💰 Información Financiera</h3>
                  <div className="info-item">
                    <span className="label">Total Original:</span>
                    <span className="value">S/ {(selectedOrder.items?.reduce((total, item) => total + (item.totalprice || 0), 0) || 0).toFixed(2)}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Total Actual:</span>
                    <span className="value">S/ {(selectedOrder.totalAmount || 0).toFixed(2)}</span>
                  </div>
                  {selectedOrder.notes && (
                    <div className="info-item">
                      <span className="label">Notas:</span>
                      <span className="value">{selectedOrder.notes}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="items-section">
                <h3>🍽️ Items del Pedido</h3>
                <div className="items-table">
                  <div className="items-header">
                    <div className="item-cell">Item</div>
                    <div className="item-cell">Cantidad</div>
                    <div className="item-cell">Precio Unit.</div>
                    <div className="item-cell">Total</div>
                  </div>
                  {selectedOrder.items?.map((item, index) => (
                    <div key={index} className="items-row">
                      <div className="item-cell item-name">
                        {item.name}
                        {item.notes && (
                          <div className="item-notes">
                            {(() => {
                              try {
                                const notesData = JSON.parse(item.notes);
                                if (notesData.selectedComponents) {
                                  return Object.entries(notesData.selectedComponents).map(([type, components]) => (
                                    <div key={type} className="component-detail">
                                      <strong>{type}:</strong> {Array.isArray(components) 
                                        ? components.map((comp: any) => comp.name || comp).join(', ')
                                        : String(components)
                                      }
                                    </div>
                                  ));
                                }
                                return item.notes;
                              } catch {
                                return item.notes;
                              }
                            })()}
                          </div>
                        )}
                      </div>
                      <div className="item-cell">{item.quantity}</div>
                      <div className="item-cell">S/ {(item.unitprice || 0).toFixed(2)}</div>
                      <div className="item-cell">S/ {(item.totalprice || 0).toFixed(2)}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmación de eliminación */}
      {showDeleteModal && orderToDelete && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal-content delete-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>⚠️ Confirmar Eliminación</h2>
              <button className="close-btn" onClick={() => setShowDeleteModal(false)}>×</button>
            </div>
            
            <div className="modal-body">
              <p>¿Estás seguro de que deseas eliminar permanentemente el pedido <strong>#{orderToDelete.orderNumber}</strong>?</p>
              <p className="warning-text">Esta acción no se puede deshacer.</p>
              
              <div className="modal-actions">
                <button 
                  className="btn btn-secondary" 
                  onClick={() => setShowDeleteModal(false)}
                >
                  Cancelar
                </button>
                <button 
                  className="btn btn-danger" 
                  onClick={() => deleteOrder(orderToDelete.id)}
                  disabled={updating === orderToDelete.id}
                >
                  {updating === orderToDelete.id ? 'Eliminando...' : 'Eliminar Permanentemente'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrdersManagement;
