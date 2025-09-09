import React, { useState, useEffect, useCallback } from 'react';
import { orderService } from '../services/api';
import { Order, OrderItem as BaseOrderItem } from '../types';
import './ModernKitchenView.css';

// Tipos para el nuevo sistema
type OrderStatus = 'EN_PREPARACION' | 'LISTO' | 'ENTREGADO';
type ItemStatus = 'PENDIENTE' | 'TRABAJANDO' | 'FINALIZADO';
type TimeStatus = 'EN_TIEMPO' | 'ATENCION' | 'CRITICO';

interface ModernOrderItem extends BaseOrderItem {
  hasAllergy?: boolean;
  modifiers?: string[];
  displayStatus: ItemStatus;
}

interface KitchenOrder extends Order {
  items: ModernOrderItem[];
  timeStatus: TimeStatus;
  elapsedMinutes: number;
  priority: number;
}

const ModernKitchenView: React.FC = () => {
  // Estados principales
  const [orders, setOrders] = useState<KitchenOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Estados de la UI
  const [activeTab, setActiveTab] = useState<OrderStatus>('EN_PREPARACION');
  const [selectedOrder, setSelectedOrder] = useState<KitchenOrder | null>(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  
  // Contadores por estado
  const [counters, setCounters] = useState({
    EN_PREPARACION: 0,
    LISTO: 0,
    ENTREGADO: 0
  });

  // Cargar órdenes de cocina
  const loadKitchenOrders = useCallback(async () => {
    try {
      console.log('🔍 Cargando órdenes de cocina...');
      const kitchenOrders = await orderService.getKitchenOrders();
      
      // Transformar órdenes al formato del nuevo sistema
      const transformedOrders: KitchenOrder[] = kitchenOrders.map((order: Order) => {
        const elapsedMinutes = Math.floor((currentTime.getTime() - new Date(order.createdAt).getTime()) / (1000 * 60));
        
        // Determinar estado de tiempo
        let timeStatus: TimeStatus = 'EN_TIEMPO';
        if (elapsedMinutes >= 30) timeStatus = 'CRITICO';
        else if (elapsedMinutes >= 15) timeStatus = 'ATENCION';
        
        // Transformar items
        const items: ModernOrderItem[] = (order.items || []).map(item => {
          let displayStatus: ItemStatus = 'PENDIENTE';
          if (item.status === 'LISTO') displayStatus = 'FINALIZADO';
          else if (item.status === 'EN_PREPARACION') displayStatus = 'TRABAJANDO';
          
          return {
            ...item,
            displayStatus,
            hasAllergy: item.notes?.toLowerCase().includes('alergia') || false,
            modifiers: extractModifiers(item.notes)
          };
        });
        
        return {
          ...order,
          items,
          timeStatus,
          elapsedMinutes,
          priority: calculatePriority(order, elapsedMinutes)
        };
      });
      
      setOrders(transformedOrders);
      
      // Calcular contadores
      const newCounters = {
        EN_PREPARACION: transformedOrders.filter(o => o.status === 'PENDIENTE' || o.status === 'EN_PREPARACION').length,
        LISTO: transformedOrders.filter(o => o.status === 'LISTO').length,
        ENTREGADO: transformedOrders.filter(o => o.status === 'ENTREGADO').length
      };
      setCounters(newCounters);
      
      console.log('✅ Órdenes cargadas:', { total: transformedOrders.length, counters: newCounters });
    } catch (err) {
      console.error('❌ Error cargando órdenes:', err);
      setError('Error al cargar las órdenes de cocina');
    } finally {
      setLoading(false);
    }
  }, [currentTime]);

  // Extraer modificadores de las notas
  const extractModifiers = (notes?: string): string[] => {
    if (!notes) return [];
    
    const modifiers: string[] = [];
    
    // Buscar salsas
    const sauceMatch = notes.match(/SALSAS?:\s*([^,\n]+)/i);
    if (sauceMatch) {
      modifiers.push(`Salsas: ${sauceMatch[1].trim()}`);
    }
    
    // Buscar palitos
    const chopsticksMatch = notes.match(/PALITOS?:\s*([^,\n]+)/i);
    if (chopsticksMatch) {
      modifiers.push(`Palitos: ${chopsticksMatch[1].trim()}`);
    }
    
    return modifiers;
  };

  // Calcular prioridad de la orden
  const calculatePriority = (order: Order, elapsedMinutes: number): number => {
    let priority = 0;
    
    // Prioridad por tiempo
    if (elapsedMinutes >= 30) priority += 100;
    else if (elapsedMinutes >= 15) priority += 50;
    
    // Prioridad por tipo de orden
    if (order.isDelivery) priority += 20;
    
    // Prioridad por cantidad de items
    priority += (order.items?.length || 0) * 5;
    
    return priority;
  };

  // Filtrar órdenes por pestaña activa
  const getFilteredOrders = (): KitchenOrder[] => {
    const filterByTab = (order: KitchenOrder): boolean => {
      switch (activeTab) {
        case 'EN_PREPARACION':
          return order.status === 'PENDIENTE' || order.status === 'EN_PREPARACION';
        case 'LISTO':
          return order.status === 'LISTO';
        case 'ENTREGADO':
          return order.status === 'ENTREGADO';
        default:
          return true;
      }
    };
    
    const sortByPriority = (a: KitchenOrder, b: KitchenOrder): number => {
      if (a.priority !== b.priority) {
        return b.priority - a.priority;
      }
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    };
    
    return orders.filter(filterByTab).sort(sortByPriority);
  };

  // Formatear tiempo transcurrido
  const formatElapsedTime = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes.toString().padStart(2, '0')}:00`;
    } else {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return `${hours}:${mins.toString().padStart(2, '0')}:00`;
    }
  };

  // Obtener color del header según tiempo
  const getHeaderColor = (order: KitchenOrder): string => {
    if (order.isDelivery) return 'grey';
    if (order.timeStatus === 'CRITICO') return 'red';
    if (order.timeStatus === 'ATENCION') return 'orange';
    return 'white';
  };

  // Obtener texto del estado de tiempo
  const getTimeStatusText = (order: KitchenOrder): string => {
    if (order.timeStatus === 'CRITICO') return 'CRÍTICO >30';
    if (order.timeStatus === 'ATENCION') return 'ATENCIÓN 15-30';
    return 'EN TIEMPO <15';
  };

  // Cambiar estado de un item
  const toggleItemStatus = async (orderId: string, itemId: string, currentStatus: ItemStatus) => {
    try {
      let newStatus: ItemStatus;
      
      switch (currentStatus) {
        case 'PENDIENTE':
          newStatus = 'TRABAJANDO';
          break;
        case 'TRABAJANDO':
          newStatus = 'FINALIZADO';
          break;
        default:
          return;
      }
      
      // Actualizar estado local
      const updateOrderItems = (order: KitchenOrder) => {
        if (order.id !== orderId) return order;
        
        const updatedItems = order.items.map(item => 
          item.id === itemId ? { ...item, displayStatus: newStatus } : item
        );
        
        return { ...order, items: updatedItems };
      };
      
      setOrders(prev => prev.map(updateOrderItems));
      
      // Sincronizar con backend
      console.log(`🔄 Item ${itemId} cambiado a ${newStatus}`);
      
    } catch (err) {
      console.error('❌ Error actualizando item:', err);
    }
  };

  // Marcar orden como lista
  const markOrderAsReady = async (orderId: string) => {
    try {
      await orderService.updateOrderStatus(orderId, 'LISTO');
      await loadKitchenOrders();
      console.log('✅ Orden marcada como lista');
    } catch (err) {
      console.error('❌ Error marcando orden como lista:', err);
    }
  };

  // Marcar orden como entregada
  const markOrderAsDelivered = async (orderId: string) => {
    try {
      await orderService.updateOrderStatus(orderId, 'ENTREGADO');
      await loadKitchenOrders();
      console.log('✅ Orden marcada como entregada');
    } catch (err) {
      console.error('❌ Error marcando orden como entregada:', err);
    }
  };

  // Efectos
  useEffect(() => {
    loadKitchenOrders();
    
    // Actualizar cada 10 segundos
    const interval = setInterval(loadKitchenOrders, 10000);
    
    // Actualizar tiempo cada segundo
    const timerInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    
    return () => {
      clearInterval(interval);
      clearInterval(timerInterval);
    };
  }, [loadKitchenOrders]);

  // Atajos de teclado
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === '1') setActiveTab('EN_PREPARACION');
      if (e.key === '2') setActiveTab('LISTO');
      if (e.key === '3') setActiveTab('ENTREGADO');
    };
    
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  if (loading) {
    return (
      <div className="kds-container">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Cargando órdenes de cocina...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="kds-container">
        <div className="error-state">
          <h2>Error</h2>
          <p>{error}</p>
          <button onClick={loadKitchenOrders}>Reintentar</button>
        </div>
      </div>
    );
  }

  const filteredOrders = getFilteredOrders();

  return (
    <div className="kds-container">
      {/* Header Principal */}
      <div className="kds-header">
        <div className="header-content">
          <div className="header-left">
            <h1>Vista de Cocina - KDS</h1>
            <h2>Comandas en COCINA</h2>
          </div>
          <div className="header-right">
            <div className="filters-section">
              Filtros: Estación (Fría, Caliente, Bebidas), Canal (Salón, Delivery, Pickup)
            </div>
          </div>
        </div>
      </div>

      {/* Tabs de Estado */}
      <div className="status-tabs">
        <button
          className={`status-tab ${activeTab === 'EN_PREPARACION' ? 'active' : ''}`}
          onClick={() => setActiveTab('EN_PREPARACION')}
        >
          {counters.EN_PREPARACION} En preparación
        </button>
        <button
          className={`status-tab ${activeTab === 'LISTO' ? 'active' : ''}`}
          onClick={() => setActiveTab('LISTO')}
        >
          {counters.LISTO} Listas
        </button>
        <button
          className={`status-tab ${activeTab === 'ENTREGADO' ? 'active' : ''}`}
          onClick={() => setActiveTab('ENTREGADO')}
        >
          {counters.ENTREGADO} Entregadas
        </button>
      </div>

      {/* Grid Dinámico de Tickets */}
      <div className="tickets-grid">
        {filteredOrders.map(order => (
          <div key={order.id} className="kitchen-ticket">
            {/* Header del Ticket */}
            <div className={`ticket-header ${getHeaderColor(order)}`}>
              <div className="ticket-info">
                <div className="ticket-number">Orden # {order.orderNumber}</div>
                <div className="ticket-table">- Mesa {order.space?.name || 'N/A'}</div>
              </div>
              <div className="ticket-status">
                {(() => {
                  if (order.status === 'PENDIENTE' || order.status === 'EN_PREPARACION') {
                    return 'EN PREPARACIÓN';
                  }
                  if (order.status === 'LISTO') {
                    return 'LISTA';
                  }
                  return 'ENTREGADA';
                })()}
              </div>
              <div className="ticket-timer">
                {formatElapsedTime(order.elapsedMinutes)}
              </div>
            </div>

            {/* Body del Ticket */}
            <div className="ticket-body">
              {/* Información de Mesa y Cliente */}
              <div className="order-details">
                <div className="detail-row">
                  <span className="detail-label">M Mesa:</span>
                  <span className="detail-value">{order.space?.name || 'N/A'}</span>
                </div>
                {order.customerName && (
                  <div className="detail-row">
                    <span className="detail-label">Cliente:</span>
                    <span className="detail-value">{order.customerName}</span>
                  </div>
                )}
                <div className="detail-row">
                  <span className="detail-label">Hora:</span>
                  <span className="detail-value">{new Date(order.createdAt).toLocaleTimeString('es-ES', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}</span>
                </div>
              </div>

              {/* Indicador de Tiempo */}
              <div className="time-indicator">
                <div className={`time-badge ${order.timeStatus.toLowerCase()}`}>
                  {getTimeStatusText(order)}
                </div>
              </div>

              {/* Sección de Pedido */}
              <div className="order-section">
                <div className="section-header">
                  <h3>PEDIDO</h3>
                  {order.totalAmount && (
                    <span className="order-total">${order.totalAmount.toFixed(2)}</span>
                  )}
                </div>
                
                <div className="items-list">
                  {order.items.map(item => (
                    <div key={item.id} className="order-item">
                      <button 
                        className={`item-button ${item.displayStatus.toLowerCase()}`}
                        onClick={() => toggleItemStatus(order.id, item.id, item.displayStatus)}
                        type="button"
                      >
                        <span className="item-quantity">{item.quantity}x</span>
                        <span className="item-name">{item.name}</span>
                        {item.hasAllergy && <span className="allergy-alert">ALERGIA</span>}
                      </button>
                      
                      {/* Modificadores */}
                      {item.modifiers && item.modifiers.length > 0 && (
                        <div className="item-modifiers">
                          {item.modifiers.map((modifier) => (
                            <div key={modifier} className="modifier-item">{modifier}</div>
                          ))}
                        </div>
                      )}
                      
                      {/* Notas */}
                      {item.notes && (
                        <div className="item-notes">
                          <span className="notes-text">{item.notes}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer con Botones */}
            <div className="ticket-footer">
              {activeTab === 'EN_PREPARACION' && (
                <button 
                  className="action-button primary"
                  onClick={() => markOrderAsReady(order.id)}
                >
                  Marcar como listo
                </button>
              )}
              {activeTab === 'LISTO' && (
                <button 
                  className="action-button primary"
                  onClick={() => markOrderAsDelivered(order.id)}
                >
                  Entregar
                </button>
              )}
              <button 
                className="action-button secondary"
                onClick={() => {
                  setSelectedOrder(order);
                  setShowUpdateModal(true);
                }}
              >
                Actualizar
              </button>
              <button className="action-button secondary">
                Reimprimir
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal de Actualización */}
      {showUpdateModal && selectedOrder && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Actualizar Orden #{selectedOrder.orderNumber}</h3>
            <p>Funcionalidad de actualización en desarrollo...</p>
            <button 
              className="action-button primary"
              onClick={() => setShowUpdateModal(false)}
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ModernKitchenView;