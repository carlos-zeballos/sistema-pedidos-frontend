import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { catalogService, orderService } from '../services/api';
import { Product, Space } from '../types';
import './UltraSimpleOrderCreation.css';

interface CartItem {
  product: Product;
  quantity: number;
}

const UltraSimpleOrderCreation: React.FC = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedSpace, setSelectedSpace] = useState<string>('');
  const [customerName, setCustomerName] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [productsData, spacesData] = await Promise.all([
        catalogService.getProducts(),
        catalogService.getSpaces()
      ]);
      setProducts(productsData || []);
      setSpaces(spacesData || []);
    } catch (err: any) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (product: Product) => {
    const existingItem = cart.find(item => item.product.id === product.id);
    if (existingItem) {
      setCart(cart.map(item =>
        item.product.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, { product, quantity: 1 }]);
    }
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.product.id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart(cart.map(item =>
      item.product.id === productId
        ? { ...item, quantity }
        : item
    ));
  };

  const getTotalAmount = () => {
    return cart.reduce((total, item) => {
      return total + (item.product.price * item.quantity);
    }, 0);
  };

  const createOrder = async () => {
    if (!selectedSpace) {
      alert('Selecciona una mesa');
      return;
    }
    if (cart.length === 0) {
      alert('Agrega al menos un producto');
      return;
    }
    if (!customerName.trim()) {
      alert('Ingresa el nombre del cliente');
      return;
    }

    setSubmitting(true);
    try {
      const orderData = {
        spaceId: selectedSpace,
        customerName: customerName.trim(),
        items: cart.map(item => ({
          productId: item.product.id,
          quantity: item.quantity
        }))
      };

      await orderService.createOrder(orderData);
      
      // Limpiar formulario
      setSelectedSpace('');
      setCustomerName('');
      setCart([]);
      
      alert('¡Orden creada exitosamente!');
      navigate('/waiters');
    } catch (err: any) {
      alert('Error al crear la orden: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="loading">Cargando...</div>;
  }

  return (
    <div className="ultra-simple-order-creation">
      <div className="header">
        <h1>🍽️ Crear Orden</h1>
        <button 
          className="back-btn"
          onClick={() => navigate('/waiters')}
        >
          ← Volver
        </button>
      </div>

      <div className="order-form">
        {/* Información básica */}
        <div className="basic-info">
          <div className="form-group">
            <label htmlFor="space-select">Mesa:</label>
            <select 
              id="space-select"
              value={selectedSpace} 
              onChange={(e) => setSelectedSpace(e.target.value)}
              className="form-input"
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
              className="form-input"
            />
          </div>
        </div>

        {/* Productos */}
        <div className="products-section">
          <h2>Productos</h2>
          <div className="products-grid">
            {products.map(product => (
              <div key={product.id} className="product-card">
                <div className="product-info">
                  <h3>{product.name}</h3>
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

        {/* Carrito */}
        {cart.length > 0 && (
          <div className="cart-section">
            <h2>Carrito</h2>
            <div className="cart-items">
              {cart.map(item => (
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
          </div>
        )}

        {/* Botón de crear */}
        <div className="create-section">
          <button 
            className="create-btn"
            onClick={createOrder}
            disabled={submitting || !selectedSpace || cart.length === 0 || !customerName.trim()}
          >
            {submitting ? 'Creando...' : 'Crear Orden'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UltraSimpleOrderCreation;
