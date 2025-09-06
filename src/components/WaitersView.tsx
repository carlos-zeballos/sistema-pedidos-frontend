import React, { useState, useEffect } from 'react';
import { orderService, catalogService } from '../services/api';
import { Order, Product } from '../types';
import ComboCustomizationModal, { CustomizedCombo } from './ComboCustomizationModal';
import PaymentMethodModal from './PaymentMethodModal';
import './WaitersView.css';

const WaitersView: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<string[]>([]);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [combos, setCombos] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [selectedCombo, setSelectedCombo] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const [itemNotes, setItemNotes] = useState('');
  const [itemType, setItemType] = useState<'product' | 'combo'>('product');
  
  // Estado para el modal de personalización de combos
  const [comboModalOpen, setComboModalOpen] = useState(false);
  const [selectedComboForCustomization, setSelectedComboForCustomization] = useState<any>(null);
  
  // Estado para el modal de métodos de pago
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [orderToPay, setOrderToPay] = useState<Order | null>(null);

  useEffect(() => {
    loadOrders();
    loadProducts();
    const interval = setInterval(loadOrders, 15000); // Actualizar cada 15 segundos
    return () => clearInterval(interval);
  }, []);

  const loadOrders = async () => {
    try {
      const ordersData = await orderService.getOrders();
      setOrders(ordersData);
      
      // Verificar si hay órdenes listas para notificar
      const readyOrders = ordersData.filter((order: any) => order.status === 'LISTO');
      if (readyOrders.length > 0) {
        const newNotifications = readyOrders.map((order: any) => 
          `¡Orden #${order.orderNumber} está lista para recoger!`
        );
        setNotifications(prev => [...newNotifications, ...prev].slice(0, 5));
      }
    } catch (err: any) {
      setError(err.message || 'Error al cargar órdenes');
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async () => {
    try {
      const [productsData, combosData] = await Promise.all([
        catalogService.getProducts(),
        catalogService.getCombos()
      ]);
      setProducts(productsData || []);
      setCombos(combosData || []);
      console.log('📦 Productos cargados:', productsData?.length || 0);
      console.log('🍱 Combos cargados:', combosData?.length || 0);
    } catch (err: any) {
      console.error('Error loading products and combos:', err);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      await orderService.updateOrderStatus(orderId, newStatus as any);
      await loadOrders(); // Recargar órdenes
    } catch (err: any) {
      console.error('Error updating order status:', err);
      alert('Error al actualizar el estado de la orden');
    }
  };

  const deleteOrder = async (orderId: string) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta orden?')) {
      try {
        await orderService.deleteOrder(orderId);
        await loadOrders();
      } catch (err: any) {
        console.error('Error deleting order:', err);
        alert('Error al eliminar la orden');
      }
    }
  };

  const openUpdateModal = (order: Order) => {
    setSelectedOrder(order);
    setShowUpdateModal(true);
    setSelectedProduct('');
    setSelectedCombo('');
    setQuantity(1);
    setItemNotes('');
    setItemType('product');
  };

  const openPaymentModal = (order: Order) => {
    setOrderToPay(order);
    setPaymentModalOpen(true);
  };



  const closeUpdateModal = () => {
    setShowUpdateModal(false);
    setSelectedOrder(null);
  };

  // Función para manejar cuando se completa la personalización del combo
  const handleComboCustomized = async (customizedCombo: CustomizedCombo) => {
    try {
      // Validar que haya una orden seleccionada
      if (!selectedOrder) {
        console.error('❌ No hay orden seleccionada en handleComboCustomized');
        alert('Error: No hay orden seleccionada. Por favor, selecciona una orden primero.');
        setComboModalOpen(false);
        setSelectedComboForCustomization(null);
        return;
      }

      console.log('✅ Orden seleccionada:', selectedOrder.orderNumber);

      console.log('🍱 Combo personalizado:', customizedCombo);
      
      // Preparar el item del combo para agregar a la orden
      const comboItem = {
        productId: null,
        comboId: customizedCombo.combo.id,
        name: customizedCombo.combo.name,
        unitPrice: customizedCombo.combo.basePrice || customizedCombo.combo.price || 0,
        totalPrice: (customizedCombo.combo.basePrice || customizedCombo.combo.price || 0) * quantity,
        quantity: quantity,
        notes: JSON.stringify({
          selectedComponents: customizedCombo.selectedComponents,
          selectedSauces: customizedCombo.selectedSauces,
          itemNotes: itemNotes
        })
      };

      // Llamar al servicio para agregar el item a la orden
      await orderService.addItemsToOrder(selectedOrder.id, [comboItem]);
      
      alert(`✅ Combo personalizado agregado: ${customizedCombo.combo.name}`);
      
      // Cerrar ambos modales
      setComboModalOpen(false);
      setSelectedComboForCustomization(null);
      closeUpdateModal(); // Cerrar modal de actualización
      
      // Recargar órdenes
      await loadOrders();
    } catch (err: any) {
      console.error('Error adding customized combo:', err);
      alert('Error al agregar el combo personalizado: ' + (err.message || 'Error desconocido'));
    }
  };

  const addItemToOrder = async () => {
    if (!selectedOrder || quantity <= 0) {
      alert('Por favor completa todos los campos');
      return;
    }

    if (itemType === 'product' && !selectedProduct) {
      alert('Por favor selecciona un producto');
      return;
    }

    if (itemType === 'combo' && !selectedCombo) {
      alert('Por favor selecciona un combo');
      return;
    }

    try {
      if (itemType === 'product') {
        const product = products.find(p => p.id === selectedProduct);
        if (!product) {
          alert('Producto no encontrado');
          return;
        }

        // Para productos, agregar directamente a la orden
        const productItem = {
          productId: product.id,
          comboId: null,
          name: product.name,
          unitPrice: product.price || 0,
          totalPrice: (product.price || 0) * quantity,
          quantity: quantity,
          notes: itemNotes || null
        };

        await orderService.addItemsToOrder(selectedOrder.id, [productItem]);
        
        alert(`✅ Producto agregado: ${quantity}x ${product.name} - $${(product.price || 0).toFixed(2)}`);
        closeUpdateModal();
        await loadOrders();
      } else {
        // Para combos, abrir modal de personalización
        const combo = combos.find(c => c.id === selectedCombo);
        if (!combo) {
          alert('Combo no encontrado');
          return;
        }
        
        console.log('🍱 Abriendo modal de personalización para combo:', combo.name);
        console.log('📋 Orden seleccionada:', selectedOrder?.orderNumber);
        
        setSelectedComboForCustomization(combo);
        setComboModalOpen(true);
        // NO cerrar el modal de actualización aquí, solo ocultarlo
        // para mantener selectedOrder disponible
      }
    } catch (err: any) {
      console.error('Error adding item:', err);
      alert('Error al agregar el item: ' + (err.message || 'Error desconocido'));
    }
  };

  // Función para marcar orden como pagada y liberar mesa
  const markOrderAsPaid = async (order: Order) => {
    if (window.confirm(`¿Confirmar pago de la orden #${order.orderNumber}? Esto liberará la mesa ${order.space?.name}.`)) {
      try {
        // Cambiar estado de la orden a PAGADO
        await orderService.updateOrderStatus(order.id, 'PAGADO');
        
        // Implementar la liberación de la mesa
        // Por ahora, solo actualizamos el estado de la orden
        
        alert(`¡Orden #${order.orderNumber} marcada como pagada! Mesa ${order.space?.name} liberada.`);
        await loadOrders(); // Recargar órdenes
      } catch (err: any) {
        console.error('Error marking order as paid:', err);
        alert('Error al marcar la orden como pagada');
      }
    }
  };

  const closePaymentModal = () => {
    setPaymentModalOpen(false);
    setOrderToPay(null);
  };

  const handlePaymentComplete = async () => {
    // Recargar las órdenes después del pago
    await loadOrders();
    // Cerrar el modal
    closePaymentModal();
  };

  const formatTime = (dateString: string | Date) => {
    return new Date(dateString).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (dateString: string | Date) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getTimeElapsed = (dateString: string | Date) => {
    const now = new Date();
    const orderTime = new Date(dateString);
    const diffMs = now.getTime() - orderTime.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Recién creada';
    if (diffMins < 60) return `${diffMins} min`;
    
    const diffHours = Math.floor(diffMins / 60);
    return `${diffHours}h ${diffMins % 60}min`;
  };

  const formatItemNotes = (notes: string | undefined) => {
    if (!notes) return null;
    
    try {
      const notesData = JSON.parse(notes);
      const components = [];
      
      // Formatear componentes seleccionados
      if (notesData.selectedComponents) {
        Object.entries(notesData.selectedComponents).forEach(([type, comps]: [string, any]) => {
          if (Array.isArray(comps) && comps.length > 0) {
            const compNames = comps.map((comp: any) => comp.name || comp).join(', ');
            components.push(`${type}: ${compNames}`);
          }
        });
      }
      
      // Formatear salsas seleccionadas
      if (notesData.selectedSauces && notesData.selectedSauces.length > 0) {
        const sauceNames = notesData.selectedSauces.map((sauce: any) => sauce.name || sauce).join(', ');
        components.push(`Salsas: ${sauceNames}`);
      }
      
      // Agregar notas del item si existen
      if (notesData.itemNotes) {
        components.push(`Notas: ${notesData.itemNotes}`);
      }
      
      return components.length > 0 ? components.join(' • ') : null;
    } catch (error) {
      // Si no es JSON válido, mostrar como texto plano
      console.log('Error parsing notes JSON:', error);
      return notes;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDIENTE': return 'orange';
      case 'EN_PREPARACION': return 'blue';
      case 'LISTO': return 'green';
      case 'ENTREGADO': return 'purple';
      case 'PAGADO': return 'green';
      case 'CANCELADO': return 'red';
      default: return 'gray';
    }
  };

  const getStatusDisplayName = (status: string) => {
    switch (status) {
      case 'PENDIENTE': return 'Pendiente';
      case 'EN_PREPARACION': return 'En Preparación';
      case 'LISTO': return 'Listo para Recoger';
      case 'ENTREGADO': return 'Entregado';
      case 'PAGADO': return 'Pagado';
      case 'CANCELADO': return 'Cancelado';
      default: return status;
    }
  };

  const clearNotification = (index: number) => {
    setNotifications(prev => prev.filter((_, i) => i !== index));
  };



  if (loading) {
    return (
      <div className="waiters-container">
        <div className="loading">Cargando órdenes...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="waiters-container">
        <div className="error">Error: {error}</div>
      </div>
    );
  }

  const activeOrders = orders.filter(order => 
    ['PENDIENTE', 'EN_PREPARACION', 'LISTO', 'ENTREGADO'].includes(order.status)
  );
  const readyOrders = orders.filter(order => order.status === 'LISTO');
  const deliveredOrders = orders.filter(order => order.status === 'ENTREGADO');
  
  // Solo mostrar órdenes pagadas del día actual
  const today = new Date().toISOString().split('T')[0];
  const paidOrders = orders.filter(order => {
    if (order.status !== 'PAGADO') return false;
    const orderDate = new Date(order.createdAt).toISOString().split('T')[0];
    return orderDate === today;
  });

  return (
    <div className="waiters-container">
      <div className="waiters-header">
        <h1>👨‍💼 Vista de Mozos</h1>
        <p>Gestiona las órdenes de tus clientes</p>
        <button onClick={loadOrders} className="refresh-btn">
          🔄 Actualizar
        </button>
      </div>

      {/* Notificaciones */}
      {notifications.length > 0 && (
        <div className="notifications-section">
          <h2>🔔 Notificaciones</h2>
          <div className="notifications-list">
            {notifications.map((notification, index) => (
              <div key={`notification-${index}-${notification}`} className="notification-item">
                <span>{notification}</span>
                <button 
                  onClick={() => clearNotification(index)}
                  className="notification-close"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Estadísticas */}
      <div className="waiters-stats">
        <div className="stat-card">
          <span className="stat-number">{activeOrders.length}</span>
          <span className="stat-label">Activas</span>
        </div>
        <div className="stat-card urgent">
          <span className="stat-number">{readyOrders.length}</span>
          <span className="stat-label">Listas para Recoger</span>
        </div>
        <div className="stat-card">
          <span className="stat-number">{deliveredOrders.length}</span>
          <span className="stat-label">Entregadas</span>
        </div>
        <div className="stat-card">
          <span className="stat-number">{paidOrders.length}</span>
          <span className="stat-label">Pagadas</span>
        </div>
      </div>

      {/* Órdenes Listas para Recoger */}
      {readyOrders.length > 0 && (
        <div className="orders-section urgent-section">
          <h2>🚨 Órdenes Listas para Recoger ({readyOrders.length})</h2>
          <div className="orders-grid">
            {readyOrders.map(order => (
              <div key={order.id} className="order-card ready urgent">
                <div className="order-header">
                  <div className="order-info">
                    <h3>Orden #{order.orderNumber}</h3>
                    <p className="table-info">Espacio: {order.space?.name}</p>
                    <p className="customer-info">Cliente: {order.customerName}</p>
                    <p className="time-info">
                      {formatTime(order.createdAt)} ({getTimeElapsed(order.createdAt)})
                    </p>
                  </div>
                  <div className="order-status">
                    <span className={`status-badge ${getStatusColor(order.status)}`}>
                      {getStatusDisplayName(order.status)}
                    </span>
                  </div>
                </div>

                <div className="order-items">
                  {order.items?.map(item => (
                    <div key={item.id} className="order-item">
                      <div className="item-info">
                        <span className="item-quantity">{item.quantity}x</span>
                        <span className="item-name">{item.name}</span>
                        {formatItemNotes(item.notes) && (
                          <span className="item-notes">📝 {formatItemNotes(item.notes)}</span>
                        )}
                      </div>
                      <div className="item-price">
                        ${(item.totalPrice || 0).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>

                {order.notes && (
                  <div className="order-notes">
                    <p><strong>Notas:</strong> {order.notes}</p>
                  </div>
                )}

                <div className="order-total">
                  <strong>Total: ${(order.totalAmount || 0).toFixed(2)}</strong>
                </div>

                <div className="order-actions">
                  <button
                    onClick={() => updateOrderStatus(order.id, 'ENTREGADO')}
                    className="btn btn-success"
                  >
                    Recoger Pedido
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Órdenes Activas */}
      <div className="orders-section">
        <h2>📋 Órdenes Activas ({activeOrders.length})</h2>
        <div className="orders-grid">
          {activeOrders.map(order => (
            <div key={order.id} className={`order-card ${order.status.toLowerCase()}`}>
              <div className="order-header">
                <div className="order-info">
                  <h3>Orden #{order.orderNumber}</h3>
                  <p className="table-info">Espacio: {order.space?.name}</p>
                  <p className="customer-info">Cliente: {order.customerName}</p>
                  <p className="time-info">
                    {formatTime(order.createdAt)} ({getTimeElapsed(order.createdAt)})
                  </p>
                </div>
                <div className="order-status">
                  <span className={`status-badge ${getStatusColor(order.status)}`}>
                    {getStatusDisplayName(order.status)}
                  </span>
                </div>
              </div>

              <div className="order-items">
                {order.items?.map(item => (
                  <div key={item.id} className="order-item">
                    <div className="item-info">
                      <span className="item-quantity">{item.quantity}x</span>
                      <span className="item-name">{item.name}</span>
                      {formatItemNotes(item.notes) && (
                        <span className="item-notes">📝 {formatItemNotes(item.notes)}</span>
                      )}
                    </div>
                    <div className="item-price">
                      ${(item.totalPrice || 0).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>

              {order.notes && (
                <div className="order-notes">
                  <p><strong>Notas:</strong> {order.notes}</p>
                </div>
              )}

              <div className="order-total">
                <strong>Total: ${(order.totalAmount || 0).toFixed(2)}</strong>
              </div>

              <div className="order-actions">
                {order.status === 'ENTREGADO' && (
                  <button
                    onClick={() => openPaymentModal(order)}
                    className="btn btn-primary"
                  >
                    Marcar como Pagado
                  </button>
                )}
                {['PENDIENTE', 'EN_PREPARACION', 'LISTO', 'ENTREGADO'].includes(order.status) && (
                  <button
                    onClick={() => openUpdateModal(order)}
                    className="btn btn-info"
                  >
                    Actualizar Pedido
                  </button>
                )}
                {['PENDIENTE', 'EN_PREPARACION'].includes(order.status) && (
                  <button
                    onClick={() => updateOrderStatus(order.id, 'CANCELADO')}
                    className="btn btn-danger"
                  >
                    Cancelar Orden
                  </button>
                )}
                {order.status === 'PENDIENTE' && (
                  <button
                    onClick={() => deleteOrder(order.id)}
                    className="btn btn-danger"
                  >
                    Eliminar
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Órdenes Pagadas del Día */}
      {paidOrders.length > 0 && (
        <div className="orders-section">
          <h2>💰 Órdenes Pagadas Hoy ({paidOrders.length})</h2>
          <div className="orders-grid">
            {paidOrders.map(order => (
              <div key={order.id} className="order-card paid">
                <div className="order-header">
                  <div className="order-info">
                    <h3>Orden #{order.orderNumber}</h3>
                    <p className="table-info">Espacio: {order.space?.name}</p>
                    <p className="customer-info">Cliente: {order.customerName}</p>
                    <p className="time-info">
                      {formatDate(order.createdAt)} - {formatTime(order.createdAt)}
                    </p>
                  </div>
                  <div className="order-status">
                    <span className={`status-badge ${getStatusColor(order.status)}`}>
                      {getStatusDisplayName(order.status)}
                    </span>
                  </div>
                </div>

                <div className="order-items">
                  {order.items?.map(item => (
                    <div key={item.id} className="order-item">
                      <div className="item-info">
                        <span className="item-quantity">{item.quantity}x</span>
                        <span className="item-name">{item.name}</span>
                      </div>
                      <div className="item-price">
                        ${(item.totalPrice || 0).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="order-total">
                  <strong>Total: ${(order.totalAmount || 0).toFixed(2)}</strong>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal para actualizar pedido */}
      {showUpdateModal && selectedOrder && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Actualizar Pedido #{selectedOrder.orderNumber}</h3>
              <button onClick={closeUpdateModal} className="modal-close">✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Tipo de Item:</label>
                <select 
                  value={itemType} 
                  onChange={(e) => {
                    setItemType(e.target.value as 'product' | 'combo');
                    setSelectedProduct('');
                    setSelectedCombo('');
                  }}
                  className="form-control"
                >
                  <option value="product">Producto Individual</option>
                  <option value="combo">Combo</option>
                </select>
              </div>

              {itemType === 'product' ? (
                <div className="form-group">
                  <label>Producto:</label>
                  <select 
                    value={selectedProduct} 
                    onChange={(e) => setSelectedProduct(e.target.value)}
                    className="form-control"
                  >
                    <option value="">Selecciona un producto</option>
                    {products.map(product => (
                      <option key={product.id} value={product.id}>
                        {product.name} - ${product.price || 0}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="form-group">
                  <label>Combo:</label>
                  <select 
                    value={selectedCombo} 
                    onChange={(e) => setSelectedCombo(e.target.value)}
                    className="form-control"
                  >
                    <option value="">Selecciona un combo</option>
                    {combos.map(combo => (
                      <option key={combo.id} value={combo.id}>
                        {combo.name} - ${combo.basePrice || combo.price || 0}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div className="form-group">
                <label>Cantidad:</label>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                  className="form-control"
                />
              </div>
              <div className="form-group">
                <label>Notas:</label>
                <textarea
                  value={itemNotes}
                  onChange={(e) => setItemNotes(e.target.value)}
                  className="form-control"
                  placeholder="Notas especiales para este item..."
                />
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={closeUpdateModal} className="btn btn-secondary">
                Cancelar
              </button>
              <button onClick={addItemToOrder} className="btn btn-primary">
                Agregar Item
              </button>
            </div>
          </div>
        </div>
      )}

      {orders.length === 0 && (
        <div className="no-orders">
          <p>🎉 ¡No hay órdenes en el sistema!</p>
          <p>Comienza creando una nueva orden</p>
        </div>
      )}

      {/* Modal de personalización de combos */}
      <ComboCustomizationModal
        combo={selectedComboForCustomization}
        isOpen={comboModalOpen}
        onClose={() => {
          setComboModalOpen(false);
          setSelectedComboForCustomization(null);
          // NO cerrar el modal de actualización aquí
        }}
        onAddToCart={handleComboCustomized}
      />

      {/* Modal de métodos de pago */}
      {orderToPay && (
        <PaymentMethodModal
          isOpen={paymentModalOpen}
          onClose={closePaymentModal}
          onPaymentComplete={handlePaymentComplete}
          order={orderToPay}
        />
      )}
    </div>
  );
};

export default WaitersView;
