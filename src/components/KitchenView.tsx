import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { orderService, catalogService } from '../services/api';
import { Order, Product } from '../types';
import './KitchenView.css';

const KitchenView: React.FC = () => {
  const location = useLocation();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const [itemNotes, setItemNotes] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [forceUpdate, setForceUpdate] = useState(0);

  useEffect(() => {
    loadKitchenOrders();
    loadProducts();
    
    // Actualizar órdenes cada 10 segundos para detectar cambios más rápido
    const ordersInterval = setInterval(loadKitchenOrders, 10000);
    
    // Actualizar temporizadores cada segundo para cronómetro en tiempo real
    const timerInterval = setInterval(() => {
      setCurrentTime(new Date()); // Actualizar tiempo actual para cronómetros
      setForceUpdate(prev => prev + 1); // Forzar re-renderizado del cronómetro
    }, 1000);
    
    return () => {
      clearInterval(ordersInterval);
      clearInterval(timerInterval);
    };
  }, []);

  // Efecto para recargar órdenes cuando se navega a esta vista
  useEffect(() => {
    const handleFocus = () => {
      console.log('🔄 Vista de cocina enfocada - Recargando órdenes...');
      loadKitchenOrders();
    };

    // Recargar cuando la ventana recibe foco
    window.addEventListener('focus', handleFocus);
    
    // Recargar inmediatamente al montar el componente
    handleFocus();

    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  // Efecto para detectar navegación desde creación de orden
  useEffect(() => {
    if (location.state?.refresh) {
      console.log('🆕 Navegación desde creación de orden - Forzando recarga...');
      // Pequeño delay para asegurar que la orden se haya guardado
      setTimeout(() => {
        loadKitchenOrders();
      }, 1000);
    }
  }, [location.state]);

  const loadKitchenOrders = async () => {
    try {
      console.log('🔄 Cargando órdenes de cocina...');
      const ordersData = await orderService.getKitchenOrders();
      console.log('📋 Órdenes recibidas del backend:', ordersData);
      
      // Procesar órdenes nuevas: automáticamente cambiar PENDIENTE a EN_PREPARACION
      const processedOrders = await Promise.all(
        ordersData.map(async (order: Order) => {
          if (order.status === 'PENDIENTE') {
            try {
              console.log(`🔄 Cambiando orden ${order.orderNumber} de PENDIENTE a EN_PREPARACION`);
              // Cambiar automáticamente a EN_PREPARACION y guardar timestamp
              const now = new Date().toISOString();
              await orderService.updateOrderStatus(order.id, { status: 'EN_PREPARACION' });
              return { 
                ...order, 
                status: 'EN_PREPARACION',
                updatedAt: now // Guardar el momento exacto que llegó a cocina
              };
            } catch (err) {
              console.error('Error auto-updating order status:', err);
              return order;
            }
          }
          return order;
        })
      );
      
      console.log('✅ Órdenes de cocina procesadas:', processedOrders);
      console.log('📊 Total de órdenes:', processedOrders.length);
      processedOrders.forEach(order => {
        console.log(`  - ${order.orderNumber}: ${order.status} | Creada: ${order.createdAt} | Items: ${order.items?.length || 0}`);
      });
      
      setOrders(processedOrders);
    } catch (err: any) {
      setError(err.message || 'Error al cargar órdenes de cocina');
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async () => {
    try {
      const productsData = await catalogService.getProducts();
      setProducts(productsData);
    } catch (err: any) {
      console.error('Error loading products:', err);
    }
  };

  const updateOrderStatus = async (orderId: string, statusData: { status: string }) => {
    try {
      await orderService.updateOrderStatus(orderId, statusData);
      await loadKitchenOrders(); // Recargar órdenes
    } catch (err: any) {
      console.error('Error updating order status:', err);
      alert('Error al actualizar el estado de la orden');
    }
  };

  const openUpdateModal = (order: Order) => {
    setSelectedOrder(order);
    setShowUpdateModal(true);
    setSelectedProduct('');
    setQuantity(1);
    setItemNotes('');
  };

  const closeUpdateModal = () => {
    setShowUpdateModal(false);
    setSelectedOrder(null);
  };

  // Función para renderizar la personalización del combo de manera elegante
  const renderComboCustomization = (notes: string) => {
    try {
      // Buscar si hay JSON en las notas
      const jsonMatch = notes.match(/\{.*\}/);
      if (!jsonMatch) return null;
      
      const customization = JSON.parse(jsonMatch[0]);
      
      return (
        <div className="combo-customization-natural">
          {/* Sabores seleccionados */}
          {customization.selectedComponents?.SABOR && customization.selectedComponents.SABOR.length > 0 && (
            <div className="customization-note">
              <span className="note-icon">🍣</span>
              <span className="note-text">
                <strong>Sabores:</strong> {customization.selectedComponents.SABOR.map((sabor: any, idx: number) => {
                  const name = typeof sabor === 'string' ? sabor : sabor.name;
                  const quantity = typeof sabor === 'object' && sabor.quantity ? sabor.quantity : 1;
                  return `${quantity > 1 ? `${quantity}x ` : ''}${name}`;
                }).join(', ')}
              </span>
            </div>
          )}
          
          {/* Complementos seleccionados */}
          {customization.selectedComponents?.COMPLEMENTO && customization.selectedComponents.COMPLEMENTO.length > 0 && (
            <div className="customization-note">
              <span className="note-icon">🥗</span>
              <span className="note-text">
                <strong>Complementos:</strong> {customization.selectedComponents.COMPLEMENTO.join(', ')}
              </span>
            </div>
          )}
          
          {/* Bebidas seleccionadas */}
          {customization.selectedComponents?.BEBIDA && customization.selectedComponents.BEBIDA.length > 0 && (
            <div className="customization-note">
              <span className="note-icon">🥤</span>
              <span className="note-text">
                <strong>Bebidas:</strong> {customization.selectedComponents.BEBIDA.join(', ')}
              </span>
            </div>
          )}
          
          {/* Postres seleccionados */}
          {customization.selectedComponents?.POSTRE && customization.selectedComponents.POSTRE.length > 0 && (
            <div className="customization-note">
              <span className="note-icon">🍰</span>
              <span className="note-text">
                <strong>Postres:</strong> {customization.selectedComponents.POSTRE.join(', ')}
              </span>
            </div>
          )}
          
          {/* Salsas seleccionadas */}
          {customization.selectedComponents?.SALSA && customization.selectedComponents.SALSA.length > 0 && (
            <div className="customization-note">
              <span className="note-icon">🥢</span>
              <span className="note-text">
                <strong>Salsas:</strong> {customization.selectedComponents.SALSA.join(', ')}
              </span>
            </div>
          )}
          
          {/* Salsas adicionales */}
          {customization.selectedSauces && customization.selectedSauces.length > 0 && (
            <div className="customization-note">
              <span className="note-icon">🍶</span>
              <span className="note-text">
                <strong>Salsas Adicionales:</strong> {customization.selectedSauces.map((salsa: any) => {
                  const name = typeof salsa === 'string' ? salsa : salsa.name;
                  const quantity = typeof salsa === 'object' && salsa.quantity ? salsa.quantity : 1;
                  return `${quantity > 1 ? `${quantity}x ` : ''}${name}`;
                }).join(', ')}
              </span>
            </div>
          )}
          
          {/* Palitos */}
          {(customization.normalChopsticks > 0 || customization.assistedChopsticks > 0) && (
            <div className="customization-note">
              <span className="note-icon">🥢</span>
              <span className="note-text">
                <strong>Palitos:</strong> {
                  [
                    customization.normalChopsticks > 0 ? `${customization.normalChopsticks} normales` : '',
                    customization.assistedChopsticks > 0 ? `${customization.assistedChopsticks} con ayuda` : ''
                  ].filter(Boolean).join(', ')
                }
              </span>
            </div>
          )}
          
          {/* Notas especiales */}
          {customization.specialNotes && (
            <div className="customization-note">
              <span className="note-icon">📝</span>
              <span className="note-text">
                <strong>Notas Especiales:</strong> {customization.specialNotes}
              </span>
            </div>
          )}
        </div>
      );
    } catch (error) {
      console.error('Error parsing combo customization:', error);
      return null;
    }
  };

  const addItemToOrder = async () => {
    if (!selectedOrder || !selectedProduct || quantity <= 0) {
      alert('Por favor completa todos los campos');
      return;
    }

    try {
      const product = products.find(p => p.id === selectedProduct);
      if (!product) {
        alert('Producto no encontrado');
        return;
      }

      // Crear el nuevo item
      const newItemData = {
        productId: selectedProduct,
        name: product.name,
        unitPrice: product.price,
        totalPrice: product.price * quantity,
        quantity: quantity,
        notes: itemNotes,
        status: 'PENDIENTE'
      };

      // TODO: Implementar endpoint para agregar items a una orden existente
      // Por ahora, solo mostramos un mensaje de confirmación
      console.log('Item a agregar:', newItemData);
      alert(`Item agregado: ${quantity}x ${product.name}`);
      closeUpdateModal();
      await loadKitchenOrders();
    } catch (err: any) {
      console.error('Error adding item:', err);
      alert('Error al agregar el item');
    }
  };

  const formatTime = (dateString: string | Date) => {
    return new Date(dateString).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDIENTE': return 'orange';
      case 'EN_PREPARACION': return 'blue';
      case 'LISTO': return 'green';
      case 'PAGADO': return 'gray';
      case 'CANCELADO': return 'red';
      default: return 'gray';
    }
  };

  const getStatusDisplayName = (status: string) => {
    switch (status) {
      case 'PENDIENTE': return 'Pendiente';
      case 'EN_PREPARACION': return 'En Preparación';
      case 'LISTO': return 'Listo';
      case 'PAGADO': return 'Pagado';
      case 'CANCELADO': return 'Cancelado';
      default: return status;
    }
  };

  const getNextStatus = (currentStatus: string) => {
    switch (currentStatus) {
      case 'EN_PREPARACION': return 'LISTO';
      default: return currentStatus;
    }
  };

  const getActionButtonText = (status: string) => {
    switch (status) {
      case 'EN_PREPARACION': return 'Marcar como Listo';
      default: return '';
    }
  };

  if (loading) {
    return (
      <div className="kitchen-container">
        <div className="loading">Cargando órdenes de cocina...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="kitchen-container">
        <div className="error">Error: {error}</div>
      </div>
    );
  }

  // Las órdenes pendientes se procesan automáticamente a EN_PREPARACION
  const inProgressOrders = orders.filter(order => order.status === 'EN_PREPARACION');
  const readyOrders = orders.filter(order => order.status === 'LISTO');
  const deliveredOrders = orders.filter(order => order.status === 'PAGADO');

  return (
    <div className="kitchen-container">
      <div className="kitchen-header">
        <h1>👨‍🍳 Vista de Cocina</h1>
        <p>Gestiona todos los pedidos del restaurante</p>
        <button onClick={loadKitchenOrders} className="refresh-btn">
          🔄 Actualizar
        </button>
        <button onClick={() => console.log('Estado actual de órdenes:', orders)} className="debug-btn">
          🐛 Debug
        </button>
        <button onClick={loadKitchenOrders} className="debug-btn">
          🔄 Recargar Órdenes
        </button>
      </div>





      {/* Vista de Cocina Tipo Ticket - Grid Organizado */}
      <div className="kitchen-tickets-section">
        <div className="kitchen-header-tickets">
          <h2>🎫 Tickets de Cocina - Vista Organizada</h2>
          <div className="tickets-summary">
            <span className="ticket-count active">{inProgressOrders.length} En Preparación</span>
            <span className="ticket-count ready">{readyOrders.length} Listas</span>
            <span className="ticket-count delivered">{deliveredOrders.length} Entregadas</span>
          </div>
        </div>
        
        {/* Grid de Tickets */}
        <div className="kitchen-tickets-grid">
          {inProgressOrders.map(order => {
            // Debug: verificar items de la orden
            console.log(`Orden ${order.orderNumber} - Items:`, order.items);
            
            // Calcular tiempo desde que la orden fue creada (el reloj debe correr desde el inicio)
            const startTime = order.createdAt;
            
            // Debug: Verificar que startTime existe y es válido
            if (!startTime) {
              console.error(`❌ Orden ${order.orderNumber} no tiene createdAt:`, order);
            }
            
            const startTimeDate = new Date(startTime);
            
            // Debug: Verificar si hay problema de zona horaria
            if (startTimeDate.getTime() > currentTime.getTime()) {
              console.warn(`⚠️ Orden ${order.orderNumber} tiene createdAt posterior a currentTime:`, {
                startTime: startTime,
                startTimeDate: startTimeDate.toISOString(),
                currentTime: currentTime.toISOString(),
                difference: startTimeDate.getTime() - currentTime.getTime()
              });
            }
            
            // Calcular tiempo transcurrido - SOLUCIÓN DEFINITIVA
            let elapsedSeconds;
            
            // El problema: las fechas de la BD están en UTC pero JavaScript las interpreta como local
            // Solución: forzar que startTime se interprete como UTC
            const startTimeString = startTime.toString();
            let utcStartTime;
            
            if (startTimeString.includes('Z')) {
              // Ya tiene 'Z', usar directamente
              utcStartTime = new Date(startTimeString);
            } else {
              // No tiene 'Z', agregarlo para forzar UTC
              utcStartTime = new Date(startTimeString + 'Z');
            }
            
            const timeDiff = currentTime.getTime() - utcStartTime.getTime();
            elapsedSeconds = Math.max(0, Math.floor(timeDiff / 1000));
            
            console.log(`⏰ Orden ${order.orderNumber} - Cálculo corregido:`, {
              currentTime: currentTime.toISOString(),
              startTime: startTime,
              startTimeString: startTimeString,
              utcStartTime: utcStartTime.toISOString(),
              timeDiff: timeDiff,
              elapsedSeconds: elapsedSeconds
            });
            
            // Formatear tiempo transcurrido para mostrar
            const hours = Math.floor(elapsedSeconds / 3600);
            const minutes = Math.floor((elapsedSeconds % 3600) / 60);
            const seconds = elapsedSeconds % 60;
            
            // Debug: Log para verificar el cálculo del tiempo
            console.log(`⏰ Orden ${order.orderNumber} - Timer Debug:`, {
              currentTime: currentTime.toISOString(),
              startTime: startTime,
              startTimeDate: startTimeDate.toISOString(),
              startTimeValid: !isNaN(startTimeDate.getTime()),
              timeDifference: currentTime.getTime() - startTimeDate.getTime(),
              elapsedSeconds: elapsedSeconds,
              hours: hours,
              minutes: minutes,
              seconds: seconds,
              formattedTime: `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
            });
            
            // Clasificar por tiempo: 0-15min verde, 15-20min amarillo, 20-30min rojo
            let timerClass = 'timer-green';
            let timerMessage = '🟢 En tiempo';
            
            if (elapsedSeconds >= 1200) {
              timerClass = 'timer-red';      // 20+ minutos (rojo)
              timerMessage = '🔴 Urgente - Más de 20 min';
            } else if (elapsedSeconds >= 900) {
              timerClass = 'timer-yellow';   // 15-20 minutos (amarillo)
              timerMessage = '🟡 Atención - Más de 15 min';
            } else {
              timerClass = 'timer-green';    // 0-15 minutos (verde)
              timerMessage = '🟢 En tiempo - Menos de 15 min';
            }
            
            // Detectar si la orden tiene items nuevos - LÓGICA CORREGIDA
            // Solo mostrar alertas si la orden fue ACTUALIZADA después de su creación inicial
            // NO mostrar alertas para órdenes recién creadas
            
            // 1. Verificar si la orden fue actualizada (updatedAt > createdAt + 10 segundos)
            const hasBeenUpdated = order.updatedAt && order.createdAt && 
              new Date(order.updatedAt).getTime() > new Date(order.createdAt).getTime() + 10000; // 10 segundos de diferencia
            
            // 2. Verificar si hay items agregados después de la creación inicial
            const hasItemsAddedLater = order.items && order.items.some((item: any) => {
              if (!item.createdAt) return false;
              return new Date(item.createdAt).getTime() > new Date(order.createdAt).getTime() + 10000;
            });
            
            // 3. Verificar si hay múltiples items (indicando actualización)
            const hasMultipleItems = order.items && order.items.length > 1;
            
            // 4. SOLO mostrar alertas si la orden fue realmente actualizada
            const finalHasNewItems = hasBeenUpdated && (hasItemsAddedLater || hasMultipleItems);
            
            console.log(`🔍 Orden ${order.orderNumber} - Detección de items nuevos:`, {
              hasBeenUpdated: hasBeenUpdated,
              hasItemsAddedLater: hasItemsAddedLater,
              hasMultipleItems: hasMultipleItems,
              finalHasNewItems: finalHasNewItems,
              itemsCount: order.items?.length || 0,
              createdAt: order.createdAt,
              updatedAt: order.updatedAt
            });
            
            // Debug: Log para verificar la detección de items nuevos
            console.log(`🔍 Orden ${order.orderNumber} - Debug:`, {
              createdAt: order.createdAt,
              updatedAt: order.updatedAt,
              timeDiff: order.updatedAt && order.createdAt ? new Date(order.updatedAt).getTime() - new Date(order.createdAt).getTime() : 0,
              itemsCount: order.items?.length || 0,
              hasBeenUpdated: hasBeenUpdated,
              hasItemsAddedLater: hasItemsAddedLater,
              finalHasNewItems: finalHasNewItems,
              elapsedSeconds: elapsedSeconds
            });
            
            // Calcular tiempo desde que se agregaron items nuevos
            const newItemsTime = finalHasNewItems ? order.updatedAt : null;
            const timeSinceNewItems = newItemsTime ? 
              Math.floor((currentTime.getTime() - new Date(newItemsTime).getTime()) / 1000) : 0;
            
            return (
              <div key={order.id} className={`kitchen-ticket ${finalHasNewItems ? 'has-new-items' : ''} ${timerClass}`}>
                {/* Header del Ticket */}
                <div className="ticket-header">
                  <div className="ticket-number">
                    <span className="ticket-label">TICKET</span>
                    <span className="ticket-id">#{order.orderNumber}</span>
                  </div>
                  <div className="ticket-status">
                    <span className={`status-indicator ${getStatusColor(order.status)}`}>
                      {getStatusDisplayName(order.status)}
                    </span>
                    {finalHasNewItems && (
                      <span className="new-items-indicator">🆕 NUEVO</span>
                    )}
                  </div>
                </div>

                {/* Información Principal del Ticket */}
                <div className="ticket-main-info">
                  <div className="ticket-meta">
                    <div className="meta-item">
                      <span className="meta-label">🏠 MESA:</span>
                      <span className="meta-value">{order.space?.name || 'Sin asignar'}</span>
                    </div>
                    <div className="meta-item">
                      <span className="meta-label">👤 CLIENTE:</span>
                      <span className="meta-value">{order.customerName || 'Sin nombre'}</span>
                    </div>
                    <div className="meta-item">
                      <span className="meta-label">🕐 HORA:</span>
                      <span className="meta-value">{formatTime(order.createdAt)}</span>
                    </div>
                    {finalHasNewItems && (
                      <div className="meta-item urgent">
                        <span className="meta-label">🆕 ACTUALIZADO:</span>
                        <span className="meta-value">{Math.floor(timeSinceNewItems / 60)}m {timeSinceNewItems % 60}s</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Temporizador del Ticket */}
                <div className={`ticket-timer ${timerClass}`}>
                  <div className="timer-display">
                    <span className="timer-icon">⏱️</span>
                    <span className="timer-time">
                      {hours.toString().padStart(2, '0')}:{minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
                    </span>
                    <span className="timer-message">{timerMessage}</span>
                  </div>
                  <div className="timer-progress-bar">
                    <div 
                      className="progress-fill" 
                      style={{ 
                        width: `${Math.min((elapsedSeconds / 1800) * 100, 100)}%`
                      }}
                    ></div>
                  </div>
                </div>

                {/* Items del Ticket */}
                <div className="ticket-items">
                  <div className="ticket-items-header">
                    <span className="items-title">🍽️ PEDIDO</span>
                    <span className="items-total">${(order.totalAmount || 0).toFixed(2)}</span>
                  </div>

                                  {/* ALERTA DE ACTUALIZACIÓN - Solo mostrar si hay items nuevos */}
                {finalHasNewItems && (
                  <div className="order-update-alert">
                    <div className="alert-header">
                      <span className="alert-icon">🚨</span>
                      <span className="alert-title">¡ORDEN ACTUALIZADA!</span>
                      <span className="alert-badge">NUEVA INFORMACIÓN</span>
                    </div>
                    <div className="alert-content">
                      <div className="price-update">
                        <span className="price-label">💰 Precio Total Actualizado:</span>
                        <span className="price-amount">${order.totalAmount?.toFixed(2) || '0.00'}</span>
                      </div>
                      <div className="items-update">
                        <span className="items-label">📦 Items en la orden:</span>
                        <span className="items-count">{order.items?.length || 0} items</span>
                      </div>
                      <div className="update-note">
                        ⚠️ Se han agregado nuevos items a esta orden
                      </div>
                    </div>
                  </div>
                )}
                  
                  <div className="ticket-items-list">
                    {order.items && Array.isArray(order.items) && order.items.length > 0 ? (
                      order.items.map((item, index) => {
                        if (!item || typeof item !== 'object') {
                          return null;
                        }
                        
                        const isNewItem = item.createdAt && order.createdAt && 
                          new Date(item.createdAt).getTime() > new Date(order.createdAt).getTime() + 5000;
                        
                        return (
                          <div key={item.id || `item-${index}`} className={`ticket-item ${isNewItem ? 'new-item' : ''}`}>
                            <div className="item-line">
                              {isNewItem && <span className="new-badge">🆕</span>}
                              <span className="item-qty">{item.quantity || 1}x</span>
                              <span className="item-name">{item.name || 'Item sin nombre'}</span>
                              <span className="item-price">${(item.totalPrice || 0).toFixed(2)}</span>
                            </div>
                            
                            {/* Componentes del combo */}
                            {item.components && Array.isArray(item.components) && item.components.length > 0 && (
                              <div className="item-components">
                                {item.components.map((comp, idx) => (
                                  <div key={idx} className="component-line">
                                    <span className="component-dash">•</span>
                                    <span className="component-name">{comp.name || 'Componente sin nombre'}</span>
                                    <span className="component-price">${(comp.price || 0).toFixed(2)}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                            
                            {/* Personalización del combo */}
                            {item.notes && item.notes.includes('selectedComponents') && (
                              <div className="item-customization">
                                {renderComboCustomization(item.notes)}
                              </div>
                            )}
                            
                            {/* Notas del item */}
                            {item.notes && !item.notes.includes('selectedComponents') && (
                              <div className="item-notes">
                                <span className="notes-icon">📝</span>
                                <span className="notes-text">{item.notes}</span>
                              </div>
                            )}
                          </div>
                        );
                      }).filter(Boolean)
                    ) : (
                      <div className="no-items">
                        <span>⚠️ No hay items en esta orden</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Notas generales de la orden */}
                  {order.notes && (
                    <div className="ticket-notes">
                      <span className="notes-icon">📋</span>
                      <span className="notes-text">{order.notes}</span>
                    </div>
                  )}
                </div>

                {/* Botones de Acción del Ticket */}
                <div className="ticket-actions">
                  <button
                    onClick={() => updateOrderStatus(order.id, getNextStatus(order.status))}
                    className="ticket-btn ready-btn"
                  >
                    ✅ {getActionButtonText(order.status)}
                  </button>
                  <button
                    onClick={() => openUpdateModal(order)}
                    className="ticket-btn update-btn"
                  >
                    ✏️ ACTUALIZAR
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Órdenes Listas */}
      <div className="orders-section">
        <h2>✅ Órdenes Listas ({readyOrders.length})</h2>
        <div className="orders-grid">
          {readyOrders.map(order => (
            <div key={order.id} className="order-card ready">
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
                  {order.items && Array.isArray(order.items) && order.items.length > 0 ? (
                    order.items.map(item => {
                      if (!item || typeof item !== 'object') {
                        console.warn('Item inválido en orden lista:', item);
                        return null;
                      }
                      
                      return (
                        <div key={item.id || `item-${Math.random()}`} className="order-item">
                          <div className="item-info">
                            <span className="item-quantity">{(item.quantity || 1)}x</span>
                            <span className="item-name">{item.name || 'Item sin nombre'}</span>
                            {item.notes && (
                              <span className="item-notes">📝 {item.notes}</span>
                            )}
                          </div>
                          <div className="item-price">
                            ${(item.totalPrice || 0).toFixed(2)}
                          </div>
                        </div>
                      );
                    }).filter(Boolean)
                  ) : (
                    <div className="no-items-message">
                      <span>⚠️ No hay items en esta orden</span>
                    </div>
                  )}
                </div>

              {order.notes && (
                <div className="order-notes">
                  <p><strong>Notas:</strong> {order.notes}</p>
                </div>
              )}

              <div className="order-actions">
                <button
                  onClick={() => updateOrderStatus(order.id, { status: 'PAGADO' })}
                  className="btn btn-secondary"
                >
                  Marcar como Entregado
                </button>
                <button
                  onClick={() => openUpdateModal(order)}
                  className="btn btn-info"
                >
                  Actualizar Pedido
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Órdenes Entregadas (últimas 10) */}
      {deliveredOrders.length > 0 && (
        <div className="orders-section">
          <h2>📦 Órdenes Entregadas ({deliveredOrders.length})</h2>
          <div className="orders-grid">
            {deliveredOrders.slice(0, 10).map(order => (
              <div key={order.id} className="order-card delivered">
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
                  {order.items && Array.isArray(order.items) && order.items.length > 0 ? (
                    order.items.map(item => {
                      if (!item || typeof item !== 'object') {
                        console.warn('Item inválido en orden entregada:', item);
                        return null;
                      }
                      
                      return (
                        <div key={item.id || `item-${Math.random()}`} className="order-item">
                          <div className="item-info">
                            <span className="item-quantity">{(item.quantity || 1)}x</span>
                            <span className="item-name">{item.name || 'Item sin nombre'}</span>
                          </div>
                          <div className="item-price">
                            ${(item.totalPrice || 0).toFixed(2)}
                          </div>
                        </div>
                      );
                    }).filter(Boolean)
                  ) : (
                    <div className="no-items-message">
                      <span>⚠️ No hay items en esta orden</span>
                    </div>
                  )}
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
                <label>Producto:</label>
                <select 
                  value={selectedProduct} 
                  onChange={(e) => setSelectedProduct(e.target.value)}
                  className="form-control"
                >
                  <option value="">Selecciona un producto</option>
                  {products.map(product => (
                    <option key={product.id} value={product.id}>
                      {product.name} - ${product.price}
                    </option>
                  ))}
                </select>
              </div>
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
          <p>La cocina está completamente libre</p>
        </div>
      )}
    </div>
  );
};

export default KitchenView;
