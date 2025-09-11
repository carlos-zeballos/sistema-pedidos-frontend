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
  console.log('🔍 ComboModificationModal - currentData detallado:', JSON.stringify(currentData, null, 2));

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
      console.log('🔍 ComboModificationModal - Estructura del combo:');
      console.log('  - ID:', comboData.id);
      console.log('  - Nombre:', comboData.name);
      console.log('  - Componentes:', comboData.components);
      console.log('  - Salsas:', comboData.sauces);
      setCombo(comboData);
    } catch (err: any) {
      console.error('❌ ComboModificationModal - Error loading combo:', err);
      setError('Error al cargar datos del combo: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleComponentQuantityChange = (category: string, componentName: string, newQuantity: number) => {
    if (newQuantity < 0) return;
    
    setModifiedData(prev => {
      const currentComponents = prev.selectedComponents || {};
      const categoryComponents = currentComponents[category] || [];
      
      // Buscar si el componente ya existe
      const existingComponentIndex = categoryComponents.findIndex(comp => comp.name === componentName);
      
      if (existingComponentIndex >= 0) {
        // Si el componente ya existe, actualizar su cantidad
        const updatedComponents = [...categoryComponents];
        updatedComponents[existingComponentIndex] = {
          ...updatedComponents[existingComponentIndex],
          quantity: newQuantity
        };
        
        return {
          ...prev,
          selectedComponents: {
            ...currentComponents,
            [category]: updatedComponents
          }
        };
      } else {
        // Si el componente no existe, agregarlo
        const newComponent = {
          name: componentName,
          quantity: newQuantity
        };
        
        return {
          ...prev,
          selectedComponents: {
            ...currentComponents,
            [category]: [...categoryComponents, newComponent]
          }
        };
      }
    });
  };

  const handleSauceQuantityChange = (sauceName: string, newQuantity: number) => {
    if (newQuantity < 0) return;
    
    setModifiedData(prev => {
      const currentSauces = prev.selectedSauces || [];
      
      // Buscar si la salsa ya existe
      const existingSauceIndex = currentSauces.findIndex(sauce => sauce.name === sauceName);
      
      if (existingSauceIndex >= 0) {
        // Si la salsa ya existe, actualizar su cantidad
        const updatedSauces = [...currentSauces];
        updatedSauces[existingSauceIndex] = {
          ...updatedSauces[existingSauceIndex],
          quantity: newQuantity
        };
        
        return {
          ...prev,
          selectedSauces: updatedSauces
        };
      } else {
        // Si la salsa no existe, agregarla
        const newSauce = {
          name: sauceName,
          quantity: newQuantity
        };
        
        return {
          ...prev,
          selectedSauces: [...currentSauces, newSauce]
        };
      }
    });
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
                {Object.entries(combo.components || {}).map(([category, components]: [string, any]) => (
                  <div key={category} className="category-section">
                    <h5 className="category-title">{category}</h5>
                    <div className="components-grid">
                      {Array.isArray(components) && components.map((component: any) => {
                        const currentComponent = modifiedData.selectedComponents?.[category]?.find(
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
                                onClick={() => handleComponentQuantityChange(category, component.name, currentQuantity - 1)}
                                className="qty-btn qty-decrease"
                                disabled={currentQuantity <= 0}
                              >
                                −
                              </button>
                              <span className="qty-display">{currentQuantity}</span>
                              <button
                                onClick={() => handleComponentQuantityChange(category, component.name, currentQuantity + 1)}
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
                    const currentSauce = modifiedData.selectedSauces?.find(s => s.name === sauce.name);
                    const currentQuantity = currentSauce?.quantity || 0;
                    
                    return (
                      <div key={sauce.name} className="sauce-card">
                        <div className="sauce-info">
                          <span className="sauce-name">{sauce.name}</span>
                          <span className="sauce-price">${sauce.price || 0}</span>
                        </div>
                        <div className="quantity-controls">
                          <button
                            onClick={() => handleSauceQuantityChange(sauce.name, currentQuantity - 1)}
                            className="qty-btn qty-decrease"
                            disabled={currentQuantity <= 0}
                          >
                            −
                          </button>
                          <span className="qty-display">{currentQuantity}</span>
                          <button
                            onClick={() => handleSauceQuantityChange(sauce.name, currentQuantity + 1)}
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
                    {modifiedData.selectedComponents && Object.keys(modifiedData.selectedComponents).length > 0 ? (
                      Object.entries(modifiedData.selectedComponents).map(([category, components]) => 
                        Array.isArray(components) && components.length > 0 ? (
                          components.map((comp) => (
                            <li key={`${category}-${comp.name}`}>
                              {comp.name} (x{comp.quantity}) - {category}
                            </li>
                          ))
                        ) : null
                      )
                    ) : (
                      <li>No hay componentes seleccionados</li>
                    )}
                  </ul>
                </div>
                <div className="summary-item">
                  <strong>Salsas:</strong>
                  <ul>
                    {modifiedData.selectedSauces && modifiedData.selectedSauces.length > 0 ? (
                      modifiedData.selectedSauces.map((sauce) => (
                        <li key={sauce.name}>
                          {sauce.name} (x{sauce.quantity})
                        </li>
                      ))
                    ) : (
                      <li>No hay salsas seleccionadas</li>
                    )}
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
