import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { orderService, catalogService, tableService } from '../services/api';
import { Product, Category, Space } from '../types';
import './TestOrderCreation.css';

interface CartItem {
  product: Product;
  quantity: number;
  notes: string;
}

const TestOrderCreation: React.FC = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSpace, setSelectedSpace] = useState<Space | null>(null);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  const [selectedItems, setSelectedItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [productsData, categoriesData, spacesData] = await Promise.all([
        catalogService.getProducts(),
        catalogService.getCategories(),
        tableService.getSpaces()
      ]);
      setProducts(productsData);
      setCategories(categoriesData);
      setSpaces(spacesData);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const filteredProducts = selectedCategory
    ? products.filter(p => p.categoryId === selectedCategory)
    : products;

  const addToCart = (product: Product) => {
    const existingItem = selectedItems.find(item => item.product.id === product.id);
    if (existingItem) {
      setSelectedItems(selectedItems.map(item =>
        item.product.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setSelectedItems([...selectedItems, { product, quantity: 1, notes: '' }]);
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

  const updateItemNotes = (productId: string, notes: string) => {
    setSelectedItems(selectedItems.map(item =>
      item.product.id === productId
        ? { ...item, notes }
        : item
    ));
  };

  const getTotalAmount = () => {
    return selectedItems.reduce((total, item) => {
      return total + (item.product.price * item.quantity);
    }, 0);
  };

  const handleCreateOrder = async () => {
    if (!selectedSpace) {
      alert('Por favor selecciona una mesa');
      return;
    }
    if (selectedItems.length === 0) {
      alert('Por favor agrega al menos un item a la orden');
      return;
    }
    if (!customerName.trim()) {
      alert('Por favor ingresa el nombre del cliente');
      return;
    }

    // Check for existing active orders on the selected table
    try {
      const existingOrders = await orderService.getOrders();
      const activeOrderForSpace = existingOrders.find((order: any) =>
        order.spaceId === selectedSpace.id &&
        ['PENDIENTE', 'EN_PREPARACION', 'LISTO', 'ENTREGADO'].includes(order.status)
      );
      if (activeOrderForSpace) {
        alert(`La mesa ${selectedSpace.name} ya tiene un pedido activo (Orden #${activeOrderForSpace.orderNumber}). No se puede crear otro pedido.`);
        return;
      }
    } catch (err: any) {
      console.error('Error checking existing orders:', err);
    }

    setLoading(true);
    try {
      const orderData = {
        spaceId: selectedSpace.id,
        customerName: customerName,
        customerPhone: customerPhone,
        notes: orderNotes,
        items: selectedItems.map(item => ({
          productId: item.product.id,
          name: item.product.name,
          unitPrice: item.product.price,
          totalPrice: item.product.price * item.quantity,
          quantity: item.quantity,
          notes: item.notes,
          status: 'PENDIENTE'
        }))
      };

      await orderService.createOrder(orderData);
      
      // Reset form
      setSelectedSpace(null);
      setSelectedItems([]);
      setCustomerName('');
      setCustomerPhone('');
      setOrderNotes('');
      setSelectedCategory(null);

      // Navigate to kitchen view
      navigate('/kitchen');
    } catch (error: any) {
      console.error('Error creating order:', error);
      alert('Error al crear la orden: ' + (error.message || 'Error desconocido'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="test-order-creation">
      <div className="order-form">
        <h2>🧪 Test - Crear Nueva Orden</h2>
        
        {/* Space Selection */}
        <div className="form-section">
          <h3>Seleccionar Mesa</h3>
          <div className="spaces-grid">
            {spaces.map(space => (
              <button
                key={space.id}
                className={`space-btn ${selectedSpace?.id === space.id ? 'selected' : ''}`}
                onClick={() => setSelectedSpace(space)}
              >
                {space.name}
              </button>
            ))}
          </div>
        </div>

        {/* Customer Information */}
        <div className="form-section">
          <h3>Información del Cliente</h3>
          <div className="form-row">
            <input
              type="text"
              placeholder="Nombre del cliente"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="form-input"
            />
            <input
              type="text"
              placeholder="Teléfono (opcional)"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              className="form-input"
            />
          </div>
          <textarea
            placeholder="Notas de la orden (opcional)"
            value={orderNotes}
            onChange={(e) => setOrderNotes(e.target.value)}
            className="form-textarea"
          />
        </div>

        {/* Product Selection */}
        <div className="form-section">
          <h3>Seleccionar Productos</h3>
          
          {/* Category Filter */}
          <div className="category-filter">
            <button
              className={`category-btn ${!selectedCategory ? 'active' : ''}`}
              onClick={() => setSelectedCategory(null)}
            >
              Todos
            </button>
            {categories.map(category => (
              <button
                key={category.id}
                className={`category-btn ${selectedCategory === category.id ? 'active' : ''}`}
                onClick={() => setSelectedCategory(category.id)}
              >
                {category.name}
              </button>
            ))}
          </div>

          {/* Products Grid */}
          <div className="products-grid">
            {filteredProducts.map(product => (
              <div key={product.id} className="product-card">
                <div className="product-info">
                  <h4>{product.name}</h4>
                  <p className="product-description">{product.description}</p>
                  <p className="product-price">${(product.price || 0).toFixed(2)}</p>
                </div>
                <button
                  className="add-to-cart-btn"
                  onClick={() => addToCart(product)}
                  disabled={!product.isAvailable}
                >
                  {product.isAvailable ? '➕ Agregar' : 'No disponible'}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Cart */}
        {selectedItems.length > 0 && (
          <div className="form-section">
            <h3>Carrito de Compras</h3>
            <div className="cart-items">
              {selectedItems.map(item => (
                <div key={item.product.id} className="cart-item">
                  <div className="item-info">
                    <h4>{item.product.name}</h4>
                    <p className="item-price">${(item.product.price || 0).toFixed(2)} c/u</p>
                  </div>
                  <div className="item-controls">
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateQuantity(item.product.id, parseInt(e.target.value) || 0)}
                      className="quantity-input"
                    />
                    <textarea
                      placeholder="Notas del item"
                      value={item.notes}
                      onChange={(e) => updateItemNotes(item.product.id, e.target.value)}
                      className="item-notes"
                    />
                    <button
                      onClick={() => removeFromCart(item.product.id)}
                      className="remove-btn"
                    >
                      ❌
                    </button>
                  </div>
                  <div className="item-total">
                    Total: ${((item.product.price || 0) * item.quantity).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
            <div className="cart-total">
              <h3>Total de la Orden: ${getTotalAmount().toFixed(2)}</h3>
            </div>
          </div>
        )}

        {/* Create Order Button */}
        <div className="form-actions">
          <button
            onClick={handleCreateOrder}
            disabled={loading || !selectedSpace || selectedItems.length === 0}
            className="create-order-btn"
          >
            {loading ? 'Creando Orden...' : 'Crear Orden'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TestOrderCreation;
