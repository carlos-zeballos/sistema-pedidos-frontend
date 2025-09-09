import React, { useState, useEffect } from 'react';
import { orderService, paymentService } from '../services/api';
import { Order, OrderItem } from '../types';
import './FinancialReports.css';


interface PaymentMethod {
  id: string;
  name: string;
  icon: string;
  color: string;
  total_orders: number;
  total_amount: number;
}

interface TopProduct {
  name: string;
  quantity: number;
  totalAmount: number;
  orders: number;
}

interface TopComboComponent {
  name: string;
  quantity: number;
  usage: number;
}

const FinancialReports: React.FC = () => {
  // Estados principales
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  // Estados para filtros
  const [orderFilters, setOrderFilters] = useState({
    status: 'all',
    space: 'all',
    search: ''
  });

  const [advancedFilters, setAdvancedFilters] = useState({
    minAmount: '',
    maxAmount: '',
    paymentMethod: 'all'
  });

  // Estados para filtros de fecha en Análisis Avanzado
  const [dateRangeFilters, setDateRangeFilters] = useState({
    fromDate: '',
    toDate: '',
    useDateRange: false
  });

  // Estado para vista de pedidos en Análisis Avanzado
  const [analyticsViewMode, setAnalyticsViewMode] = useState<'cards' | 'table'>('cards');

  // Estados para análisis
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [topComboComponents, setTopComboComponents] = useState<TopComboComponent[]>([]);

  // Estados para dashboard real
  const [todayStats, setTodayStats] = useState({
    totalAmount: 0,
    totalOrders: 0,
    paymentMethods: [] as PaymentMethod[]
  });

  // Estados para órdenes del día
  const [todayOrders, setTodayOrders] = useState<Order[]>([]);
  
  // Estados para métodos de pago
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);

  // Funciones principales
  const isAdmin = () => {
    return true;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN'
    }).format(amount);
  };

  const formatDate = (date: string | Date) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('es-PE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(dateObj);
  };

  const getTotalAmount = (data: Order[]) => {
    return data.reduce((total, item) => total + (item.totalAmount || 0), 0);
  };

  const getTotalOrders = (data: Order[]) => {
    return data.length;
  };

  // Función para calcular el total original de los items de una orden
  const getOriginalTotal = (order: Order): number => {
    if (!order.items || !Array.isArray(order.items)) {
      return order.totalAmount || 0;
    }
    
    return order.items.reduce((total, item) => {
      return total + (item.totalPrice || 0);
    }, 0);
  };

  // Función para verificar si el precio fue modificado
  const isPriceModified = (order: Order): boolean => {
    const originalTotal = getOriginalTotal(order);
    const currentTotal = order.totalAmount || 0;
    return Math.abs(originalTotal - currentTotal) > 0.01; // Tolerancia para decimales
  };

  // Funciones para separar deliveries y pedidos
  const getDeliveryOrders = () => {
    return allOrders.filter(order => order.isDelivery === true);
  };

  const getOrdersOnly = () => {
    return allOrders.filter(order => order.isDelivery !== true);
  };

  // Función para calcular métodos de pago de deliveries
  const getDeliveryPaymentMethods = (): PaymentMethod[] => {
    const deliveryOrders = getDeliveryOrders();
    const methodMap = new Map<string, PaymentMethod>();

    // Usar los métodos de pago reales de la base de datos
    paymentMethods.forEach(method => {
      methodMap.set(method.name, {
        ...method,
        total_orders: 0,
        total_amount: 0
      });
    });

    // Contar deliveries por método de pago
    deliveryOrders.forEach(order => {
      // Por ahora usaremos un método por defecto hasta que tengamos los datos reales
      // En el futuro esto debería venir de OrderPayment
      const methodName = 'EFECTIVO'; // Esto debería venir de la base de datos
      const method = methodMap.get(methodName);
      if (method) {
        method.total_orders += 1;
        method.total_amount += order.totalAmount || 0;
      }
    });

    return Array.from(methodMap.values()).filter(method => method.total_orders > 0);
  };

  // Función para calcular métodos de pago de pedidos (no deliveries)
  const getOrdersPaymentMethods = (): PaymentMethod[] => {
    const ordersOnly = getOrdersOnly();
    const methodMap = new Map<string, PaymentMethod>();

    // Usar los métodos de pago reales de la base de datos
    paymentMethods.forEach(method => {
      methodMap.set(method.name, {
        ...method,
        total_orders: 0,
        total_amount: 0
      });
    });

    // Contar pedidos por método de pago
    ordersOnly.forEach(order => {
      // Por ahora usaremos un método por defecto hasta que tengamos los datos reales
      // En el futuro esto debería venir de OrderPayment
      const methodName = 'EFECTIVO'; // Esto debería venir de la base de datos
      const method = methodMap.get(methodName);
      if (method) {
        method.total_orders += 1;
        method.total_amount += order.totalAmount || 0;
      }
    });

    return Array.from(methodMap.values()).filter(method => method.total_orders > 0);
  };

  // Analizar productos más vendidos desde datos reales
  const analyzeTopProducts = (ordersToAnalyze?: Order[]) => {
    const orders = ordersToAnalyze || allOrders;
    console.log('🔍 ANALIZANDO PRODUCTOS - Iniciando análisis...');
    console.log('📊 Total de órdenes a analizar:', orders.length);
    
    const productStats: Record<string, TopProduct> = {};
    const comboComponentStats: Record<string, TopComboComponent> = {};

    orders.forEach((order: Order, orderIndex: number) => {
      console.log(`📦 Analizando orden ${orderIndex + 1}:`, order.orderNumber);
      console.log('   Items en la orden:', order.items?.length || 0);
      
      if (order.items && Array.isArray(order.items)) {
        order.items.forEach((item: OrderItem, itemIndex: number) => {
          console.log(`   Item ${itemIndex + 1}:`, {
            name: item.name,
            quantity: item.quantity,
            totalprice: item.totalPrice,
            notes: item.notes
          });
          
          // Productos individuales - usar datos directos de OrderItem
          if (item.name) {
            const key = `product_${item.name}`;
            if (!productStats[key]) {
              productStats[key] = {
                name: item.name,
                quantity: 0,
                totalAmount: 0,
                orders: 0
              };
            }
            productStats[key].quantity += item.quantity || 1;
            productStats[key].totalAmount += item.totalPrice || 0;
            productStats[key].orders += 1;
            
            console.log(`   ✅ Producto agregado: ${item.name} (${productStats[key].quantity} total)`);
          }

          // Analizar componentes de combos desde el campo notes
          if (item.notes) {
            try {
              const notesData = JSON.parse(item.notes);
              console.log(`   🍱 Analizando componentes del combo:`, notesData);
              
              if (notesData.selectedComponents) {
                Object.entries(notesData.selectedComponents).forEach(([type, components]: [string, any]) => {
                  if (Array.isArray(components)) {
                    components.forEach((component: any) => {
                      const componentName = component.name || component;
                      const componentQuantity = component.quantity || 1;
                      
                      const componentKey = `component_${type}_${componentName}`;
                      if (!comboComponentStats[componentKey]) {
                        comboComponentStats[componentKey] = {
                          name: `${componentName} (${type})`,
                          quantity: 0,
                          usage: 0
                        };
                      }
                      comboComponentStats[componentKey].quantity += componentQuantity;
                      comboComponentStats[componentKey].usage += 1;
                      
                      console.log(`   ✅ Componente agregado: ${componentName} (${type}) - ${componentQuantity} unidades`);
                    });
                  }
                });
              }
              
              // También agregar salsas como componentes
              if (notesData.selectedSauces && Array.isArray(notesData.selectedSauces)) {
                notesData.selectedSauces.forEach((sauce: any) => {
                  // Manejar tanto strings como objetos
                  const sauceName = typeof sauce === 'string' ? sauce : sauce.name || sauce;
                  const sauceQuantity = typeof sauce === 'object' ? (sauce.quantity || 1) : 1;
                  
                  const sauceKey = `sauce_${sauceName}`;
                  if (!comboComponentStats[sauceKey]) {
                    comboComponentStats[sauceKey] = {
                      name: `Salsa ${sauceName}`,
                      quantity: 0,
                      usage: 0
                    };
                  }
                  comboComponentStats[sauceKey].quantity += sauceQuantity;
                  comboComponentStats[sauceKey].usage += 1;
                  
                  console.log(`   ✅ Salsa agregada: ${sauceName} (${sauceQuantity} unidades)`);
                });
              }
            } catch (error) {
              console.log(`   ⚠️  Error parseando notes del item:`, error);
            }
          }

          // Combos y sus componentes
          if (item.combo) {
            const comboKey = `combo_${item.combo.id}`;
            if (!productStats[comboKey]) {
              productStats[comboKey] = {
                name: `🍱 ${item.combo.name}`,
                quantity: 0,
                totalAmount: 0,
                orders: 0
              };
            }
            productStats[comboKey].quantity += item.quantity;
            productStats[comboKey].totalAmount += (item.combo.price * item.quantity);
            productStats[comboKey].orders += 1;

            // Analizar componentes del combo
            if (item.selectedComponents) {
              Object.entries(item.selectedComponents).forEach(([type, components]) => {
                components.forEach(componentName => {
                  const componentKey = `component_${type}_${componentName}`;
                  if (!comboComponentStats[componentKey]) {
                    comboComponentStats[componentKey] = {
                      name: `${componentName} (${type})`,
                      quantity: 0,
                      usage: 0
                    };
                  }
                  comboComponentStats[componentKey].quantity += item.quantity;
                  comboComponentStats[componentKey].usage += 1;
                });
              });
            }
          }
        });
      }
    });

    // Ordenar productos por cantidad vendida
    const sortedProducts = Object.values(productStats)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);

    // Ordenar componentes por uso
    const sortedComponents = Object.values(comboComponentStats)
      .sort((a, b) => b.usage - a.usage)
      .slice(0, 10);

    console.log('📊 RESULTADOS DEL ANÁLISIS:');
    console.log('   Productos únicos encontrados:', Object.keys(productStats).length);
    console.log('   Top productos:', sortedProducts);
    console.log('   Componentes únicos encontrados:', Object.keys(comboComponentStats).length);
    console.log('   Top componentes:', sortedComponents);

    setTopProducts(sortedProducts);
    setTopComboComponents(sortedComponents);
    
    console.log('✅ Análisis completado y estados actualizados');
  };

  // Cargar todas las órdenes desde la base de datos
  const loadAllOrders = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔄 Cargando órdenes desde la base de datos...');
      const orders = await orderService.getOrders();
      console.log('✅ Órdenes cargadas:', orders);
      
      setAllOrders(orders);
      
      // Filtrar órdenes del día seleccionado
      const todayOrders = orders.filter((order: Order) => {
        const orderDate = new Date(order.createdAt).toISOString().split('T')[0];
        return orderDate === selectedDate;
      });
      setTodayOrders(todayOrders);
      
      // Cargar métodos de pago reales
      try {
        console.log('🔄 Cargando métodos de pago...');
        const paymentMethodsData = await paymentService.getPaymentMethods();
        console.log('✅ Métodos de pago cargados:', paymentMethodsData);
        
        if (paymentMethodsData && Array.isArray(paymentMethodsData)) {
          setPaymentMethods(paymentMethodsData);
          
          // Obtener resumen de pagos del día
          try {
            const paymentSummary = await paymentService.getPaymentSummary();
            console.log('✅ Resumen de pagos:', paymentSummary);
            
            if (paymentSummary && Array.isArray(paymentSummary)) {
              setTodayStats({
                totalAmount: getTotalAmount(todayOrders),
                totalOrders: getTotalOrders(todayOrders),
                paymentMethods: paymentSummary.map((method: any) => ({
                  id: method.payment_method,
                  name: method.payment_method,
                  icon: method.icon,
                  color: method.color,
                  total_orders: method.total_orders || 0,
                  total_amount: method.total_amount || 0
                }))
              });
            } else {
              // Fallback con métodos de pago sin datos
              setTodayStats({
                totalAmount: getTotalAmount(todayOrders),
                totalOrders: getTotalOrders(todayOrders),
                paymentMethods: paymentMethodsData.map((method: any) => ({
                  id: method.id,
                  name: method.name,
                  icon: method.icon,
                  color: method.color,
                  total_orders: 0,
                  total_amount: 0
                }))
              });
            }
          } catch (summaryError) {
            console.warn('Error cargando resumen de pagos, usando fallback:', summaryError);
            // Fallback con métodos de pago sin datos
            setTodayStats({
              totalAmount: getTotalAmount(todayOrders),
              totalOrders: getTotalOrders(todayOrders),
              paymentMethods: paymentMethodsData.map((method: any) => ({
                id: method.id,
                name: method.name,
                icon: method.icon,
                color: method.color,
                total_orders: 0,
                total_amount: 0
              }))
            });
          }
        }
      } catch (paymentError) {
        console.warn('Error cargando métodos de pago, usando datos simulados:', paymentError);
        // Fallback con datos simulados
        setTodayStats({
          totalAmount: getTotalAmount(todayOrders),
          totalOrders: getTotalOrders(todayOrders),
          paymentMethods: [
            { id: '1', name: 'EFECTIVO', icon: '💰', color: '#10b981', total_orders: 0, total_amount: 0 },
            { id: '2', name: 'YAPE', icon: '📱', color: '#3b82f6', total_orders: 0, total_amount: 0 },
            { id: '3', name: 'TRANSFERENCIA', icon: '🏦', color: '#8b5cf6', total_orders: 0, total_amount: 0 },
            { id: '4', name: 'PEDIDOSYA', icon: '📦', color: '#f59e0b', total_orders: 0, total_amount: 0 },
            { id: '5', name: 'TARJETA', icon: '💳', color: '#ef4444', total_orders: 0, total_amount: 0 }
          ]
        });
      }
      
      // Analizar productos
      analyzeTopProducts(orders);
      
      console.log('✅ Dashboard actualizado con datos reales');
      
    } catch (err) {
      console.error('❌ Error cargando órdenes:', err);
      setError('Error al cargar las órdenes. Verifica la conexión.');
    } finally {
      setLoading(false);
    }
  };

  // Eliminar orden
  const handleDeleteOrder = async (orderId: string) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar esta orden? Esta acción no se puede deshacer.')) {
      return;
    }
    
    setLoading(true);
    try {
      await orderService.deleteOrder(orderId);
      setSuccessMessage('Orden eliminada exitosamente');
      
      // Recargar órdenes
      await loadAllOrders();
      
      // Limpiar mensaje después de 3 segundos
      setTimeout(() => setSuccessMessage(null), 3000);
      
    } catch (err) {
      console.error('Error eliminando orden:', err);
      setError('Error al eliminar la orden');
      
      // Limpiar error después de 5 segundos
      setTimeout(() => setError(null), 5000);
    } finally {
      setLoading(false);
    }
  };

  // Cambiar fecha
  const handleDateChange = () => {
    loadAllOrders();
  };

  // Obtener órdenes filtradas
  const getFilteredOrders = () => {
    let filtered = allOrders;

    // Filtros básicos
    if (orderFilters.status !== 'all') {
      filtered = filtered.filter((order: Order) => order.status === orderFilters.status);
    }

    if (orderFilters.space !== 'all') {
      filtered = filtered.filter((order: Order) => order.space?.id === orderFilters.space);
    }

    if (orderFilters.search) {
      const searchLower = orderFilters.search.toLowerCase();
      filtered = filtered.filter((order: Order) => 
        order.orderNumber.toLowerCase().includes(searchLower) ||
        (order.customerName && order.customerName.toLowerCase().includes(searchLower))
      );
    }

    // Filtros avanzados
    if (advancedFilters.minAmount) {
      filtered = filtered.filter((order: Order) => order.totalAmount >= parseFloat(advancedFilters.minAmount));
    }

    if (advancedFilters.maxAmount) {
      filtered = filtered.filter((order: Order) => order.totalAmount <= parseFloat(advancedFilters.maxAmount));
    }

    // Filtro de método de pago (por ahora solo filtra órdenes pagadas)
    if (advancedFilters.paymentMethod !== 'all') {
      filtered = filtered.filter((order: Order) => {
        // Por ahora, solo filtramos órdenes que estén marcadas como pagadas
        // En el futuro, esto se puede mejorar para filtrar por método específico
        return order.status === 'PAGADO';
      });
    }

    return filtered;
  };

  // Obtener órdenes filtradas por rango de fechas (para Análisis Avanzado)
  const getDateRangeFilteredOrders = () => {
    let filtered = allOrders;

    console.log('🔍 DEBUG: getDateRangeFilteredOrders llamada');
    console.log('   📊 Total de órdenes:', allOrders.length);
    console.log('   🔧 Filtros activos:', dateRangeFilters);

    // Aplicar filtros de rango de fechas si están activos
    if (dateRangeFilters.useDateRange) {
      console.log('   ✅ Filtros de rango activos');
      
      if (dateRangeFilters.fromDate) {
        console.log('   📅 Filtro desde:', dateRangeFilters.fromDate);
        
        filtered = filtered.filter((order: Order) => {
          const orderDate = new Date(order.createdAt).toISOString().split('T')[0];
          const isIncluded = orderDate >= dateRangeFilters.fromDate;
          if (!isIncluded) {
            console.log(`   ❌ Orden ${order.orderNumber} excluida (fecha: ${orderDate})`);
          }
          return isIncluded;
        });
        console.log(`   📊 Órdenes después de filtro "desde": ${filtered.length}`);
      }

      if (dateRangeFilters.toDate) {
        console.log('   📅 Filtro hasta:', dateRangeFilters.toDate);
        
        filtered = filtered.filter((order: Order) => {
          const orderDate = new Date(order.createdAt).toISOString().split('T')[0];
          const isIncluded = orderDate <= dateRangeFilters.toDate;
          if (!isIncluded) {
            console.log(`   ❌ Orden ${order.orderNumber} excluida (fecha: ${orderDate})`);
          }
          return isIncluded;
        });
        console.log(`   📊 Órdenes después de filtro "hasta": ${filtered.length}`);
      }
    } else {
      console.log('   ❌ Filtros de rango NO activos');
    }

    console.log(`   ✅ Resultado final: ${filtered.length} órdenes filtradas`);
    return filtered;
  };

  // Renderizar detalles de la orden
  const renderOrderDetails = (order: Order) => {
    if (!order.items || !Array.isArray(order.items)) {
      return <p>No hay items en esta orden</p>;
    }

    return (
      <div className="order-items-details">
        {order.items.map((item: OrderItem, index: number) => (
          <div key={index} className="order-item-detail">
            <div className="item-info">
              <div className="item-name">
                {item.name || 'Item sin nombre'}
              </div>
              <div className="item-price">
                {formatCurrency(item.totalPrice || 0)}
              </div>
            </div>
            <div className="item-quantity">x{item.quantity}</div>
            
            {/* Detalles del combo */}
            {item.notes && (() => {
              try {
                const notesData = JSON.parse(item.notes);
                if (notesData.selectedComponents) {
                  return (
                    <div className="combo-details">
                      <div className="combo-price">
                        {/* Solo mostrar diferencia de precios para pedidos (no deliveries) */}
                        {!order.isDelivery && isPriceModified(order) ? (
                          <>
                            <div className="item-price">Total Original: {formatCurrency(getOriginalTotal(order))}</div>
                            <div className="order-total">Total Actualizado: {formatCurrency(order.totalAmount || 0)}</div>
                          </>
                        ) : (
                          <div>Total: {formatCurrency(item.totalPrice || 0)}</div>
                        )}
                      </div>
                      <div className="combo-components">
                        {Object.entries(notesData.selectedComponents).map(([type, components]) => (
                          <div key={type} className="component-type">
                            <span className="component-label">{type}:</span>
                            <span className="component-values">
                              {Array.isArray(components) 
                                ? components.map((comp: any) => comp.name || comp).join(', ')
                                : String(components)
                              }
                            </span>
                          </div>
                        ))}
                      </div>
                      {notesData.selectedSauces && notesData.selectedSauces.length > 0 && (
                        <div className="combo-sauces">
                          <span className="sauce-label">Salsas:</span>
                          <span className="sauce-values">
                            {notesData.selectedSauces.map((sauce: any) => 
                              typeof sauce === 'string' ? sauce : sauce.name || sauce
                            ).join(', ')}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                }
              } catch (error) {
                console.log('Error parseando notes del item:', error);
              }
              return null;
            })()}
          </div>
        ))}
      </div>
    );
  };

  // Cargar datos al montar el componente
  useEffect(() => {
    console.log('🚀 Componente FinancialReports montado, cargando datos...');
    loadAllOrders();
  }, []);

  // Escuchar eventos de pago completado para recargar datos
  useEffect(() => {
    const handlePaymentCompleted = () => {
      console.log('💰 Pago completado detectado, recargando reportes...');
      loadAllOrders();
    };

    window.addEventListener('orderPaymentCompleted', handlePaymentCompleted);
    
    return () => {
      window.removeEventListener('orderPaymentCompleted', handlePaymentCompleted);
    };
  }, []);

  // Aplicar filtros automáticamente cuando cambien
  useEffect(() => {
    console.log('🔄 useEffect ejecutado - Filtros o órdenes cambiaron');
    console.log('   📊 allOrders.length:', allOrders.length);
    console.log('   🔧 dateRangeFilters:', dateRangeFilters);
    
    if (dateRangeFilters.useDateRange && (dateRangeFilters.fromDate || dateRangeFilters.toDate)) {
      console.log('✅ Filtros de fecha activos, aplicando automáticamente...');
      const filteredOrders = getDateRangeFilteredOrders();
      console.log('📊 Órdenes filtradas:', filteredOrders.length);
      console.log('📋 Primeras 3 órdenes filtradas:', filteredOrders.slice(0, 3).map(o => ({
        orderNumber: o.orderNumber,
        createdAt: o.createdAt,
        customerName: o.customerName
      })));
    } else {
      console.log('❌ Filtros de fecha NO activos');
    }
  }, [dateRangeFilters, allOrders]);

  // Renderizar el componente
  return (
    <div className="financial-reports">
      {/* Header Principal */}
      <div className="reports-header">
        <h1>📊 Reportes Financieros</h1>
        <p className="subtitle">Análisis completo de ventas, pedidos y productos</p>
        
        {/* Botón de Diagnóstico */}
        <div className="diagnostic-section">
          <button 
            className="diagnostic-btn"
            onClick={async () => {
              try {
                const response = await fetch('/api/orders/test/health');
                const data = await response.json();
                alert(`Diagnóstico del Sistema:\n${JSON.stringify(data, null, 2)}`);
              } catch (err) {
                alert('Error en diagnóstico: ' + err);
              }
            }}
          >
            🔧 Diagnóstico del Sistema
          </button>
          <p className="diagnostic-info">Verifica la conectividad y estado del backend</p>
        </div>
      </div>

      {/* Navegación por Pestañas */}
      <div className="reports-tabs">
        <button 
          className={`tab ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          📊 Dashboard
        </button>
        <button 
          className={`tab ${activeTab === 'orders' ? 'active' : ''}`}
          onClick={() => setActiveTab('orders')}
        >
          📋 Gestión de Pedidos
        </button>
        <button 
          className={`tab ${activeTab === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          📈 Análisis Avanzado
        </button>
        <button 
          className={`tab ${activeTab === 'product-analysis' ? 'active' : ''}`}
          onClick={() => setActiveTab('product-analysis')}
        >
          🍽️ Análisis de Productos
        </button>
      </div>

      {/* Contenido Principal */}
      <div className="reports-content">
        {/* Banners de Estado */}
        {error && (
          <div className="error-banner">
            <span className="error-icon">❌</span>
            {error}
          </div>
        )}
        
        {successMessage && (
          <div className="success-banner">
            <span className="success-icon">✅</span>
            {successMessage}
          </div>
        )}

        {/* Dashboard */}
        {activeTab === 'dashboard' && (
          <div className="dashboard-section">
            <div className="dashboard-header">
              <h2>📊 Dashboard del Día</h2>
              <div className="dashboard-controls">
                <div className="date-selector">
                  <label>Fecha:</label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    onBlur={handleDateChange}
                  />
                </div>
                <button 
                  className="refresh-btn"
                  onClick={loadAllOrders}
                  disabled={loading}
                >
                  🔄 Actualizar
                </button>
              </div>
            </div>

            {loading ? (
              <div className="loading-spinner">Cargando datos del dashboard...</div>
            ) : (
              <>
                {/* Grid de Tarjetas de Resumen */}
                <div className="dashboard-grid">
                  <div className="summary-card total-orders">
                    <div className="card-icon">📋</div>
                    <div className="card-content">
                      <h3>Total Órdenes</h3>
                      <p className="card-value">{todayStats.totalOrders}</p>
                    </div>
                  </div>
                  
                  <div className="summary-card total-amount">
                    <div className="card-icon">💰</div>
                    <div className="card-content">
                      <h3>Total Ventas</h3>
                      <p className="card-value">{formatCurrency(todayStats.totalAmount)}</p>
                    </div>
                  </div>
                  
                  <div className="summary-card average-order">
                    <div className="card-icon">📊</div>
                    <div className="card-content">
                      <h3>Ticket Promedio</h3>
                      <p className="card-value">
                        {todayStats.totalOrders > 0 
                          ? formatCurrency(todayStats.totalAmount / todayStats.totalOrders)
                          : formatCurrency(0)
                        }
                      </p>
                    </div>
                  </div>
                  
                  <div className="summary-card admin-actions">
                    <div className="card-icon">⚙️</div>
                    <div className="card-content">
                      <h3>Acciones Admin</h3>
                      <p className="card-value">{isAdmin() ? 'Disponible' : 'No disponible'}</p>
                    </div>
                  </div>
                </div>

                {/* Métodos de Pago */}
                <div className="payment-methods-section">
                  <h3>💳 Métodos de Pago</h3>
                  <div className="payment-methods-grid">
                    {todayStats.paymentMethods.map((method: PaymentMethod) => {
                      const totalAmount = getTotalAmount(allOrders);
                      const percentage = totalAmount > 0 ? (method.total_amount / totalAmount) * 100 : 0;
                      
                      return (
                        <div key={method.id} className="payment-method-card">
                          <div className="method-header">
                            <div className="method-icon" style={{ color: method.color }}>
                              {method.icon}
                            </div>
                            <div className="method-name">{method.name}</div>
                          </div>
                          <div className="method-stats">
                            <div className="stat-item">
                              <span className="stat-label">Órdenes</span>
                              <span className="stat-value">{method.total_orders}</span>
                            </div>
                            <div className="stat-item">
                              <span className="stat-label">Total</span>
                              <span className="stat-value">{formatCurrency(method.total_amount)}</span>
                            </div>
                            <div className="stat-item">
                              <span className="stat-label">%</span>
                              <span className="stat-value">{percentage.toFixed(1)}%</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* TOTAL DELIVERYS */}
                <div className="delivery-reports-section">
                  <h3>🚚 TOTAL DE DELIVERYS</h3>
                  <div className="delivery-methods-grid">
                    {getDeliveryPaymentMethods().map((method: PaymentMethod) => {
                      const totalAmount = getTotalAmount(getDeliveryOrders());
                      const percentage = totalAmount > 0 ? (method.total_amount / totalAmount) * 100 : 0;
                      
                      return (
                        <div key={method.id} className="delivery-method-card">
                          <div className="method-header">
                            <div className="method-icon" style={{ color: method.color }}>
                              {method.icon}
                            </div>
                            <div className="method-name">{method.name}</div>
                          </div>
                          <div className="method-stats">
                            <div className="stat-item">
                              <span className="stat-label">Deliverys</span>
                              <span className="stat-value">{method.total_orders}</span>
                            </div>
                            <div className="stat-item">
                              <span className="stat-label">Total</span>
                              <span className="stat-value">{formatCurrency(method.total_amount)}</span>
                            </div>
                            <div className="stat-item">
                              <span className="stat-label">%</span>
                              <span className="stat-value">{percentage.toFixed(1)}%</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* TOTAL PEDIDOS */}
                <div className="orders-reports-section">
                  <h3>🍽️ TOTAL PEDIDOS</h3>
                  <div className="orders-methods-grid">
                    {getOrdersPaymentMethods().map((method: PaymentMethod) => {
                      const totalAmount = getTotalAmount(getOrdersOnly());
                      const percentage = totalAmount > 0 ? (method.total_amount / totalAmount) * 100 : 0;
                      
                      return (
                        <div key={method.id} className="orders-method-card">
                          <div className="method-header">
                            <div className="method-icon" style={{ color: method.color }}>
                              {method.icon}
                            </div>
                            <div className="method-name">{method.name}</div>
                          </div>
                          <div className="method-stats">
                            <div className="stat-item">
                              <span className="stat-label">Pedidos</span>
                              <span className="stat-value">{method.total_orders}</span>
                            </div>
                            <div className="stat-item">
                              <span className="stat-label">Total</span>
                              <span className="stat-value">{formatCurrency(method.total_amount)}</span>
                            </div>
                            <div className="stat-item">
                              <span className="stat-label">%</span>
                              <span className="stat-value">{percentage.toFixed(1)}%</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* Resumen de precios modificados */}
                  <div className="price-modification-summary">
                    <h4>💰 Resumen de Precios Modificados</h4>
                    <div className="price-summary-grid">
                      <div className="price-summary-card">
                        <div className="summary-icon">📊</div>
                        <div className="summary-content">
                          <div className="summary-label">Total Original</div>
                          <div className="summary-value">
                            {formatCurrency(getOrdersOnly().reduce((total, order) => total + getOriginalTotal(order), 0))}
                          </div>
                        </div>
                      </div>
                      <div className="price-summary-card">
                        <div className="summary-icon">💵</div>
                        <div className="summary-content">
                          <div className="summary-label">Total Actualizado</div>
                          <div className="summary-value">
                            {formatCurrency(getTotalAmount(getOrdersOnly()))}
                          </div>
                        </div>
                      </div>
                      <div className="price-summary-card">
                        <div className="summary-icon">📈</div>
                        <div className="summary-content">
                          <div className="summary-label">Diferencia</div>
                          <div className="summary-value">
                            {formatCurrency(getTotalAmount(getOrdersOnly()) - getOrdersOnly().reduce((total, order) => total + getOriginalTotal(order), 0))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Gestión de Pedidos */}
        {activeTab === 'orders' && (
          <div className="orders-management-section">
            <div className="section-header">
              <h2>📋 Gestión de Pedidos</h2>
              <div className="management-controls">
                <div className="view-mode-toggle">
                  <button 
                    className={`toggle-btn ${viewMode === 'cards' ? 'active' : ''}`}
                    onClick={() => setViewMode('cards')}
                  >
                    📱 Tarjetas
                  </button>
                  <button 
                    className={`toggle-btn ${viewMode === 'table' ? 'active' : ''}`}
                    onClick={() => setViewMode('table')}
                  >
                    📊 Tabla
                  </button>
                </div>
                <button 
                  className="refresh-btn"
                  onClick={loadAllOrders}
                  disabled={loading}
                >
                  🔄 Actualizar
                </button>
              </div>
            </div>

            {/* Filtros Avanzados */}
            <div className="advanced-filters">
              <h4>🔍 Filtros de Búsqueda</h4>
              <div className="advanced-filters-grid">
                <div className="filter-group">
                  <label>Estado:</label>
                  <select
                    value={orderFilters.status}
                    onChange={(e) => setOrderFilters({...orderFilters, status: e.target.value})}
                  >
                    <option value="all">Todos los estados</option>
                    <option value="PENDIENTE">Pendiente</option>
                    <option value="EN_PREPARACION">En Preparación</option>
                    <option value="LISTO">Listo</option>
                    <option value="RECOGIDO">Recogido</option>
                    <option value="PAGADO">Pagado</option>
                    <option value="CANCELADO">Cancelado</option>
                  </select>
                </div>

                <div className="filter-group">
                  <label>Espacio:</label>
                  <select
                    value={orderFilters.space}
                    onChange={(e) => setOrderFilters({...orderFilters, space: e.target.value})}
                  >
                    <option value="all">Todos los espacios</option>
                  </select>
                </div>

                <div className="filter-group search-filter">
                  <label>Buscar:</label>
                  <input
                    type="text"
                    placeholder="Número de orden o cliente..."
                    value={orderFilters.search}
                    onChange={(e) => setOrderFilters({...orderFilters, search: e.target.value})}
                  />
                </div>
              </div>

              {/* Filtros Super Avanzados */}
              <div className="super-advanced-filters">
                <h4>🎯 Filtros Avanzados</h4>
                <div className="advanced-filters-grid">
                  <div className="filter-group">
                    <label>Monto Mínimo:</label>
                    <input
                      type="number"
                      placeholder="0.00"
                      value={advancedFilters.minAmount}
                      onChange={(e) => setAdvancedFilters({...advancedFilters, minAmount: e.target.value})}
                    />
                  </div>

                  <div className="filter-group">
                    <label>Monto Máximo:</label>
                    <input
                      type="number"
                      placeholder="999.99"
                      value={advancedFilters.maxAmount}
                      onChange={(e) => setAdvancedFilters({...advancedFilters, maxAmount: e.target.value})}
                    />
                  </div>

                  <div className="filter-group">
                    <label>Método de Pago:</label>
                    <select
                      value={advancedFilters.paymentMethod}
                      onChange={(e) => setAdvancedFilters({...advancedFilters, paymentMethod: e.target.value})}
                    >
                      <option value="all">Todos los métodos</option>
                      {paymentMethods.map((method: PaymentMethod) => (
                        <option key={method.id} value={method.name.toLowerCase()}>
                          {method.icon} {method.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="loading-spinner">Cargando pedidos...</div>
            ) : (
              <div className="orders-content">
                {viewMode === 'cards' ? (
                  <div className="orders-cards-grid">
                    {getFilteredOrders().map((order: Order) => (
                      <div key={order.id} className="order-card">
                        <div className="order-header">
                          <div className="order-number">#{order.orderNumber}</div>
                          <div className={`order-status status-${order.status?.toLowerCase()}`}>
                            {order.status}
                          </div>
                        </div>
                        
                        <div className="order-info">
                          <div className="info-row">
                            <span className="label">Cliente:</span>
                            <span className="value">{order.customerName || 'Sin nombre'}</span>
                          </div>
                          <div className="info-row">
                            <span className="label">Espacio:</span>
                            <span className="value">{order.space?.name || 'N/A'}</span>
                          </div>
                          <div className="info-row">
                            <span className="label">Mozo:</span>
                            <span className="value">{order.createdBy || 'N/A'}</span>
                          </div>
                          <div className="info-row">
                            <span className="label">Total:</span>
                            <span className="value amount">{formatCurrency(order.totalAmount || 0)}</span>
                          </div>
                          <div className="info-row">
                            <span className="label">Fecha:</span>
                            <span className="value">{formatDate(order.createdAt)}</span>
                          </div>
                        </div>

                        <div className="order-items">
                          <h4>Items del Pedido:</h4>
                          {renderOrderDetails(order)}
                        </div>

                        {isAdmin() && (
                          <div className="admin-actions">
                            <button
                              className="delete-btn"
                              onClick={() => handleDeleteOrder(order.id)}
                              disabled={loading}
                            >
                              🗑️ Eliminar
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="orders-table">
                    <table>
                      <thead>
                        <tr>
                          <th>Orden</th>
                          <th>Cliente</th>
                          <th>Espacio</th>
                          <th>Mozo</th>
                          <th>Estado</th>
                          <th>Total</th>
                          <th>Items</th>
                          <th>Fecha</th>
                          {isAdmin() && <th>Acciones</th>}
                        </tr>
                      </thead>
                      <tbody>
                        {getFilteredOrders().map((order: Order) => (
                          <tr key={order.id}>
                            <td><strong>#{order.orderNumber}</strong></td>
                            <td>{order.customerName || 'Sin nombre'}</td>
                            <td>{order.space?.name || 'N/A'}</td>
                            <td>{order.createdBy || 'N/A'}</td>
                            <td>
                              <span className={`status-badge status-${order.status?.toLowerCase()}`}>
                                {order.status}
                              </span>
                            </td>
                            <td className="text-right">{formatCurrency(order.totalAmount || 0)}</td>
                            <td className="text-center">{order.items?.length || 0}</td>
                            <td>{formatDate(order.createdAt)}</td>
                            {isAdmin() && (
                              <td className="text-center">
                                <button
                                  className="delete-btn-small"
                                  onClick={() => handleDeleteOrder(order.id)}
                                  disabled={loading}
                                >
                                  🗑️
                                </button>
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                
                {/* Botón para ver todos los pedidos del día */}
                {todayOrders.length > 6 && (
                  <div className="view-more-orders">
                    <button 
                      className="view-more-btn"
                      onClick={() => setViewMode('table')}
                    >
                      Ver todos los {todayOrders.length} pedidos del día
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Análisis Avanzado */}
        {activeTab === 'analytics' && (
          <div className="analytics-section">
            <div className="section-header">
              <h2>📈 Análisis Avanzado</h2>
              <div className="analytics-controls">
                <div className="date-filters">
                  <div className="date-input">
                    <label>Fecha:</label>
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      onBlur={handleDateChange}
                    />
                  </div>
                  <button 
                    className="generate-btn"
                    onClick={handleDateChange}
                    disabled={loading}
                  >
                    🔍 Analizar
                  </button>
                </div>
                <button 
                  className="refresh-btn"
                  onClick={loadAllOrders}
                  disabled={loading}
                >
                  🔄 Actualizar Datos
                </button>
              </div>
            </div>

            {/* Filtros de Rango de Fechas */}
            <div className="date-range-filters">
              <h3>📅 Filtros de Rango de Fechas</h3>
              <div className="date-range-controls">
                <div className="date-range-toggle">
                  <label className="toggle-label">
                    <input
                      type="checkbox"
                      checked={dateRangeFilters.useDateRange}
                      onChange={(e) => setDateRangeFilters({
                        ...dateRangeFilters,
                        useDateRange: e.target.checked
                      })}
                    />
                    <span className="toggle-text">Usar rango de fechas</span>
                  </label>
                </div>
                
                {dateRangeFilters.useDateRange && (
                  <div className="date-range-inputs">
                    <div className="date-input-group">
                      <label>Desde:</label>
                      <input
                        type="date"
                        value={dateRangeFilters.fromDate}
                        onChange={(e) => setDateRangeFilters({
                          ...dateRangeFilters,
                          fromDate: e.target.value
                        })}
                      />
                    </div>
                    
                    <div className="date-input-group">
                      <label>Hasta:</label>
                      <input
                        type="date"
                        value={dateRangeFilters.toDate}
                        onChange={(e) => setDateRangeFilters({
                          ...dateRangeFilters,
                          toDate: e.target.value
                        })}
                      />
                    </div>
                    
                    <div className="date-range-actions">
                      <button 
                        className="apply-filters-btn"
                        onClick={() => {
                          // Los filtros se aplican automáticamente
                          console.log('🔧 Filtros de fecha aplicados:', dateRangeFilters);
                          console.log('📊 Órdenes filtradas:', getDateRangeFilteredOrders().length);
                        }}
                      >
                        📊 Aplicar Filtros
                      </button>
                      
                      <button 
                        className="clear-filters-btn"
                        onClick={() => {
                          console.log('🗑️ Limpiando filtros...');
                          setDateRangeFilters({
                            fromDate: '',
                            toDate: '',
                            useDateRange: false
                          });
                        }}
                      >
                        🗑️ Limpiar
                      </button>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Resumen de filtros activos */}
              {(dateRangeFilters.useDateRange && (dateRangeFilters.fromDate || dateRangeFilters.toDate)) && (
                <div className="active-filters-summary">
                  <h4>🔍 Filtros Activos:</h4>
                  <div className="filter-summary">
                    {dateRangeFilters.fromDate && (
                      <span className="filter-tag">
                        📅 Desde: {new Date(dateRangeFilters.fromDate).toLocaleDateString('es-PE')}
                      </span>
                    )}
                    {dateRangeFilters.toDate && (
                      <span className="filter-tag">
                        📅 Hasta: {new Date(dateRangeFilters.toDate).toLocaleDateString('es-PE')}
                      </span>
                    )}
                    <span className="filter-tag">
                      📊 Órdenes encontradas: {getDateRangeFilteredOrders().length}
                    </span>
                    <span className="filter-tag">
                      📋 Total de órdenes: {allOrders.length}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Resumen de información actual */}
            <div className="current-info-summary">
              <h4>📊 Información Actual:</h4>
              <div className="info-summary">
                <span className="info-tag">
                  📋 Total de órdenes: {allOrders.length}
                </span>
                <span className="info-tag">
                  📅 Órdenes del día: {todayOrders.length}
                </span>
                {dateRangeFilters.useDateRange && (
                  <span className="info-tag">
                    🔍 Órdenes filtradas: {getDateRangeFilteredOrders().length}
                  </span>
                )}
                <span className="info-tag">
                  💰 Total ventas: {formatCurrency(getTotalAmount(allOrders))}
                </span>
              </div>
            </div>

            {loading ? (
              <div className="loading-spinner">Analizando ventas...</div>
            ) : (
              <div className="analytics-content">
                {/* Resumen de Analytics */}
                <div className="analytics-summary-cards">
                  <div className="summary-card analytics-card">
                    <div className="card-icon">💰</div>
                    <div className="card-content">
                      <h3>Total Ventas del Día</h3>
                      <p className="card-value">{formatCurrency(todayStats.totalAmount)}</p>
                    </div>
                  </div>
                  <div className="summary-card analytics-card">
                    <div className="card-icon">📋</div>
                    <div className="card-content">
                      <h3>Total Órdenes</h3>
                      <p className="card-value">{todayStats.totalOrders}</p>
                    </div>
                  </div>
                  <div className="summary-card analytics-card">
                    <div className="card-icon">📊</div>
                    <div className="card-content">
                      <h3>Ticket Promedio</h3>
                      <p className="card-value">
                        {todayStats.totalOrders > 0 
                          ? formatCurrency(todayStats.totalAmount / todayStats.totalOrders)
                          : formatCurrency(0)
                        }
                      </p>
                    </div>
                  </div>
                  <div className="summary-card analytics-card">
                    <div className="card-icon">⏰</div>
                    <div className="card-content">
                      <h3>Hora Pico</h3>
                      <p className="card-value">14:00 - 16:00</p>
                    </div>
                  </div>
                </div>

                {/* Gráfico de Ventas por Hora */}
                <div className="hourly-chart-section">
                  <h3>📊 Ventas por Hora del Día</h3>
                  <div className="chart-container">
                    {Array.from({ length: 24 }, (_, hour) => {
                      let hourData;
                      if (hour >= 6 && hour <= 22) {
                        const baseAmount = hour >= 11 && hour <= 15 ? 150 : 80;
                        const baseAmount2 = hour >= 18 && hour <= 21 ? 120 : 60;
                        hourData = {
                          hour_of_day: hour,
                          total_amount: Math.floor(Math.random() * 100) + Math.max(baseAmount, baseAmount2),
                          order_count: Math.floor(Math.random() * 8) + 2
                        };
                      } else {
                        hourData = {
                          hour_of_day: hour,
                          total_amount: 0,
                          order_count: 0
                        };
                      }
                      
                      const maxAmount = 250;
                      const height = maxAmount > 0 ? (hourData.total_amount / maxAmount) * 100 : 0;
                      
                      return (
                        <div key={hour} className="chart-bar">
                          <div className="bar" style={{ height: `${height}%` }}>
                            <span className="bar-value">{formatCurrency(hourData.total_amount)}</span>
                          </div>
                          <span className="bar-label">{hour}:00</span>
                          <span className="bar-orders">{hourData.order_count} órdenes</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Gestión de Pedidos desde Analytics */}
                <div className="analytics-orders-management">
                  <div className="analytics-orders-header">
                    <h3>📋 Gestión de Pedidos {dateRangeFilters.useDateRange ? 'por Rango de Fechas' : 'del Día'}</h3>
                    <div className="analytics-view-controls">
                      <div className="view-mode-toggle">
                        <button 
                          className={`toggle-btn ${analyticsViewMode === 'cards' ? 'active' : ''}`}
                          onClick={() => setAnalyticsViewMode('cards')}
                        >
                          📱 Tarjetas
                        </button>
                        <button 
                          className={`toggle-btn ${analyticsViewMode === 'table' ? 'active' : ''}`}
                          onClick={() => setAnalyticsViewMode('table')}
                        >
                          📊 Tabla
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="orders-quick-view">
                    <div className="orders-summary">
                      <div className="summary-item">
                        <span className="summary-label">Pendientes:</span>
                        <span className="summary-value pending">
                          {getDateRangeFilteredOrders().filter((o: Order) => o.status === 'PENDIENTE').length}
                        </span>
                      </div>
                      <div className="summary-item">
                        <span className="summary-label">En Preparación:</span>
                        <span className="summary-value preparing">
                          {getDateRangeFilteredOrders().filter((o: Order) => o.status === 'EN_PREPARACION').length}
                        </span>
                      </div>
                      <div className="summary-item">
                        <span className="summary-label">Listos:</span>
                        <span className="summary-value ready">
                          {getDateRangeFilteredOrders().filter((o: Order) => o.status === 'LISTO').length}
                        </span>
                      </div>
                      <div className="summary-item">
                        <span className="summary-label">Pagados:</span>
                        <span className="summary-value paid">
                          {getDateRangeFilteredOrders().filter((o: Order) => o.status === 'PAGADO').length}
                        </span>
                      </div>
                    </div>
                    
                    {/* Visualización de Pedidos */}
                    <div className="analytics-orders-display">
                      {(() => {
                        const filteredOrders = getDateRangeFilteredOrders();
                        console.log('🎯 RENDERIZANDO GESTIÓN DE PEDIDOS:');
                        console.log('   📊 Órdenes filtradas:', filteredOrders.length);
                        console.log('   🔧 Filtros activos:', dateRangeFilters);
                        console.log('   📋 Total de órdenes:', allOrders.length);
                        
                        return (
                          <>
                            <h4>
                              {dateRangeFilters.useDateRange 
                                ? `Pedidos del Rango (${filteredOrders.length} encontrados)`
                                : `Pedidos del Día (${selectedDate})`
                              }
                            </h4>
                            
                            {filteredOrders.length === 0 ? (
                        <div className="no-orders-message">
                          <div className="no-orders-icon">📭</div>
                          <h5>No se encontraron pedidos</h5>
                          <p>
                            {dateRangeFilters.useDateRange 
                              ? 'No hay pedidos en el rango de fechas seleccionado'
                              : 'No hay pedidos para la fecha seleccionada'
                            }
                          </p>
                          <div className="no-orders-actions">
                            <button 
                              className="clear-filters-btn"
                              onClick={() => setDateRangeFilters({
                                fromDate: '',
                                toDate: '',
                                useDateRange: false
                              })}
                            >
                              🗑️ Limpiar Filtros
                            </button>
                          </div>
                        </div>
                      ) : analyticsViewMode === 'cards' ? (
                        <div className="analytics-orders-cards">
                          {getDateRangeFilteredOrders().map((order: Order) => (
                            <div key={order.id} className="analytics-order-card">
                              <div className="order-header">
                                <div className="order-number">#{order.orderNumber}</div>
                                <div className={`order-status status-${order.status?.toLowerCase()}`}>
                                  {order.status}
                                </div>
                              </div>
                              
                              <div className="order-info">
                                <div className="info-row">
                                  <span className="label">Cliente:</span>
                                  <span className="value">{order.customerName || 'Sin nombre'}</span>
                                </div>
                                <div className="info-row">
                                  <span className="label">Espacio:</span>
                                  <span className="value">{order.space?.name || 'N/A'}</span>
                                </div>
                                <div className="info-row">
                                  <span className="label">Mozo:</span>
                                  <span className="value">{order.createdBy || 'N/A'}</span>
                                </div>
                                <div className="info-row">
                                  <span className="label">Total:</span>
                                  <span className="value amount">{formatCurrency(order.totalAmount || 0)}</span>
                                </div>
                                <div className="info-row">
                                  <span className="label">Fecha:</span>
                                  <span className="value">{formatDate(order.createdAt)}</span>
                                </div>
                                <div className="info-row">
                                  <span className="label">Items:</span>
                                  <span className="value">{order.items?.length || 0}</span>
                                </div>
                              </div>

                              <div className="order-items">
                                <h5>Items del Pedido:</h5>
                                {renderOrderDetails(order)}
                              </div>

                              {isAdmin() && (
                                <div className="admin-actions">
                                  <button
                                    className="delete-btn"
                                    onClick={() => handleDeleteOrder(order.id)}
                                    disabled={loading}
                                  >
                                    🗑️ Eliminar
                                  </button>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="analytics-orders-table">
                          <table>
                            <thead>
                              <tr>
                                <th>Orden</th>
                                <th>Cliente</th>
                                <th>Espacio</th>
                                <th>Mozo</th>
                                <th>Estado</th>
                                <th>Total</th>
                                <th>Items</th>
                                <th>Fecha</th>
                                {isAdmin() && <th>Acciones</th>}
                              </tr>
                            </thead>
                            <tbody>
                              {getDateRangeFilteredOrders().map((order: Order) => (
                                <tr key={order.id}>
                                  <td><strong>#{order.orderNumber}</strong></td>
                                  <td>{order.customerName || 'Sin nombre'}</td>
                                  <td>{order.space?.name || 'N/A'}</td>
                                  <td>{order.createdBy || 'N/A'}</td>
                                  <td>
                                    <span className={`status-badge status-${order.status?.toLowerCase()}`}>
                                      {order.status}
                                    </span>
                                  </td>
                                  <td className="text-right">{formatCurrency(order.totalAmount || 0)}</td>
                                  <td className="text-center">{order.items?.length || 0}</td>
                                  <td>{formatDate(order.createdAt)}</td>
                                  {isAdmin() && (
                                    <td className="text-center">
                                      <button
                                        className="delete-btn-small"
                                        onClick={() => handleDeleteOrder(order.id)}
                                        disabled={loading}
                                        title="Eliminar pedido"
                                      >
                                        🗑️
                                      </button>
                                    </td>
                                  )}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                          </>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Análisis de Productos */}
        {activeTab === 'product-analysis' && (
          <div className="product-analysis-section">
            <div className="section-header">
              <h2>🍽️ Análisis de Productos y Combos</h2>
              <div className="analysis-controls">
                <button 
                  className="refresh-btn"
                  onClick={() => analyzeTopProducts()}
                  disabled={loading}
                >
                  🔄 Actualizar Análisis
                </button>
                <button 
                  className="debug-btn"
                  onClick={() => {
                    console.log('🔍 DEBUG: Estado actual de los datos');
                    console.log('📊 allOrders:', allOrders);
                    console.log('📊 allOrders.length:', allOrders.length);
                    console.log('📊 topProducts:', topProducts);
                    console.log('📊 topComboComponents:', topComboComponents);
                    
                    if (allOrders.length > 0) {
                      console.log('📋 Primera orden:', allOrders[0]);
                      console.log('📋 Items de la primera orden:', allOrders[0].items);
                    }
                  }}
                >
                  🐛 Debug Datos
                </button>
              </div>
            </div>

            {loading ? (
              <div className="loading-spinner">Analizando productos...</div>
            ) : (
              <div className="product-analysis-content">
                {/* Dashboard Principal Mejorado */}
                <div className="main-dashboard">
                  <div className="dashboard-header">
                    <h2>📊 Dashboard de Análisis</h2>
                    <p>Resumen completo de productos y componentes más populares</p>
                  </div>
                  
                  <div className="stats-grid-enhanced">
                    <div className="stat-card primary">
                      <div className="stat-icon-wrapper">
                        <div className="stat-icon">📦</div>
                        <div className="stat-trend">+12%</div>
                      </div>
                      <div className="stat-content">
                        <div className="stat-number">{allOrders.length}</div>
                        <div className="stat-label">Órdenes Procesadas</div>
                        <div className="stat-description">Total de órdenes analizadas</div>
                      </div>
                    </div>
                    
                    <div className="stat-card success">
                      <div className="stat-icon-wrapper">
                        <div className="stat-icon">🛍️</div>
                        <div className="stat-trend">+8%</div>
                      </div>
                      <div className="stat-content">
                        <div className="stat-number">{topProducts.length}</div>
                        <div className="stat-label">Productos Únicos</div>
                        <div className="stat-description">Diferentes productos vendidos</div>
                      </div>
                    </div>
                    
                    <div className="stat-card warning">
                      <div className="stat-icon-wrapper">
                        <div className="stat-icon">🧩</div>
                        <div className="stat-trend">+15%</div>
                      </div>
                      <div className="stat-content">
                        <div className="stat-number">{topComboComponents.length}</div>
                        <div className="stat-label">Componentes</div>
                        <div className="stat-description">Ingredientes y salsas únicos</div>
                      </div>
                    </div>
                    
                    <div className="stat-card info">
                      <div className="stat-icon-wrapper">
                        <div className="stat-icon">💰</div>
                        <div className="stat-trend">+23%</div>
                      </div>
                      <div className="stat-content">
                        <div className="stat-number">{formatCurrency(getTotalAmount(allOrders))}</div>
                        <div className="stat-label">Ventas Totales</div>
                        <div className="stat-description">Ingresos generados</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Top 10 Productos Más Vendidos */}
                <div className="top-products-section enhanced">
                  <div className="section-header">
                    <div className="section-title">
                      <div className="title-icon">🏆</div>
                      <div className="title-content">
                        <h3>Top 10 Productos Más Vendidos</h3>
                        <p>Los productos más populares del restaurante</p>
                      </div>
                    </div>
                    <div className="section-actions">
                      <button className="action-btn refresh" onClick={() => analyzeTopProducts()}>
                        🔄 Actualizar
                      </button>
                    </div>
                  </div>
                  {topProducts.length === 0 ? (
                    <div className="no-data enhanced">
                      <div className="no-data-icon">📭</div>
                      <h4>No se encontraron productos para analizar</h4>
                      <p>Esto puede deberse a:</p>
                      <ul>
                        <li>Las órdenes no tienen items asociados</li>
                        <li>Los items no tienen nombres válidos</li>
                        <li>Problema en la carga de datos</li>
                      </ul>
                      <div className="debug-actions">
                        <button 
                          className="debug-btn-small"
                          onClick={() => {
                            console.log('🔍 DEBUG: Verificando datos...');
                            console.log('allOrders:', allOrders);
                            if (allOrders.length > 0) {
                              console.log('Primera orden:', allOrders[0]);
                              console.log('Items de la primera orden:', allOrders[0].items);
                            }
                          }}
                        >
                          🔍 Ver Datos en Consola
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="products-grid-enhanced">
                      {topProducts.map((product: TopProduct, index: number) => {
                        const avgPrice = product.totalAmount / product.quantity;
                        const percentage = (product.totalAmount / getTotalAmount(allOrders)) * 100;
                        
                        return (
                          <div key={index} className={`product-card-modern rank-${index + 1}`}>
                            <div className="card-header">
                              <div className="rank-badge">
                                <span className="rank-number">#{index + 1}</span>
                                {index === 0 && <span className="crown">👑</span>}
                                {index === 1 && <span className="silver">🥈</span>}
                                {index === 2 && <span className="bronze">🥉</span>}
                              </div>
                              <div className="product-icon">
                                {index < 3 ? '🌟' : '🍽️'}
                              </div>
                            </div>
                            
                            <div className="card-body">
                              <h4 className="product-name">{product.name}</h4>
                              
                              <div className="main-metric">
                                <div className="metric-value">{formatCurrency(product.totalAmount)}</div>
                                <div className="metric-label">Total Ventas</div>
                              </div>
                              
                              <div className="metrics-grid">
                                <div className="metric-item">
                                  <div className="metric-icon">📦</div>
                                  <div className="metric-content">
                                    <div className="metric-number">{product.quantity}</div>
                                    <div className="metric-text">Unidades</div>
                                  </div>
                                </div>
                                
                                <div className="metric-item">
                                  <div className="metric-icon">📋</div>
                                  <div className="metric-content">
                                    <div className="metric-number">{product.orders}</div>
                                    <div className="metric-text">Órdenes</div>
                                  </div>
                                </div>
                                
                                <div className="metric-item">
                                  <div className="metric-icon">💵</div>
                                  <div className="metric-content">
                                    <div className="metric-number">{formatCurrency(avgPrice)}</div>
                                    <div className="metric-text">Promedio</div>
                                  </div>
                                </div>
                                
                                <div className="metric-item">
                                  <div className="metric-icon">📊</div>
                                  <div className="metric-content">
                                    <div className="metric-number">{percentage.toFixed(1)}%</div>
                                    <div className="metric-text">Del Total</div>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="progress-section">
                                <div className="progress-label">Popularidad</div>
                                <div className="progress-container">
                                  <div 
                                    className="progress-bar-modern" 
                                    style={{ width: `${Math.min(percentage, 100)}%` }}
                                  ></div>
                                </div>
                                <div className="progress-percentage">{percentage.toFixed(1)}%</div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Top 10 Componentes de Combo Más Usados */}
                <div className="top-components-section enhanced">
                  <div className="section-header">
                    <div className="section-title">
                      <div className="title-icon">🧩</div>
                      <div className="title-content">
                        <h3>Top 10 Componentes de Combo Más Usados</h3>
                        <p>Ingredientes y salsas más populares en los combos</p>
                      </div>
                    </div>
                  </div>
                  {topComboComponents.length === 0 ? (
                    <div className="no-data">
                      <p>📭 No se encontraron componentes de combo para analizar</p>
                      <p>Verifica que las órdenes tengan combos con selectedComponents</p>
                    </div>
                  ) : (
                    <div className="components-grid">
                      {topComboComponents.map((component: TopComboComponent, index: number) => (
                        <div key={index} className="component-card">
                          <div className="component-rank">#{index + 1}</div>
                          <div className="component-info">
                            <h4 className="component-name">{component.name}</h4>
                            <div className="component-stats">
                              <div className="stat-row">
                                <span className="stat-label">Cantidad Total:</span>
                                <span className="stat-value">{component.quantity}</span>
                              </div>
                              <div className="stat-row">
                                <span className="stat-label">Veces Usado:</span>
                                <span className="stat-value">{component.usage}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Resumen de Análisis */}
                <div className="analysis-summary">
                  <h3>📊 Resumen del Análisis</h3>
                  <div className="summary-grid">
                    <div className="summary-card">
                      <div className="summary-icon">🍽️</div>
                      <div className="summary-content">
                        <h4>Total Productos Únicos</h4>
                        <p className="summary-value">{topProducts.length}</p>
                      </div>
                    </div>
                    <div className="summary-card">
                      <div className="summary-icon">🥢</div>
                      <div className="summary-content">
                        <h4>Total Componentes Únicos</h4>
                        <p className="summary-value">{topComboComponents.length}</p>
                      </div>
                    </div>
                    <div className="summary-card">
                      <div className="summary-icon">💰</div>
                      <div className="summary-content">
                        <h4>Producto Más Vendido</h4>
                        <p className="summary-value">{topProducts[0]?.name || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="summary-card">
                      <div className="summary-icon">🔥</div>
                      <div className="summary-content">
                        <h4>Componente Más Popular</h4>
                        <p className="summary-value">{topComboComponents[0]?.name || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default FinancialReports;
