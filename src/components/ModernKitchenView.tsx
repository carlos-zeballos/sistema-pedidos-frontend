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
  const [selectedOrder] = useState<KitchenOrder | null>(null);
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

  // Formatear tiempo transcurrido (copiado de KitchenView.tsx)
  const formatElapsedTime = (dateString: string | Date): string => {
    const now = new Date();
    const orderTime = new Date(dateString);
    const diffMs = now.getTime() - orderTime.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    
    const hours = Math.floor(diffSeconds / 3600);
    const minutes = Math.floor((diffSeconds % 3600) / 60);
    const seconds = diffSeconds % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };


  // Obtener clase CSS según tiempo transcurrido
  const getTimeStatusClass = (elapsedMinutes: number): string => {
    if (elapsedMinutes > 30) return 'urgent';
    if (elapsedMinutes > 15) return 'attention';
    return 'ontime';
  };

  // Obtener texto del estado de tiempo
  const getTimeStatusText = (order: KitchenOrder): string => {
    if (order.timeStatus === 'CRITICO') return 'CRÍTICO >30';
    if (order.timeStatus === 'ATENCION') return 'ATENCIÓN 15-30';
    return 'EN TIEMPO <15';
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
      <div className="kds-header">
        <h1 className="kds-title">Comandas en COCINA</h1>
        <div className="status-tabs-container">
          <button
            className={`status-tab ${activeTab === 'EN_PREPARACION' ? 'active' : ''}`}
            onClick={() => setActiveTab('EN_PREPARACION')}
          >
            En preparación
            <span className="counter">{counters.EN_PREPARACION}</span>
          </button>
          <button
            className={`status-tab ${activeTab === 'LISTO' ? 'active' : ''}`}
            onClick={() => setActiveTab('LISTO')}
          >
            Listas
            <span className="counter">{counters.LISTO}</span>
          </button>
          <button
            className={`status-tab ${activeTab === 'ENTREGADO' ? 'active' : ''}`}
            onClick={() => setActiveTab('ENTREGADO')}
          >
            Entregadas
            <span className="counter">{counters.ENTREGADO}</span>
          </button>
        </div>
      </div>

      <div className="tickets-grid">
        {filteredOrders.map(order => (
          <div key={order.id} className={`kitchen-ticket ${getTimeStatusClass(order.elapsedMinutes)}`}>
            {/* Header Azul */}
            <div className="ticket-header-blue">
              <div className="ticket-header-content">
                <div>
                  <div className="ticket-label">TICKET</div>
                  <div className="ticket-code">#{order.orderNumber}</div>
                </div>
                <div className="ticket-status-badge">
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
              </div>
            </div>

            {/* Información de la Orden */}
            <div className="order-info-section">
              <div className="order-details">
                <div className="order-detail">
                  <span className="detail-icon">🏠</span>
                  <span className="detail-label">MESA:</span>
                  <span className="detail-value">Mesa {order.space?.name || 'N/A'}</span>
                </div>
                <div className="order-detail">
                  <span className="detail-icon">👤</span>
                  <span className="detail-label">CLIENTE:</span>
                  <span className="detail-value">{order.customerName || 'N/A'}</span>
                </div>
              </div>
              <div className="order-detail">
                <span className="detail-icon">🕐</span>
                <span className="detail-label">HORA:</span>
                <span className="detail-value">{new Date(order.createdAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>

            {/* Timer y Urgencia */}
            <div className="timer-section">
              <div className="timer-info">
                <span className="timer-icon">⏱️</span>
                <span className="timer-display">{formatElapsedTime(order.createdAt)}</span>
              </div>
              <div className="urgency-info">
                <div className={`urgency-dot ${getTimeStatusClass(order.elapsedMinutes)}`}></div>
                <span className="urgency-text">{getTimeStatusText(order)}</span>
              </div>
            </div>

            {/* Resumen del Pedido */}
            <div className="order-summary">
              <div className="pedido-label">
                <span className="pedido-icon">📋</span>
                <span>PEDIDO</span>
              </div>
              {order.totalAmount && (
                <span className="order-total">${order.totalAmount.toFixed(2)}</span>
              )}
            </div>
            {/* Items del Pedido */}
            <div className="order-items">
              {order.items.map(item => (
                <div key={item.id} className="item-box">
                  <div className="item-header">
                    <span className="item-quantity">{item.quantity}x</span>
                    <span className="item-name">{item.name}</span>
                    <span className="item-price">${(item.unitPrice || 0).toFixed(2)}</span>
                  </div>

                  {/* Notas y Modificadores */}
                  {(item.notes || (item.modifiers && item.modifiers.length > 0)) && (
                    <div className="item-notes">
                      <div className="notes-text">
                        {item.notes && <div>{item.notes}</div>}
                        {item.modifiers && item.modifiers.length > 0 && (
                          <div>
                            {item.modifiers.map((modifier, index) => (
                              <span key={modifier}>
                                {modifier}
                                {index < (item.modifiers?.length || 0) - 1 ? ', ' : ''}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Botones de Acción */}
            <div className="action-buttons">
              <button
                className="action-button ready"
                onClick={() => {
                  if (activeTab === 'EN_PREPARACION') {
                    markOrderAsReady(order.id);
                  } else if (activeTab === 'LISTO') {
                    markOrderAsDelivered(order.id);
                  }
                }}
              >
                <span className="button-icon">✓</span>
                MARCAR COMO LISTO
              </button>
              <button
                className="action-button update"
                onClick={() => loadKitchenOrders()}
              >
                <span className="button-icon">✏️</span>
                ACTUALIZAR
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