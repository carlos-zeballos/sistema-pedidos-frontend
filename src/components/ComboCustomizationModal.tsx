import React, { useState, useEffect } from 'react';
import './ComboCustomizationModal.css';

interface ComboComponent {
  id: string;
  productId: string;
  name: string;
  description?: string;
  type: string;
  price: number;
  maxSelections: number;
  isRequired: boolean;
  isAvailable: boolean;
  ord: number;
}

interface ProductOrCombo {
  id: string;
  name: string;
  description?: string;
  price?: number;
  basePrice?: number;
  isAvailable?: boolean;
  categoryId?: string;
  maxSelections?: number;
  components?: ComboComponent[];
  ComboComponent?: any[]; // Mantener para compatibilidad
}

interface ComboCustomizationModalProps {
  combo: ProductOrCombo | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (customizedCombo: CustomizedCombo) => void;
}

export interface CustomizedCombo {
  combo: ProductOrCombo;
  selectedComponents: {
    [componentType: string]: { name: string; quantity: number }[];
  };
  selectedSauces: { name: string; quantity: number }[];
  normalChopsticks?: number;
  assistedChopsticks?: number;
}

const AVAILABLE_SAUCES = [
  'ACEVICHADA', 'TARE', 'SOJU GARY', 'WASABI', 'SUPAI', 'LONCCA', 'MARACUYA'
];

