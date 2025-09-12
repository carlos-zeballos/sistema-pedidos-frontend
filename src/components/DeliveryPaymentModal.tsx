import React, { useState, useEffect } from 'react';
import { PaymentMethod } from '../types/payment.types';
import { orderService, paymentService } from '../services/api';
import './DeliveryPaymentModal.css';

interface DeliveryPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPaymentComplete: () => void;
  order: {
    id: string;
    orderNumber: string;
    totalAmount: number;
    deliveryCost?: number;
    isDelivery?: boolean;
    customerName?: string;
    space?: { name: string };
  };
}

const DeliveryPaymentModal: React.FC<DeliveryPaymentModalProps> = ({
  isOpen,
  onClose,
  onPaymentComplete,
  order
}) => {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [orderPaymentMethod, setOrderPaymentMethod] = useState<string>('');
  const [deliveryPaymentMethod, setDeliveryPaymentMethod] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [modifiedOrderAmount, setModifiedOrderAmount] = useState<number>(0);
  const [modifiedDeliveryAmount, setModifiedDeliveryAmount] = useState<number>(0);
  const [isOrderAmountModified, setIsOrderAmountModified] = useState(false);
  const [isDeliveryAmountModified, setIsDeliveryAmountModified] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadPaymentMethods();
      setModifiedOrderAmount(order.totalAmount || 0);
      setModifiedDeliveryAmount(order.deliveryCost || 0);
      setIsOrderAmountModified(false);
      setIsDeliveryAmountModified(false);
    }
  }, [isOpen, order.totalAmount, order.deliveryCost]);

  const loadPaymentMethods = async () => {
    try {
      const methods = await paymentService.getPaymentMethods();
      setPaymentMethods(methods);
      if (methods.length > 0) {
        setOrderPaymentMethod(methods[0].id);
        setDeliveryPaymentMethod(methods[0].id);
      }
    } catch (err: any) {
      setError('Error al cargar métodos de pago');
      console.error('Error loading payment methods:', err);
    }
  };

  const handlePayment = async () => {
    if (!orderPaymentMethod) {
      setError('Por favor selecciona un método de pago para la orden');
      return;
    }

    if (order.isDelivery && modifiedDeliveryAmount > 0 && !deliveryPaymentMethod) {
      setError('Por favor selecciona un método de pago para el delivery');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const totalAmount = modifiedOrderAmount + modifiedDeliveryAmount;
      
      // Usar el nuevo endpoint de pago completo
      await orderService.registerCompletePayment(
        order.id,
        orderPaymentMethod,
        totalAmount,
        modifiedDeliveryAmount,
        notes.trim() || undefined
      );

      console.log('✅ Pago completo registrado exitosamente');
      onPaymentComplete();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Error al procesar el pago');
      console.error('Error processing payment:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const orderPaymentMethodData = paymentMethods.find(m => m.id === orderPaymentMethod);
  const deliveryPaymentMethodData = paymentMethods.find(m => m.id === deliveryPaymentMethod);
  const totalWithDelivery = (order.totalAmount || 0) + (order.deliveryCost || 0);

  return (
    <div className="delivery-payment-modal-overlay">
      <div className="delivery-payment-modal">
        <div className="delivery-payment-modal-header">
          <h2>💳 Registrar Pago {order.isDelivery ? 'con Delivery' : ''}</h2>
          <button className="close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="delivery-payment-modal-content">
          {/* Información de la orden */}
          <div className="order-info-section">
            <h3>📋 Detalles de la Orden</h3>
            <div className="order-details">
              <div className="order-detail">
                <span className="label">Orden:</span>
                <span className="value">#{order.orderNumber}</span>
              </div>
              <div className="order-detail">
                <span className="label">Cliente:</span>
                <span className="value">{order.customerName || 'Sin nombre'}</span>
              </div>
              {order.space && (
                <div className="order-detail">
                  <span className="label">Espacio:</span>
                  <span className="value">{order.space.name}</span>
                </div>
              )}
              {order.isDelivery && (
                <div className="order-detail delivery-info">
                  <span className="label">🚚 Tipo:</span>
                  <span className="value delivery-badge">DELIVERY</span>
                </div>
              )}
            </div>
          </div>

          {/* Desglose de costos */}
          <div className="cost-breakdown-section">
            <h3>💰 Desglose de Costos</h3>
            <div className="cost-breakdown">
              <div className="cost-item">
                <span className="cost-label">Subtotal de la Orden:</span>
                <div className="amount-input-container">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={modifiedOrderAmount}
                    onChange={(e) => {
                      const newAmount = parseFloat(e.target.value) || 0;
                      setModifiedOrderAmount(newAmount);
                      setIsOrderAmountModified(newAmount !== (order.totalAmount || 0));
                    }}
                    className={`amount-input ${isOrderAmountModified ? 'modified' : ''}`}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setModifiedOrderAmount(order.totalAmount || 0);
                      setIsOrderAmountModified(false);
                    }}
                    className="reset-amount-btn"
                    title="Restaurar precio original"
                  >
                    ↺
                  </button>
                </div>
              </div>
              {order.isDelivery && (
                <div className="cost-item delivery-cost">
                  <span className="cost-label">🚚 Costo de Delivery:</span>
                  <div className="amount-input-container">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={modifiedDeliveryAmount}
                      onChange={(e) => {
                        const newAmount = parseFloat(e.target.value) || 0;
                        setModifiedDeliveryAmount(newAmount);
                        setIsDeliveryAmountModified(newAmount !== (order.deliveryCost || 0));
                      }}
                      className={`amount-input ${isDeliveryAmountModified ? 'modified' : ''}`}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setModifiedDeliveryAmount(order.deliveryCost || 0);
                        setIsDeliveryAmountModified(false);
                      }}
                      className="reset-amount-btn"
                      title="Restaurar precio original"
                    >
                      ↺
                    </button>
                  </div>
                </div>
              )}
              <div className="cost-item total-cost">
                <span className="cost-label">Total a Pagar:</span>
                <span className="cost-value">${(modifiedOrderAmount + modifiedDeliveryAmount).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Métodos de pago */}
          <div className="payment-methods-section">
            <h3>💳 Métodos de Pago</h3>
            
            {/* Pago de la orden principal */}
            <div className="payment-method-group">
              <h4>📦 Pago de la Orden (${modifiedOrderAmount.toFixed(2)})</h4>
              <div className="payment-methods-grid">
                {paymentMethods.map((method) => (
                  <div
                    key={`order-${method.id}`}
                    className={`payment-method-option ${orderPaymentMethod === method.id ? 'selected' : ''}`}
                    onClick={() => setOrderPaymentMethod(method.id)}
                  >
                    <div className="method-icon" style={{ color: method.color }}>
                      {method.icon}
                    </div>
                    <div className="method-info">
                      <span className="method-name">{method.name}</span>
                      <span className="method-description">{method.description}</span>
                    </div>
                    <div className="selection-indicator">
                      {orderPaymentMethod === method.id ? '✓' : ''}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Pago del delivery (solo si es delivery y tiene costo) */}
            {order.isDelivery && modifiedDeliveryAmount > 0 && (
              <div className="payment-method-group">
                <h4>🚚 Pago del Delivery (${modifiedDeliveryAmount.toFixed(2)})</h4>
                <div className="payment-methods-grid">
                  {paymentMethods.map((method) => (
                    <div
                      key={`delivery-${method.id}`}
                      className={`payment-method-option ${deliveryPaymentMethod === method.id ? 'selected' : ''}`}
                      onClick={() => setDeliveryPaymentMethod(method.id)}
                    >
                      <div className="method-icon" style={{ color: method.color }}>
                        {method.icon}
                      </div>
                      <div className="method-info">
                        <span className="method-name">{method.name}</span>
                        <span className="method-description">{method.description}</span>
                      </div>
                      <div className="selection-indicator">
                        {deliveryPaymentMethod === method.id ? '✓' : ''}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Notas adicionales */}
          <div className="notes-section">
            <h3>📝 Notas Adicionales (Opcional)</h3>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Agregar notas sobre el pago..."
              className="notes-textarea"
              rows={3}
            />
          </div>

          {/* Resumen del pago */}
          <div className="payment-summary">
            <h3>📊 Resumen del Pago</h3>
            <div className="summary-details">
              <div className="summary-row">
                <span>Orden ({orderPaymentMethodData?.name}):</span>
                <span className="summary-value">${modifiedOrderAmount.toFixed(2)}</span>
              </div>
              {isOrderAmountModified && (
                <div className="summary-row original-amount">
                  <span>Precio Original Orden:</span>
                  <span className="summary-value original">${(order.totalAmount || 0).toFixed(2)}</span>
                </div>
              )}
              {order.isDelivery && modifiedDeliveryAmount > 0 && (
                <div className="summary-row">
                  <span>Delivery ({deliveryPaymentMethodData?.name}):</span>
                  <span className="summary-value">${modifiedDeliveryAmount.toFixed(2)}</span>
                </div>
              )}
              {isDeliveryAmountModified && (
                <div className="summary-row original-amount">
                  <span>Precio Original Delivery:</span>
                  <span className="summary-value original">${(order.deliveryCost || 0).toFixed(2)}</span>
                </div>
              )}
              <div className="summary-row total-row">
                <span>Total:</span>
                <span className="summary-value total-amount">${(modifiedOrderAmount + modifiedDeliveryAmount).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Mensaje de error */}
          {error && (
            <div className="error-message">
              <span className="error-icon">⚠️</span>
              <span className="error-text">{error}</span>
            </div>
          )}

          {/* Botones de acción */}
          <div className="delivery-payment-modal-actions">
            <button
              className="btn btn-secondary"
              onClick={onClose}
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              className="btn btn-primary"
              onClick={handlePayment}
              disabled={loading || !orderPaymentMethod || (order.isDelivery && modifiedDeliveryAmount > 0 && !deliveryPaymentMethod)}
            >
              {loading ? 'Procesando...' : `Confirmar Pago $${(modifiedOrderAmount + modifiedDeliveryAmount).toFixed(2)}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeliveryPaymentModal;
