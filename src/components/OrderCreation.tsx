import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { catalogService, tableService, orderService, authService } from '../services/api';
import { Product, Category, Space } from '../types';
import ComboCustomizationModal, { CustomizedCombo } from './ComboCustomizationModal';
import './OrderCreation.css';

// Salsas disponibles
const AVAILABLE_SAUCES = [
  'ACEVICHADA',
  'TARE',
  'SOJU GARY',
  'WASABI',
  'SUPAI',
  'LONCCA',
  'MARACUYA'
];

// Tipo unificado para productos y combos
interface ProductOrCombo {
  id: string;
  name: string;
  description?: string;
  price?: number;
  basePrice?: number;
  isAvailable?: boolean;
  categoryId?: string;
  ComboComponent?: any[];
}

// Función helper para obtener precio seguro
const getSafePrice = (item: Product | ProductOrCombo): number => {
  if ('ComboComponent' in item) {
    return (item as ProductOrCombo).basePrice || 0;
  }
  return (item as Product).price || 0;
};

interface CartItem {
  product: ProductOrCombo;
  quantity: number;
  notes: string;
}

const OrderCreation: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [combos, setCombos] = useState<ProductOrCombo[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSpace, setSelectedSpace] = useState<Space | null>(null);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  const [selectedSauces, setSelectedSauces] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Estado para el flujo paso a paso
  const [currentStep, setCurrentStep] = useState(1);
  
  // Estado para el modal de personalización de combos
  const [comboModalOpen, setComboModalOpen] = useState(false);
  const [selectedCombo, setSelectedCombo] = useState<ProductOrCombo | null>(null);
  
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔄 Iniciando carga de datos...');
      
      const [productsData, combosData, categoriesData, spacesData] = await Promise.all([
        catalogService.getProducts(),
        catalogService.getCombos(),
        catalogService.getCategories(),
        tableService.getSpaces()
      ]);
      
      console.log('📦 Productos cargados:', productsData?.length || 0);
      console.log('🍱 Combos cargados:', combosData?.length || 0);
      console.log('📂 Categorías cargadas:', categoriesData?.length || 0);
      console.log('🏠 Espacios cargados:', spacesData?.length || 0);
      
      // Log detallado de combos disponibles
      if (combosData && combosData.length > 0) {
        console.log('🍱 Detalle de combos:', combosData.map((combo: any) => ({
          id: combo.id,
          name: combo.name,
          basePrice: combo.basePrice,
          components: combo.components?.length || 0,
          isAvailable: combo.isAvailable
        })));
      }
      
      // Log detallado de espacios
      if (spacesData && spacesData.length > 0) {
        console.log('🏠 Detalle de espacios:', spacesData.map((s: Space) => ({ 
          id: s.id, 
          name: s.name, 
          type: s.type, 
          status: s.status,
          capacity: s.capacity 
        })));
      } else {
        console.log('❌ No se encontraron espacios');
      }
      
      // Log detallado de combos
      if (combosData && combosData.length > 0) {
        console.log('🍱 Detalle de combos:', combosData.map((c: any) => ({ id: c.id, name: c.name, categoryId: c.categoryId })));
      } else {
        console.log('❌ No se encontraron combos');
      }
      
      // Log detallado de productos
      if (productsData && productsData.length > 0) {
        console.log('📦 Detalle de productos:', productsData.map((p: Product) => ({ id: p.id, name: p.name, categoryId: p.categoryId })));
      } else {
        console.log('❌ No se encontraron productos');
      }
      
      // Log detallado de combos antes de establecer
      if (combosData && combosData.length > 0) {
        console.log('🍱 Combos recibidos del backend:', combosData);
        combosData.forEach((combo: any, index: number) => {
          console.log(`🍱 Combo ${index + 1}:`, {
            id: combo.id,
            name: combo.name,
            basePrice: combo.basePrice,
            hasComboComponent: !!combo.ComboComponent,
            comboComponentCount: combo.ComboComponent?.length || 0,
            comboComponent: combo.ComboComponent
          });
        });
      }
      
      setProducts(productsData || []);
      setCombos(combosData || []);
      setCategories(categoriesData || []);
      setSpaces(spacesData || []);
    } catch (error: any) {
      console.error('❌ Error loading data:', error);
      setError(error.message || 'Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  // Funciones para el flujo paso a paso
  const nextStep = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const canProceedToNext = () => {
    switch (currentStep) {
      case 1: // Selección de espacio
        return selectedSpace !== null;
      case 2: // Información del cliente
        return customerName.trim() !== '';
      case 3: // Selección de productos
        return cart.length > 0;
      default:
        return false;
    }
  };

  const getStepStatus = (step: number) => {
    if (step < currentStep) return 'completed';
    if (step === currentStep) return 'active';
    return 'pending';
  };

  // Funciones para manejar salsas y palitos
  const toggleSauce = (sauce: string) => {
    setSelectedSauces(prev => 
      prev.includes(sauce) 
        ? prev.filter(s => s !== sauce)
        : [...prev, sauce]
    );
  };


  const getRequiredSaucesCount = () => {
    // Contar makis individuales en el carrito (siempre 2 salsas)
    const makiCount = cart.filter(item => 
      item.product.name.toLowerCase().includes('maki') && !item.product.id.startsWith('combo-')
    ).length;
    
    // Contar combos en el carrito
    const comboCount = cart.filter(item => 
      item.product.id.startsWith('combo-')
    ).length;
    
    // Para combos nuevos, verificar si ya tienen salsas seleccionadas
    const combosWithSauces = cart.filter(item => {
      if (!item.product.id.startsWith('combo-')) return false;
      
      try {
        const notes = JSON.parse(item.notes);
        return notes.selectedSauces && notes.selectedSauces.length > 0;
      } catch {
        return false;
      }
    }).length;
    
    // Makis individuales requieren 2 salsas cada uno
    // Combos requieren al menos 1 salsa (si no la tienen seleccionada)
    return (makiCount * 2) + (comboCount - combosWithSauces);
  };

  // Función para manejar combos personalizados del modal
  const handleCustomizedCombo = (customizedCombo: CustomizedCombo) => {
    const cartItem: CartItem = {
      product: {
        ...customizedCombo.combo,
        id: `combo-${customizedCombo.combo.id}`,
        price: customizedCombo.combo.basePrice || customizedCombo.combo.price || 0
      },
      quantity: 1,
      notes: JSON.stringify({
        selectedComponents: customizedCombo.selectedComponents,
        selectedSauces: customizedCombo.selectedSauces,
        normalChopsticks: customizedCombo.normalChopsticks || 0,
        assistedChopsticks: customizedCombo.assistedChopsticks || 0,
        comboType: 'new' // Marcar como combo nuevo
      })
    };
    
    setCart([...cart, cartItem]);
    console.log('🍱 Combo agregado al carrito:', cartItem);
  };

  // Combinar productos y combos para mostrar en el paso 3
  const allItems = [...products, ...combos];
  
  console.log('🔄 Combinando items:', { 
    productsCount: products.length, 
    combosCount: combos.length, 
    allItemsCount: allItems.length 
  });
  
  const filteredItems = selectedCategory
    ? allItems.filter(item => item.categoryId === selectedCategory)
    : allItems;
    
  console.log('🔍 Filtrado de items:', { 
    selectedCategory, 
    filteredItemsCount: filteredItems.length,
    filteredItems: filteredItems.map((item: any) => ({ 
      id: item.id, 
      name: item.name, 
      categoryId: item.categoryId,
      type: 'ComboComponent' in item ? 'COMBO' : 'PRODUCTO'
    }))
  });

  // Función para verificar si solo hay combos en el carrito
  const hasOnlyCombos = () => {
    return cart.length > 0 && cart.every(item => 'ComboComponent' in item.product);
  };

  // Función para verificar si hay productos (no combos) en el carrito
  const hasProducts = () => {
    return cart.some(item => !('ComboComponent' in item.product));
  };

  const addToCart = (item: Product | ProductOrCombo) => {
    // Determinar si es un producto o combo
    const isCombo = 'ComboComponent' in item;
    
    if (isCombo) {
      // Para combos, abrir el modal de personalización
      setSelectedCombo(item);
      setComboModalOpen(true);
      return;
    }
    
    // Para productos normales, agregar directamente al carrito
    const existingItem = cart.find(cartItem => cartItem.product.id === item.id);
    
    if (existingItem) {
      setCart(cart.map(cartItem => 
        cartItem.product.id === item.id 
          ? { ...cartItem, quantity: cartItem.quantity + 1 }
          : cartItem
      ));
    } else {
      const cartItem: CartItem = {
        product: {
          ...item,
          price: getSafePrice(item)
        },
        quantity: 1,
        notes: ''
      };
      setCart([...cart, cartItem]);
    }
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.product.id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
    } else {
      setCart(cart.map(item =>
        item.product.id === productId
          ? { ...item, quantity }
          : item
      ));
    }
  };

  const getTotalPrice = () => {
    return cart.reduce((total, item) => {
      const price = item.product.price || 0;
      return total + (price * item.quantity);
    }, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedSpace || cart.length === 0) {
      alert('Por favor completa todos los campos requeridos');
      return;
    }

    setSubmitting(true);

    try {
      const currentUser = authService.getCurrentUser();
      const totalAmount = getTotalPrice();
      
      // Preparar notas completas de la orden
      let completeOrderNotes = orderNotes;
      
      // Agregar salsas seleccionadas
      if (selectedSauces.length > 0) {
        completeOrderNotes += `\n🍶 SALSAS: ${selectedSauces.join(', ')}`;
      }
      
      
      const orderData = {
        spaceId: selectedSpace.id,
        createdBy: currentUser?.id || 'default-user',
        customerName: customerName,
        customerPhone: customerPhone,
        notes: completeOrderNotes.trim(),
        totalAmount: totalAmount,
        subtotal: totalAmount,
        tax: 0,
        discount: 0,
        items: cart.map(item => {
          const isCombo = item.product.id.startsWith('combo-');
          const price = item.product.price || 0;
          
          return {
            productId: isCombo ? null : item.product.id.replace('combo-', ''),
            comboId: isCombo ? item.product.id.replace('combo-', '') : null,
            name: item.product.name,
            unitPrice: price,
            totalPrice: price * item.quantity,
            quantity: item.quantity,
            notes: item.notes
          };
        })
      };

      const newOrder = await orderService.createOrder(orderData);
      
      alert(`¡Orden creada exitosamente! Número de orden: ${newOrder.orderNumber}`);
      
      // Reset form
      setSelectedSpace(null);
      setCart([]);
      setCustomerName('');
      setCustomerPhone('');
      setOrderNotes('');
      setSelectedSauces([]);
      setSelectedCategory(null);
      setCurrentStep(1);
      
      // Reset modal state
      setComboModalOpen(false);
      setSelectedCombo(null);
      
      // Navigate to kitchen view with a timestamp to force refresh
      navigate('/kitchen', { state: { refresh: Date.now() } });
    } catch (err: any) {
      console.error('Error creating order:', err);
      alert(err.message || 'Error al crear la orden');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="order-creation-container">
        <div className="loading">Cargando datos...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="order-creation-container">
        <div className="error">
          <h2>❌ Error al cargar datos</h2>
          <p>{error}</p>
          <button onClick={loadData} className="btn-primary">
            🔄 Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="order-creation-container">
      <div className="order-creation-header">
        <h1>➕ Crear Nueva Orden</h1>
        <p>Flujo simplificado paso a paso</p>
      </div>

      {/* Indicador de Progreso */}
      <div className="progress-steps">
        <div className={`step ${getStepStatus(1)}`}>
          <div className="step-number">1</div>
          <span>Espacio</span>
        </div>
        <div className={`step ${getStepStatus(2)}`}>
          <div className="step-number">2</div>
          <span>Cliente</span>
        </div>
        <div className={`step ${getStepStatus(3)}`}>
          <div className="step-number">3</div>
          <span>Productos</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="order-form">
        {/* PASO 1: Selección de Espacio */}
        <div className={`form-section ${currentStep === 1 ? 'active' : ''}`}>
          <h2>🪑 Seleccionar Espacio</h2>
          <div className="spaces-grid">
            {spaces.map(space => (
              <button
                key={space.id}
                type="button"
                className={`space-button ${selectedSpace?.id === space.id ? 'selected' : ''} ${space.status === 'OCUPADA' ? 'occupied' : ''}`}
                onClick={() => setSelectedSpace(space)}
                disabled={space.status === 'OCUPADA'}
              >
                <span className="space-name">{space.name}</span>
                <span className={`space-status ${space.status.toLowerCase()}`}>
                  {space.status === 'LIBRE' ? 'Disponible' : 'Ocupada'}
                </span>
              </button>
            ))}
          </div>
          
          <div className="form-actions">
            <button
              type="button"
              className="btn-primary"
              onClick={nextStep}
              disabled={!canProceedToNext()}
            >
              Continuar →
            </button>
          </div>
        </div>

        {/* PASO 2: Información del Cliente */}
        <div className={`form-section ${currentStep === 2 ? 'active' : ''}`}>
          <h2>👤 Información del Cliente</h2>
          <div className="customer-info">
            <div className="form-group">
              <label>Nombre del Cliente *</label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Ingresa el nombre del cliente"
                required
              />
            </div>
            <div className="form-group">
              <label>Teléfono (opcional)</label>
              <input
                type="tel"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="Número de teléfono"
              />
            </div>
            <div className="form-group">
              <label>Notas de la Orden</label>
              <textarea
                value={orderNotes}
                onChange={(e) => setOrderNotes(e.target.value)}
                placeholder="Instrucciones especiales, alergias, etc."
                rows={3}
              />
            </div>
          </div>
          
          <div className="form-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={prevStep}
            >
              ← Atrás
            </button>
            <button
              type="button"
              className="btn-primary"
              onClick={nextStep}
              disabled={!canProceedToNext()}
            >
              Continuar →
            </button>
          </div>
        </div>

        {/* PASO 3: Selección de Productos */}
        <div className={`form-section ${currentStep === 3 ? 'active' : ''}`}>
          <h2>🍽️ Seleccionar Productos</h2>
          
          {/* Filtros de Categoría */}
          <div className="category-filters">
            <button
              type="button"
              className={`category-button ${!selectedCategory ? 'active' : ''}`}
              onClick={() => setSelectedCategory(null)}
            >
              Todas
            </button>
            {categories.map(category => (
              <button
                key={category.id}
                type="button"
                className={`category-button ${selectedCategory === category.id ? 'active' : ''}`}
                onClick={() => setSelectedCategory(category.id)}
              >
                {category.name}
              </button>
            ))}
          </div>

          {/* Grid de Productos y Combos */}
          <div className="products-grid">
            {filteredItems.length === 0 ? (
              <div className="empty-cart">
                <p>No hay productos disponibles en esta categoría</p>
              </div>
            ) : (
              filteredItems.map(item => {
                const isCombo = 'ComboComponent' in item;
                const price = getSafePrice(item);
                const isAvailable = item.isAvailable || false;
                
                return (
                  <div key={item.id} className={`product-card ${isCombo ? 'combo-card' : ''}`}>
                    <div className="product-info">
                      <div className="item-header">
                        {isCombo && <span className="combo-badge">🍱 COMBO</span>}
                        <h3 className="product-name">{item.name}</h3>
                      </div>
                      {item.description && (
                        <p className="product-description">{item.description}</p>
                      )}
                      {isCombo && (item as ProductOrCombo).ComboComponent && (
                        <div className="combo-components">
                          <small>📦 Incluye: {(item as ProductOrCombo).ComboComponent!.length} componente(s)</small>
                        </div>
                      )}
                      <div className="product-price">${(price || 0).toFixed(2)}</div>
                    </div>
                    <button
                      type="button"
                      className="add-to-cart-btn"
                      onClick={() => addToCart(item)}
                      disabled={!isAvailable}
                    >
                      {isCombo ? '➕ Agregar Combo' : '➕ Agregar'}
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {/* Carrito */}
          {cart.length > 0 && (
            <div className="cart-items">
              <h3>🛒 Carrito de Compras</h3>
              {cart.map((item, index) => (
                <div key={index} className="cart-item">
                                      <div className="item-info">
                      <div className="item-name">{item.product.name}</div>
                      <div className="item-price">${(item.product.price || 0).toFixed(2)}</div>
                    </div>
                  <div className="item-quantity">
                    <button
                      type="button"
                      className="quantity-btn"
                      onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                      disabled={item.quantity <= 1}
                    >
                      -
                    </button>
                    <span className="quantity">{item.quantity}</span>
                    <button
                      type="button"
                      className="quantity-btn"
                      onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                    >
                      +
                    </button>
                  </div>
                  <div className="item-total">
                    ${((item.product.price || 0) * item.quantity).toFixed(2)}
                  </div>
                  <button
                    type="button"
                    className="remove-btn"
                    onClick={() => removeFromCart(item.product.id)}
                  >
                    🗑️
                  </button>
                </div>
              ))}
              
              <div className="cart-total">
                <h4>Total de la Orden</h4>
                <div className="total-amount">${getTotalPrice().toFixed(2)}</div>
              </div>
            </div>
          )}

          {/* Sección de Salsas, Palitos y Notas */}
          {cart.length > 0 && (
            <div className="order-options">
              {/* Selección de Salsas - Solo para productos individuales */}
              {hasProducts() && (
                <div className="sauces-section">
                  <h4>🍶 ELIGE LAS SALSA:</h4>
                  <div className="sauces-grid">
                    {AVAILABLE_SAUCES.map(sauce => (
                      <label key={sauce} className="sauce-option">
                        <input
                          type="checkbox"
                          checked={selectedSauces.includes(sauce)}
                          onChange={() => toggleSauce(sauce)}
                        />
                        <span className="sauce-name">{sauce}</span>
                      </label>
                    ))}
                  </div>
                  {getRequiredSaucesCount() > 0 && (
                    <p className="sauces-info">
                      💡 Se requieren {getRequiredSaucesCount()} salsa(s) para los items del carrito
                    </p>
                  )}
                </div>
              )}

              {/* Mensaje informativo cuando solo hay combos */}
              {hasOnlyCombos() && (
                <div className="combo-only-message">
                  <div className="message-icon">🍱</div>
                  <div className="message-content">
                    <h4>¡Perfecto! Solo combos en tu orden</h4>
                    <p>Los combos ya incluyen todas sus personalizaciones. No necesitas seleccionar salsas adicionales.</p>
                  </div>
                </div>
              )}


              {/* Notas de la Orden */}
              <div className="order-notes-section">
                <h4>📝 Notas de la orden:</h4>
                <textarea
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  placeholder="Agregar notas adicionales, instrucciones especiales, etc..."
                  className="order-notes-input"
                  rows={3}
                />
              </div>
            </div>
          )}


          
          <div className="form-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={prevStep}
            >
              ← Atrás
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={!canProceedToNext() || submitting}
            >
              {submitting ? 'Creando Orden...' : '🍽️ Crear Orden'}
            </button>
          </div>
        </div>
      </form>

      {/* Modal de Personalización de Combos */}
      <ComboCustomizationModal
        combo={selectedCombo}
        isOpen={comboModalOpen}
        onClose={() => {
          setComboModalOpen(false);
          setSelectedCombo(null);
        }}
        onAddToCart={handleCustomizedCombo}
      />
    </div>
  );
};

export default OrderCreation;


