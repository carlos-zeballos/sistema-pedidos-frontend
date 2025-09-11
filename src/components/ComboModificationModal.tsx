import React, { useState, useEffect } from 'react';
import { catalogService } from '../services/api';
import './ComboModificationModal.css';

interface ComboComponent {
  name: string;
  quantity: number;
}

interface ComboSauce {
  name: string;
  quantity: number;
}

interface ComboData {
  selectedComponents: {
    [category: string]: ComboComponent[];
  };
  selectedSauces: ComboSauce[];
  normalChopsticks?: number;
  assistedChopsticks?: number;
  comboType?: string;
  itemNotes?: string;
}

interface ComboModificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (modifiedData: ComboData) => void;
  comboName: string;
  currentData: ComboData;
  comboId: string;
}

const ComboModificationModal: React.FC<ComboModificationModalProps> = ({
  isOpen,
  onClose,
  onSave,
  comboName,
  currentData,
  comboId
}) => {
  const [combo, setCombo] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [modifiedData, setModifiedData] = useState<ComboData>(currentData);
  const [error, setError] = useState<string | null>(null);

  console.log('🎭 ComboModificationModal - Props recibidas:', {
    isOpen,
    comboName,
    comboId,
    currentData
  });

  useEffect(() => {
    if (isOpen && comboId) {
      loadComboData();
    }
  }, [isOpen, comboId]);

  useEffect(() => {
    if (isOpen) {
      setModifiedData(currentData);
    }
  }, [isOpen, currentData]);

  const loadComboData = async () => {
    try {
      console.log('🔄 ComboModificationModal - Cargando datos del combo:', comboId);
      setLoading(true);
      setError(null);
      const comboData = await catalogService.getComboById(comboId);
      console.log('✅ ComboModificationModal - Datos del combo cargados:', comboData);
      setCombo(comboData);
    } catch (err: any) {
      console.error('❌ ComboModificationModal - Error loading combo:', err);
      setError('Error al cargar datos del combo: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleComponentQuantityChange = (category: string, componentIndex: number, newQuantity: number) => {
    if (newQuantity < 0) return;
    
    setModifiedData(prev => ({
      ...prev,
      selectedComponents: {
        ...prev.selectedComponents,
        [category]: prev.selectedComponents[category]?.map((comp, index) => 
          index === componentIndex ? { ...comp, quantity: newQuantity } : comp
        ) || []
      }
    }));
  };

  const handleSauceQuantityChange = (sauceIndex: number, newQuantity: number) => {
    if (newQuantity < 0) return;
    
    setModifiedData(prev => ({
      ...prev,
      selectedSauces: prev.selectedSauces.map((sauce, index) => 
        index === sauceIndex ? { ...sauce, quantity: newQuantity } : sauce
      )
    }));
  };

  const handleChopsticksChange = (type: 'normal' | 'assisted', quantity: number) => {
    if (quantity < 0) return;
    
    setModifiedData(prev => ({
      ...prev,
      [`${type}Chopsticks`]: quantity
    }));
  };

  const handleNotesChange = (notes: string) => {
    setModifiedData(prev => ({
      ...prev,
      itemNotes: notes
    }));
  };

  const handleSave = () => {
    onSave(modifiedData);
    onClose();
  };

  console.log('🎨 ComboModificationModal - Renderizando modal, isOpen:', isOpen);

  if (!isOpen) {
    console.log('🚫 ComboModificationModal - Modal cerrado, no renderizando');
    return null;
  }

  console.log('✅ ComboModificationModal - Renderizando modal abierto');
  return (
    <div className="combo-modification-overlay">
      <div className="combo-modification-modal">
        <div className="modal-header">
          <h3>🍱 Modificar: {comboName}</h3>
          <button onClick={onClose} className="modal-close">✕</button>
        </div>

        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Cargando datos del combo...</p>
          </div>
        ) : error ? (
          <div className="error-state">
            <div className="error-icon">⚠️</div>
            <p>{error}</p>
            <button onClick={onClose} className="btn btn-secondary">Cerrar</button>
          </div>
        ) : (
          <div className="modal-body">
            {/* Componentes del Combo */}
            {combo?.components && Object.keys(combo.components).length > 0 && (
              <div className="combo-section">
                <h4>🍽️ Componentes del Combo</h4>
                {Object.entries(combo.components).map(([category, components]: [string, any]) => (
                  <div key={category} className="category-section">
                    <h5 className="category-title">{category}</h5>
                    <div className="components-grid">
                      {Array.isArray(components) && components.map((component: any) => {
                        const currentComponent = modifiedData.selectedComponents[category]?.find(
                          comp => comp.name === component.name
                        );
                        const currentQuantity = currentComponent?.quantity || 0;
                        
                        return (
                          <div key={`${category}-${component.name}`} className="component-card">
                            <div className="component-info">
                              <span className="component-name">{component.name}</span>
                              <span className="component-price">${component.price || 0}</span>
                            </div>
                            <div className="quantity-controls">
                              <button
                                onClick={() => handleComponentQuantityChange(category, components.findIndex((c: any) => c.name === component.name), currentQuantity - 1)}
                                className="qty-btn qty-decrease"
                                disabled={currentQuantity <= 0}
                              >
                                −
                              </button>
                              <span className="qty-display">{currentQuantity}</span>
                              <button
                                onClick={() => handleComponentQuantityChange(category, components.findIndex((c: any) => c.name === component.name), currentQuantity + 1)}
                                className="qty-btn qty-increase"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Salsas */}
            {combo?.sauces && combo.sauces.length > 0 && (
              <div className="combo-section">
                <h4>🌶️ Salsas</h4>
                <div className="sauces-grid">
                  {combo.sauces.map((sauce: any) => {
                    const currentSauce = modifiedData.selectedSauces.find(s => s.name === sauce.name);
                    const currentQuantity = currentSauce?.quantity || 0;
                    
                    return (
                      <div key={sauce.name} className="sauce-card">
                        <div className="sauce-info">
                          <span className="sauce-name">{sauce.name}</span>
                          <span className="sauce-price">${sauce.price || 0}</span>
                        </div>
                        <div className="quantity-controls">
                          <button
                            onClick={() => handleSauceQuantityChange(combo.sauces.findIndex((s: any) => s.name === sauce.name), currentQuantity - 1)}
                            className="qty-btn qty-decrease"
                            disabled={currentQuantity <= 0}
                          >
                            −
                          </button>
                          <span className="qty-display">{currentQuantity}</span>
                          <button
                            onClick={() => handleSauceQuantityChange(combo.sauces.findIndex((s: any) => s.name === sauce.name), currentQuantity + 1)}
                            className="qty-btn qty-increase"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Palillos */}
            <div className="combo-section">
              <h4>🥢 Palillos</h4>
              <div className="chopsticks-controls">
                <div className="chopstick-type">
                  <label htmlFor="normal-chopsticks">Palillos Normales:</label>
                  <div className="quantity-controls">
                    <button
                      onClick={() => handleChopsticksChange('normal', (modifiedData.normalChopsticks || 0) - 1)}
                      className="qty-btn qty-decrease"
                      disabled={(modifiedData.normalChopsticks || 0) <= 0}
                    >
                      −
                    </button>
                    <span className="qty-display">{modifiedData.normalChopsticks || 0}</span>
                    <button
                      onClick={() => handleChopsticksChange('normal', (modifiedData.normalChopsticks || 0) + 1)}
                      className="qty-btn qty-increase"
                    >
                      +
                    </button>
                  </div>
                </div>
                <div className="chopstick-type">
                  <label htmlFor="assisted-chopsticks">Palillos de Entrenamiento:</label>
                  <div className="quantity-controls">
                    <button
                      onClick={() => handleChopsticksChange('assisted', (modifiedData.assistedChopsticks || 0) - 1)}
                      className="qty-btn qty-decrease"
                      disabled={(modifiedData.assistedChopsticks || 0) <= 0}
                    >
                      −
                    </button>
                    <span className="qty-display">{modifiedData.assistedChopsticks || 0}</span>
                    <button
                      onClick={() => handleChopsticksChange('assisted', (modifiedData.assistedChopsticks || 0) + 1)}
                      className="qty-btn qty-increase"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Notas Adicionales */}
            <div className="combo-section">
              <h4>📝 Notas Adicionales</h4>
              <textarea
                value={modifiedData.itemNotes || ''}
                onChange={(e) => handleNotesChange(e.target.value)}
                className="notes-textarea"
                placeholder="Notas especiales para este combo..."
                rows={3}
              />
            </div>

            {/* Resumen de Cambios */}
            <div className="combo-section summary-section">
              <h4>📋 Resumen de la Modificación</h4>
              <div className="summary-content">
                <div className="summary-item">
                  <strong>Combo:</strong> {comboName}
                </div>
                <div className="summary-item">
                  <strong>Componentes seleccionados:</strong>
                  <ul>
                    {Object.entries(modifiedData.selectedComponents).map(([category, components]) => 
                      components.map((comp) => (
                        <li key={`${category}-${comp.name}`}>
                          {comp.name} (x{comp.quantity}) - {category}
                        </li>
                      ))
                    )}
                  </ul>
                </div>
                <div className="summary-item">
                  <strong>Salsas:</strong>
                  <ul>
                    {modifiedData.selectedSauces.map((sauce) => (
                      <li key={sauce.name}>
                        {sauce.name} (x{sauce.quantity})
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="summary-item">
                  <strong>Palillos:</strong> 
                  Normal: {modifiedData.normalChopsticks || 0}, 
                  Entrenamiento: {modifiedData.assistedChopsticks || 0}
                </div>
                {modifiedData.itemNotes && (
                  <div className="summary-item">
                    <strong>Notas:</strong> {modifiedData.itemNotes}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="modal-footer">
          <button onClick={onClose} className="btn btn-secondary">
            Cancelar
          </button>
          <button onClick={handleSave} className="btn btn-primary" disabled={loading}>
            💾 Guardar Modificaciones
          </button>
        </div>
      </div>
    </div>
  );
};

export default ComboModificationModal;
