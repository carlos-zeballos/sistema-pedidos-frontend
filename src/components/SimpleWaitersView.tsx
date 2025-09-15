import React, { useState, useEffect } from 'react';
import { orderService, catalogService } from '../services/api';
import { Product, Space } from '../types';
import './SimpleWaitersView.css';

interface SimpleOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  spaceName: string;
  status: 'PENDIENTE' | 'EN_PREPARACION' | 'LISTO' | 'PAGADO' | 'CANCELADO';
  totalAmount: number;
  items: Array<{
    name: string;
    quantity: number;
    notes?: string;
  }>;
  createdAt: string;
}

const SimpleWaitersView: React.FC = () => {
  const [orders, setOrders] = useState<SimpleOrder[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSpace, setSelectedSpace] = useState<string>('');
  const [customerName, setCustomerName] = useState('');
  const [selectedItems, setSelectedItems] = useState<Array<{product: Product, quantity: number}>>([]);
  const [showCreateOrder, setShowCreateOrder] = useState(false);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000); // Actualizar cada 5 segundos
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const [ordersData, productsData, spacesData] = await Promise.all([
        orderService.getOrders('PENDIENTE,EN_PREPARACION,LISTO'),
        catalogService.getProducts(),
        catalogService.getSpaces()
      ]);
      
      // Simplificar órdenes para mostrar solo lo esencial
      const simplifiedOrders = ordersData.map((order: any) => ({
        id: order.id,
        orderNumber: order.orderNumber,
        customerName: order.customerName || 'Sin nombre',
        spaceName: order.space?.name || 'Sin mesa',
        status: order.status,
        totalAmount: order.totalAmount || 0,
        items: order.items?.map((item: any) => ({
          name: item.product?.name || 'Producto',
          quantity: item.quantity || 1,
          notes: item.notes || ''
        })) || [],
        createdAt: order.createdAt
      }));

      setOrders(simplifiedOrders);
      setProducts(productsData || []);
      setSpaces(spacesData || []);
    } catch (err: any) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (product: Product) => {
    const existingItem = selectedItems.find(item => item.product.id === product.id);
    if (existingItem) {
      setSelectedItems(selectedItems.map(item =>
        item.product.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setSelectedItems([...selectedItems, { product, quantity: 1 }]);
    }
  };

  const removeFromCart = (productId: string) => {
    setSelectedItems(selectedItems.filter(item => item.product.id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setSelectedItems(selectedItems.map(item =>
      item.product.id === productId
        ? { ...item, quantity }
        : item
    ));
  };

  const getTotalAmount = () => {
    return selectedItems.reduce((total, item) => {
      return total + (item.product.price * item.quantity);
    }, 0);
  };

  const createOrder = async () => {
    if (!selectedSpace) {
      alert('Selecciona una mesa');
      return;
    }
    if (selectedItems.length === 0) {
      alert('Agrega al menos un producto');
      return;
    }
    if (!customerName.trim()) {
      alert('Ingresa el nombre del cliente');
      return;
    }

    try {
      const orderData = {
        spaceId: selectedSpace,
        customerName: customerName.trim(),
        items: selectedItems.map(item => ({
          productId: item.product.id,
          quantity: item.quantity
        }))
      };

      await orderService.createOrder(orderData);
      
      // Limpiar formulario
      setSelectedSpace('');
      setCustomerName('');
      setSelectedItems([]);
      setShowCreateOrder(false);
      
      // Recargar datos
      loadData();
      
      alert('¡Orden creada exitosamente!');
    } catch (err: any) {
      alert('Error al crear la orden: ' + err.message);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      await orderService.updateOrderStatus(orderId, { status: newStatus });
      loadData();
    } catch (err: any) {
      alert('Error al actualizar estado: ' + err.message);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDIENTE': return '#ff9800';
      case 'EN_PREPARACION': return '#2196f3';
      case 'LISTO': return '#4caf50';
      case 'PAGADO': return '#9c27b0';
      case 'CANCELADO': return '#f44336';
      default: return '#666';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PENDIENTE': return 'Pendiente';
      case 'EN_PREPARACION': return 'En Cocina';
      case 'LISTO': return 'Listo';
      case 'PAGADO': return 'Pagado';
      case 'CANCELADO': return 'Cancelado';
      default: return status;
    }
  };

  if (loading) {
    return <div className="loading">Cargando...</div>;
  }

  return (
    <div className="simple-waiters-view">
      <div className="header">
        <h1>🍽️ Vista de Mozos</h1>
        <button 
          className="create-order-btn"
          onClick={() => setShowCreateOrder(!showCreateOrder)}
        >
          {showCreateOrder ? 'Cancelar' : '+ Nueva Orden'}
        </button>
      </div>

      {/* Formulario de creación de orden */}
      {showCreateOrder && (
        <div className="create-order-form">
          <h2>Crear Nueva Orden</h2>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="space-select">Mesa:</label>
              <select 
                id="space-select"
                value={selectedSpace} 
                onChange={(e) => setSelectedSpace(e.target.value)}
              >
                <option value="">Seleccionar mesa</option>
                {spaces.map(space => (
                  <option key={space.id} value={space.id}>
                    {space.name} ({space.type})
                  </option>
                ))}
              </select>
            </div>
            
            <div className="form-group">
              <label htmlFor="customer-input">Cliente:</label>
              <input
                id="customer-input"
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Nombre del cliente"
              />
            </div>
          </div>

          <div className="products-section">
            <h3>Productos</h3>
            <div className="products-grid">
              {products.map(product => (
                <div key={product.id} className="product-card">
                  <div className="product-info">
                    <h4>{product.name}</h4>
                    <p className="price">S/ {product.price}</p>
                  </div>
                  <button 
                    className="add-btn"
                    onClick={() => addToCart(product)}
                  >
                    +
                  </button>
                </div>
              ))}
            </div>
          </div>

          {selectedItems.length > 0 && (
            <div className="cart-section">
              <h3>Carrito</h3>
              <div className="cart-items">
                {selectedItems.map(item => (
                  <div key={item.product.id} className="cart-item">
                    <span className="item-name">{item.product.name}</span>
                    <div className="quantity-controls">
                      <button onClick={() => updateQuantity(item.product.id, item.quantity - 1)}>-</button>
                      <span>{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.product.id, item.quantity + 1)}>+</button>
                    </div>
                    <span className="item-total">S/ {item.product.price * item.quantity}</span>
                    <button 
                      className="remove-btn"
                      onClick={() => removeFromCart(item.product.id)}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
              <div className="cart-total">
                <strong>Total: S/ {getTotalAmount()}</strong>
              </div>
              <button className="create-btn" onClick={createOrder}>
                Crear Orden
              </button>
            </div>
          )}
        </div>
      )}

      {/* Lista de órdenes */}
      <div className="orders-section">
        <h2>Órdenes Activas ({orders.length})</h2>
        <div className="orders-list">
          {orders.map(order => (
            <div key={order.id} className="order-card">
              <div className="order-header">
                <div className="order-info">
                  <h3>#{order.orderNumber}</h3>
                  <p className="customer">{order.customerName}</p>
                  <p className="space">{order.spaceName}</p>
                </div>
                <div className="order-status">
                  <span 
                    className="status-badge"
                    style={{ backgroundColor: getStatusColor(order.status) }}
                  >
                    {getStatusText(order.status)}
                  </span>
                  <p className="total">S/ {order.totalAmount}</p>
                </div>
              </div>
              
              <div className="order-items">
                {order.items.map((item, itemIndex) => (
                  <div key={`${order.id}-item-${itemIndex}`} className="order-item">
                    <span className="item-name">{item.name}</span>
                    <span className="item-quantity">x{item.quantity}</span>
                    {item.notes && <span className="item-notes">({item.notes})</span>}
                  </div>
                ))}
              </div>

              <div className="order-actions">
                {order.status === 'PENDIENTE' && (
                  <button 
                    className="action-btn"
                    onClick={() => updateOrderStatus(order.id, 'EN_PREPARACION')}
                  >
                    Enviar a Cocina
                  </button>
                )}
                {order.status === 'LISTO' && (
                  <button 
                    className="action-btn ready"
                    onClick={() => updateOrderStatus(order.id, 'PAGADO')}
                  >
                    Marcar como Pagado
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SimpleWaitersView;