const ComboCustomizationModal: React.FC<ComboCustomizationModalProps> = ({
  combo,
  isOpen,
  onClose,
  onAddToCart
}) => {
  const [selectedComponents, setSelectedComponents] = useState<{ [key: string]: { name: string; quantity: number }[] }>({});
  const [selectedSauces, setSelectedSauces] = useState<{ name: string; quantity: number }[]>([]);
  const [normalChopsticks, setNormalChopsticks] = useState(0);
  const [assistedChopsticks, setAssistedChopsticks] = useState(0);

  // Reset form when combo changes
  useEffect(() => {
    console.log('🔄 useEffect ejecutándose, combo:', combo);
    if (combo) {
      console.log('✅ Combo detectado, reseteando formulario...');
      setSelectedComponents({});
      setSelectedSauces([]);
      setNormalChopsticks(0);
      setAssistedChopsticks(0);
      console.log('✅ Formulario reseteado');
    } else {
      console.log('❌ No hay combo');
    }
  }, [combo]);

  console.log('🔄 Renderizando modal, estado:', { 
    isOpen, 
    combo: !!combo, 
    hasComponents: (combo?.components?.length || 0) > 0,
    componentsCount: combo?.components?.length || 0
  });
  
  const hasComponents = ((combo?.components?.length || 0) > 0) || 
                       ((combo?.ComboComponent?.length || 0) > 0);
  
  if (!isOpen || !combo) {
    console.log('❌ Modal no se renderiza - falta combo o no está abierto:', { 
      isOpen, 
      combo: !!combo
    });
    return null;
  }
  
  // Si no hay componentes, mostrar mensaje de error
  if (!hasComponents) {
    console.log('❌ Modal no se renderiza - combo sin componentes:', { 
      hasComponents,
      componentsCount: combo?.components?.length || combo?.ComboComponent?.length || 0
    });
    return (
      <div className="modal-overlay">
        <div className="modal-content">
          <div className="modal-header">
            <h2>🍱 {combo.name}</h2>
            <button className="close-btn" onClick={onClose}>×</button>
          </div>
          <div className="modal-body">
            <div style={{ textAlign: 'center', padding: '20px', color: '#ff6600' }}>
              <h3>⚠️ Combo sin componentes</h3>
              <p>Este combo no tiene componentes configurados.</p>
              <p>Por favor, contacta al administrador.</p>
            </div>
          </div>
          <div className="modal-footer">
            <button className="btn-secondary" onClick={onClose}>
              Cerrar
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  console.log('✅ Modal se renderiza correctamente');
  console.log('🍱 Componentes del combo (nuevos):', combo.components);
  console.log('🍱 Componentes del combo (antiguos):', combo.ComboComponent);
  console.log('🔢 MaxSelections del combo:', combo.maxSelections);
  
  // Obtener componentes de manera robusta
  const components = combo.components || combo.ComboComponent || [];
  console.log('📦 Componentes finales a renderizar:', components);
  console.log('📊 Combo completo:', combo);

  // Group components by type - manejar tanto componentes nuevos como antiguos
  const allComponents = combo.components || combo.ComboComponent || [];
  const componentsByType: { [key: string]: ComboComponent[] } = allComponents.reduce((acc, component) => {
    if (!acc[component.type]) {
      acc[component.type] = [];
    }
    acc[component.type].push(component);
    return acc;
  }, {} as { [key: string]: ComboComponent[] });

  const toggleComponent = (type: string, componentName: string) => {
    console.log('🔄 toggleComponent:', { type, componentName, maxSelections: combo.maxSelections });
    setSelectedComponents(prev => {
      const current = prev[type] || [];
      const maxSelections = combo.maxSelections || 1;
      const totalSelected = current.reduce((sum, item) => sum + item.quantity, 0);
      console.log('📊 Estado actual:', { current, maxSelections, totalSelected });
      
      const existingIndex = current.findIndex(item => item.name === componentName);
      
      if (existingIndex >= 0) {
        // Component already selected, remove it
        return {
          ...prev,
          [type]: current.filter(item => item.name !== componentName)
        };
      } else if (totalSelected < maxSelections) {
        // Add new component with quantity 1
        return {
          ...prev,
          [type]: [...current, { name: componentName, quantity: 1 }]
        };
      }
      return prev;
    });
  };

  const updateComponentQuantity = (type: string, componentName: string, newQuantity: number) => {
    const maxSelections = combo.maxSelections || 1;
    setSelectedComponents(prev => {
      const current = prev[type] || [];
      const otherComponents = current.filter(item => item.name !== componentName);
      const otherTotal = otherComponents.reduce((sum, item) => sum + item.quantity, 0);
      
      // Ensure total doesn't exceed maxSelections
      const maxAllowed = Math.max(0, maxSelections - otherTotal);
      const finalQuantity = Math.min(newQuantity, maxAllowed);
      
      if (finalQuantity <= 0) {
        // Remove component if quantity becomes 0
        return {
          ...prev,
          [type]: otherComponents
        };
      }
      
      return {
        ...prev,
        [type]: [...otherComponents, { name: componentName, quantity: finalQuantity }]
      };
    });
  };

  const toggleSauce = (sauce: string) => {
    console.log('🌶️ toggleSauce:', { sauce, currentSauces: selectedSauces });
    setSelectedSauces(prev => {
      const existingIndex = prev.findIndex(s => s.name === sauce);
      
      if (existingIndex >= 0) {
        // Sauce already selected, remove it
        const newSauces = prev.filter(s => s.name !== sauce);
        console.log('🌶️ Salsa removida:', newSauces);
        return newSauces;
      } else {
        // Add new sauce with quantity 1
        const newSauces = [...prev, { name: sauce, quantity: 1 }];
        console.log('🌶️ Salsa agregada:', newSauces);
        return newSauces;
      }
    });
  };

  const updateSauceQuantity = (sauceName: string, newQuantity: number) => {
    setSelectedSauces(prev => {
      const otherSauces = prev.filter(s => s.name !== sauceName);
      
      if (newQuantity <= 0) {
        // Remove sauce if quantity becomes 0
        return otherSauces;
      }
      
      return [...otherSauces, { name: sauceName, quantity: newQuantity }];
    });
  };



  const getRequiredSaucesCount = () => {
    // Para combos, asumimos que requieren 1 salsa por defecto
    // Esto se puede ajustar según la lógica específica de cada combo
    return 1;
  };

  const isFormValid = () => {
    console.log('🔍 Validando formulario...');
    
    // Verificar que hay un combo seleccionado
    if (!combo) {
      console.log('❌ No hay combo seleccionado');
      return false;
    }
    
    // Verificar que el combo tiene componentes
    const hasComponents = (combo.components?.length || 0) > 0 || (combo.ComboComponent?.length || 0) > 0;
    if (!hasComponents) {
      console.log('❌ El combo no tiene componentes');
      return false;
    }
    
    // Verificar que se han seleccionado componentes requeridos
    const components = combo.components || combo.ComboComponent || [];
    const requiredComponents = components.filter((comp: any) => comp.isRequired);
    
    for (const requiredComp of requiredComponents) {
      const selectedForType = selectedComponents[requiredComp.type] || [];
      const totalSelected = selectedForType.reduce((sum, item) => sum + item.quantity, 0);
      
      if (totalSelected < 1) {
        console.log(`❌ Componente requerido no seleccionado: ${requiredComp.type}`);
        return false;
      }
    }
    
    // Verificar que se han seleccionado salsas (mínimo 1)
    const totalSauces = selectedSauces.reduce((sum, sauce) => sum + sauce.quantity, 0);
    if (totalSauces < 1) {
      console.log('❌ Se requiere al menos 1 salsa');
      return false;
    }
    
    console.log('✅ Formulario válido');
    return true;
  };

  const handleAddToCart = () => {
    console.log('🚀 handleAddToCart ejecutándose');
    console.log('isFormValid():', isFormValid());
    
    if (!isFormValid()) {
      console.log('❌ Validación falló, no se puede agregar al carrito');
      return;
    }

    console.log('✅ Validación pasó, creando customizedCombo...');
    
    const customizedCombo: CustomizedCombo = {
      combo,
      selectedComponents,
      selectedSauces,
      normalChopsticks,
      assistedChopsticks
    };

    console.log('📦 customizedCombo creado:', customizedCombo);
    console.log('🔄 Llamando onAddToCart...');
    
    onAddToCart(customizedCombo);
    console.log('✅ onAddToCart ejecutado, cerrando modal...');
    onClose();
  };

  const getComponentTypeLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      'SABOR': '🍣 SABORES',
      'BEBIDA': '🥤 BEBIDAS',
      'POSTRE': '🍰 POSTRES',
      'SALSA': '🥢 SALSAS'
    };
    return labels[type] || type;
  };

  return (
    <div className="combo-modal-overlay">
      <div className="combo-modal">
        <div className="combo-modal-header">
          <h2>🍱 PERSONALIZAR COMBO: {combo.name}</h2>
          <button className="close-btn" onClick={onClose}>❌</button>
        </div>

        <div className="combo-modal-content">
          {combo.description && (
            <div className="combo-description">
              <p>{combo.description}</p>
            </div>
          )}

                     {/* Componentes del Combo */}
           {Object.entries(componentsByType)
             .filter(([type]) => type !== 'COMPLEMENTO') // Filtrar complementos
             .map(([type, components]: [string, ComboComponent[]]) => (
             <div key={type} className="component-section">
               <h3>{getComponentTypeLabel(type)}</h3>
               <p className="selection-info">
                 Elige hasta {combo.maxSelections || 1} sabores de {components.length} opciones
                 {(() => {
                   const totalSelected = (selectedComponents[type] || []).reduce((sum, item) => sum + item.quantity, 0);
                   return totalSelected > 0 ? ` (${totalSelected}/${combo.maxSelections || 1} seleccionados)` : '';
                 })()}
               </p>
               <div className="components-grid">
                 {components.map((component: ComboComponent) => {
                   const selectedItem = selectedComponents[type]?.find(item => item.name === component.name);
                   const isSelected = !!selectedItem;
                   const quantity = selectedItem?.quantity || 0;
                   const totalSelected = (selectedComponents[type] || []).reduce((sum, item) => sum + item.quantity, 0);
                   const isDisabled = !isSelected && totalSelected >= (combo.maxSelections || 1);
                   
                   return (
                     <div
                       key={component.id}
                       className={`component-option ${isSelected ? 'selected' : ''} ${isDisabled ? 'disabled' : ''}`}
                     >
                       <div 
                         className="component-main"
                         onClick={() => !isDisabled && toggleComponent(type, component.name)}
                       >
                         <div className="component-name">{component.name}</div>
                         {component.description && (
                           <div className="component-description">{component.description}</div>
                         )}
                         {component.price > 0 && (
                           <div className="component-price">+${(component.price || 0).toFixed(2)}</div>
                         )}
                       </div>
                       
                       {isSelected && (
                         <div className="quantity-controls">
                           <button 
                             type="button"
                             className="quantity-btn"
                             onClick={(e) => {
                               e.stopPropagation();
                               updateComponentQuantity(type, component.name, quantity - 1);
                             }}
                           >
                             -
                           </button>
                           <span className="quantity-display">{quantity}</span>
                           <button 
                             type="button"
                             className="quantity-btn"
                             onClick={(e) => {
                               e.stopPropagation();
                               updateComponentQuantity(type, component.name, quantity + 1);
                             }}
                             disabled={totalSelected >= (combo.maxSelections || 1)}
                           >
                             +
                           </button>
                         </div>
                       )}
                     </div>
                   );
                 })}
               </div>
             </div>
           ))}





          {/* Selección de Salsas */}
          <div className="sauces-section">
            <h3>🌶️ SALSAS</h3>
            <p className="selection-info">
              Selecciona las salsas que deseas incluir
            </p>
            <div className="sauces-grid">
              {AVAILABLE_SAUCES.map((sauce) => {
                const selectedSauce = selectedSauces.find(s => s.name === sauce);
                const isSelected = !!selectedSauce;
                const quantity = selectedSauce?.quantity || 0;
                
                return (
                  <div
                    key={sauce}
                    className={`sauce-option ${isSelected ? 'selected' : ''}`}
                  >
                    <div 
                      className="sauce-main"
                      onClick={() => toggleSauce(sauce)}
                    >
                      <span className="sauce-name">{sauce}</span>
                    </div>
                    
                    {isSelected && (
                      <div className="quantity-controls">
                        <button 
                          type="button"
                          className="quantity-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            updateSauceQuantity(sauce, quantity - 1);
                          }}
                        >
                          -
                        </button>
                        <span className="quantity-display">{quantity}</span>
                        <button 
                          type="button"
                          className="quantity-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            updateSauceQuantity(sauce, quantity + 1);
                          }}
                        >
                          +
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Selección de Palitos */}
          <div className="chopsticks-section">
            <h3>🥢 PALITOS</h3>
            <p className="selection-info">
              Selecciona la cantidad de palitos necesarios
            </p>
            <div className="chopsticks-options">
              <div className="chopstick-type">
                <span className="chopstick-label">Palitos Normales:</span>
                <div className="chopstick-controls">
                  <button 
                    className="chopstick-btn"
                    onClick={() => setNormalChopsticks(Math.max(0, normalChopsticks - 1))}
                  >
                    -
                  </button>
                  <span className="chopstick-count">{normalChopsticks}</span>
                  <button 
                    className="chopstick-btn"
                    onClick={() => setNormalChopsticks(normalChopsticks + 1)}
                  >
                    +
                  </button>
                </div>
              </div>
              
              <div className="chopstick-type">
                <span className="chopstick-label">Palitos de Entrenamiento:</span>
                <div className="chopstick-controls">
                  <button 
                    className="chopstick-btn"
                    onClick={() => setAssistedChopsticks(Math.max(0, assistedChopsticks - 1))}
                  >
                    -
                  </button>
                  <span className="chopstick-count">{assistedChopsticks}</span>
                  <button 
                    className="chopstick-btn"
                    onClick={() => setAssistedChopsticks(assistedChopsticks + 1)}
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Precio */}
          <div className="combo-price">
            <h3>💰 PRECIO TOTAL</h3>
            <div className="price-amount">S/. {(combo.basePrice || combo.price || 0).toFixed(2)}</div>
            <p className="price-note">* Precio base del combo (salsas y palitos incluidos)</p>
          </div>
        </div>

        <div className="combo-modal-footer">
          <button className="cancel-btn" onClick={onClose}>
            ❌ Cancelar
          </button>
          
          {/* Botón de debug temporal */}
          <button 
            className="debug-btn"
            onClick={() => {
              console.log('🔍 DEBUG - Estado del formulario:');
              console.log('Combo:', combo);
              console.log('Componentes por tipo:', componentsByType);
              console.log('Selecciones:', selectedComponents);
              console.log('isFormValid():', isFormValid());
            }}
            style={{
              background: '#666',
              color: '#fff',
              padding: '8px 15px',
              border: 'none',
              borderRadius: '5px',
              marginRight: '10px'
            }}
          >
            🐛 Debug
          </button>
          
          {/* Botón de forzar validación temporal */}
          <button 
            className="force-valid-btn"
            onClick={() => {
              console.log('🚀 Forzando validación...');
              // Forzar que se pueda agregar al carrito
              handleAddToCart();
            }}
            style={{
              background: '#ff6600',
              color: '#fff',
              padding: '8px 15px',
              border: 'none',
              borderRadius: '5px',
              marginRight: '10px'
            }}
          >
            🚀 Forzar
          </button>
          
          <button 
            className="add-to-cart-btn"
            onClick={handleAddToCart}
            disabled={!isFormValid()}
            style={{
              opacity: isFormValid() ? 1 : 0.5,
              cursor: isFormValid() ? 'pointer' : 'not-allowed'
            }}
          >
            🛒 Agregar al Carrito {!isFormValid() ? '(DESHABILITADO)' : ''}
          </button>
          
          {/* Indicador de estado de validación */}
          <div style={{
            marginTop: '10px',
            padding: '10px',
            background: isFormValid() ? 'rgba(0, 255, 0, 0.1)' : 'rgba(255, 0, 0, 0.1)',
            border: `1px solid ${isFormValid() ? '#00ff00' : '#ff0000'}`,
            borderRadius: '5px',
            color: isFormValid() ? '#00ff00' : '#ff0000',
            fontSize: '12px',
            textAlign: 'center'
          }}>
            {isFormValid() ? '✅ Formulario válido' : '❌ Formulario inválido'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComboCustomizationModal;
