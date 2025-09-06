import React, { useState, useEffect } from 'react';
import { PaymentMethod } from '../types/payment.types';
import { orderService, paymentService } from '../services/api';
import './PaymentMethodModal.css';

interface PaymentMethodModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPaymentComplete: () => void;
  order: {
    id: string;
    orderNumber: string;
    totalAmount: number;
    customerName?: string;
    space?: { name: string };
  };
}

const PaymentMethodModal: React.FC<PaymentMethodModalProps> = ({
  isOpen,
  onClose,
  onPaymentComplete,
  order
}) => {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      loadPaymentMethods();
    }
  }, [isOpen]);

  const loadPaymentMethods = async () => {
    try {
      const methods = await paymentService.getPaymentMethods();
      setPaymentMethods(methods);
      if (methods.length > 0) {
        setSelectedMethod(methods[0].id);
      }
    } catch (err: any) {
      setError('Error al cargar métodos de pago');
      console.error('Error loading payment methods:', err);
    }
  };

  const handlePayment = async () => {
    if (!selectedMethod) {
      setError('Por favor selecciona un método de pago');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await paymentService.registerPayment({
        orderId: order.id,
        paymentMethodId: selectedMethod,
        amount: order.totalAmount || 0,
        notes: notes.trim() || undefined
      });

      // Marcar la orden como pagada
      await orderService.updateOrderStatus(order.id, 'PAGADO');
      
      onPaymentComplete();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al procesar el pago');
      console.error('Error processing payment:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const selectedMethodData = paymentMethods.find(m => m.id === selectedMethod);

  return (
    <div className="payment-modal-overlay">
      <div className="payment-modal">
        <div className="payment-modal-header">
          <h2>💳 Registrar Pago</h2>
          <button className="close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="payment-modal-content">
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
              <div className="order-detail total">
                <span className="label">Total a Pagar:</span>
                <span className="value amount">${(order.totalAmount || 0).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Selección de método de pago */}
          <div className="payment-method-section">
            <h3>💳 Selecciona el Método de Pago</h3>
            <div className="payment-methods-grid">
              {paymentMethods.map((method) => (
                <div
                  key={method.id}
                  className={`payment-method-option ${selectedMethod === method.id ? 'selected' : ''}`}
                  onClick={() => setSelectedMethod(method.id)}
                >
                  <div className="method-icon" style={{ color: method.color }}>
                    {method.icon}
                  </div>
                  <div className="method-info">
                    <span className="method-name">{method.name}</span>
                    <span className="method-description">{method.description}</span>
                  </div>
                  <div className="selection-indicator">
                    {selectedMethod === method.id ? '✓' : ''}
                  </div>
                </div>
              ))}
            </div>
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
          {selectedMethodData && (
            <div className="payment-summary">
              <h3>📊 Resumen del Pago</h3>
              <div className="summary-details">
                <div className="summary-row">
                  <span>Método:</span>
                  <span className="summary-value">
                    {selectedMethodData.icon} {selectedMethodData.name}
                  </span>
                </div>
                                 <div className="summary-row">
                   <span>Monto:</span>
                   <span className="summary-value amount">${(order.totalAmount || 0).toFixed(2)}</span>
                 </div>
                 <div className="summary-row total-row">
                   <span>Total:</span>
                   <span className="summary-value total-amount">${(order.totalAmount || 0).toFixed(2)}</span>
                 </div>
              </div>
            </div>
          )}

          {/* Mensaje de error */}
          {error && (
            <div className="error-message">
              <span className="error-icon">⚠️</span>
              <span className="error-text">{error}</span>
            </div>
          )}

          {/* Botones de acción */}
          <div className="payment-modal-actions">
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
              disabled={loading || !selectedMethod}
            >
              {loading ? 'Procesando...' : 'Confirmar Pago'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentMethodModal;
