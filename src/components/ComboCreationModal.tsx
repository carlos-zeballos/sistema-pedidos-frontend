import React, { useState, useEffect } from 'react';
import { catalogService } from '../services/api';
import './ComboCreationModal.css';

interface ComboFormData {
  code: string;
  name: string;
  basePrice: number;
  categoryId: string;
  description: string;
  image: string;
  isEnabled: boolean;
  isAvailable: boolean;
  preparationTime: number;
  maxSelections: number;
}

interface ComboComponentForm {
  id?: string;
  productId: string;
  name: string;
  description?: string;
  type: 'SABOR' | 'SALSA' | 'COMPLEMENTO' | 'PLATO' | 'ACOMPAÑAMIENTO';
  price?: number;
  isRequired: boolean;
  isAvailable: boolean;
  maxSelections: number;
  ord: number;
}

interface ProductForCombo {
  product_id: string;
  product_code: string;
  product_name: string;
  product_price: number;
  product_description: string;
  product_category_id: string;
  product_category_name: string;
  product_is_enabled: boolean;
  product_is_available: boolean;
}

interface Category {
  id: string;
  name: string;
  isActive: boolean;
}

interface ComboCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingCombo?: any;
}

const ComboCreationModal: React.FC<ComboCreationModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  editingCombo
}) => {
  const [formData, setFormData] = useState<ComboFormData>({
    code: 'COMBO_' + Date.now().toString().slice(-6),
    name: 'Nuevo Combo',
    basePrice: 25.90,
    categoryId: '',
    description: '',
    image: '',
    isEnabled: true,
    isAvailable: true,
    preparationTime: 20,
    maxSelections: 4
  });

  const [components, setComponents] = useState<ComboComponentForm[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [availableProducts, setAvailableProducts] = useState<ProductForCombo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');


  useEffect(() => {
    if (isOpen) {
      loadData();
      if (editingCombo) {
        loadComboData();
      }
    }
  }, [isOpen, editingCombo]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [categoriesData, productsData] = await Promise.all([
        catalogService.getCategories(),
        catalogService.getProductsForComboComponents()
      ]);
      
      setCategories(categoriesData.filter((cat: Category) => cat.isActive));
      setAvailableProducts(productsData);
    } catch (error: any) {
      setError('Error al cargar los datos: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadComboData = async () => {
    if (!editingCombo) return;
    
    try {
      const fullComboData = await catalogService.getComboById(editingCombo.id);
      
      setFormData({
        code: fullComboData.code,
        name: fullComboData.name,
        basePrice: fullComboData.basePrice,
        categoryId: fullComboData.categoryId,
        description: fullComboData.description || '',
        image: fullComboData.image || '',
        isEnabled: fullComboData.isEnabled,
        isAvailable: fullComboData.isAvailable,
        preparationTime: fullComboData.preparationTime,
        maxSelections: fullComboData.maxSelections || 4
      });

      if (fullComboData.components && fullComboData.components.length > 0) {
        const mappedComponents: ComboComponentForm[] = fullComboData.components.map((comp: any) => ({
          id: comp.id,
          productId: comp.productId || '',
          name: comp.name,
          description: comp.description || '',
          type: comp.type,
          price: comp.price || 0,
          isRequired: comp.isRequired || false,
          isAvailable: comp.isAvailable !== false,
          maxSelections: comp.maxSelections || 1,
          ord: comp.ord || 1
        }));
        setComponents(mappedComponents);
      } else {
        setComponents([]);
      }
    } catch (error: any) {
      setError('Error al cargar los datos del combo: ' + error.message);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError('');
      setSuccess('');

      // Validaciones
      if (!formData.code.trim()) {
        setError('El código es obligatorio');
        return;
      }
      if (!formData.name.trim()) {
        setError('El nombre es obligatorio');
        return;
      }
      if (formData.basePrice <= 0) {
        setError('El precio debe ser mayor a 0');
        return;
      }
      if (!formData.categoryId) {
        setError('La categoría es obligatoria');
        return;
      }

      const comboData = {
        ...formData,
        components: components.map(comp => ({
          productId: comp.productId,
          name: comp.name,
          description: comp.description,
          type: comp.type,
          price: comp.price,
          isRequired: comp.isRequired,
          isAvailable: comp.isAvailable,
          maxSelections: comp.maxSelections,
          ord: comp.ord
        }))
      };

      if (editingCombo) {
        await catalogService.updateCombo(editingCombo.id, comboData);
        setSuccess('Combo actualizado exitosamente');
      } else {
        await catalogService.createCombo(comboData);
        setSuccess('Combo creado exitosamente');
      }

      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);

    } catch (error: any) {
      setError('Error al guardar el combo: ' + error.message);
    } finally {
      setLoading(false);
    }
  };


  const handleDeleteComponent = (componentId: string) => {
    setComponents(prev => prev.filter(comp => comp.id !== componentId));
  };


  // Nuevas funciones para selección de productos
  const toggleProductSelection = (product: ProductForCombo) => {
    const isSelected = components.some(comp => comp.productId === product.product_id);
    
    if (isSelected) {
      // Remover producto
      setComponents(prev => prev.filter(comp => comp.productId !== product.product_id));
    } else {
      // Agregar producto
      const newComponent: ComboComponentForm = {
        id: `temp-${Date.now()}-${product.product_id}`,
        productId: product.product_id,
        name: product.product_name,
        description: product.product_description,
        type: 'SABOR', // Tipo por defecto, se puede cambiar después
        price: product.product_price,
        isRequired: false,
        isAvailable: product.product_is_available,
        maxSelections: 1,
        ord: components.length + 1
      };
      setComponents(prev => [...prev, newComponent]);
    }
  };

  const selectAllProducts = () => {
    const newComponents: ComboComponentForm[] = availableProducts.map((product, index) => ({
      id: `temp-${Date.now()}-${product.product_id}`,
      productId: product.product_id,
      name: product.product_name,
      description: product.product_description,
      type: 'SABOR',
      price: product.product_price,
      isRequired: false,
      isAvailable: product.product_is_available,
      maxSelections: 1,
      ord: index + 1
    }));
    setComponents(newComponents);
  };

  const clearAllProducts = () => {
    setComponents([]);
  };

  const toggleCategorySelection = (categoryId: string) => {
    const categoryProducts = availableProducts.filter(p => p.product_category_id === categoryId);
    const categoryProductIds = categoryProducts.map(p => p.product_id);
    
    // Contar cuántos productos de esta categoría están seleccionados
    const selectedInCategory = components.filter(comp => 
      categoryProductIds.includes(comp.productId)
    );
    
    if (selectedInCategory.length === categoryProducts.length && categoryProducts.length > 0) {
      // Si todos están seleccionados, deseleccionar todos los de esta categoría
      setComponents(prev => prev.filter(comp => !categoryProductIds.includes(comp.productId)));
    } else {
      // Si no todos están seleccionados, seleccionar todos los de esta categoría
      const newComponents: ComboComponentForm[] = categoryProducts.map((product, index) => ({
        id: `temp-${Date.now()}-${product.product_id}`,
        productId: product.product_id,
        name: product.product_name,
        description: product.product_description,
        type: 'SABOR',
        price: product.product_price,
        isRequired: false,
        isAvailable: product.product_is_available,
        maxSelections: 1,
        ord: components.length + index + 1
      }));
      
      // Filtrar los que ya están seleccionados y agregar los nuevos
      const existingIds = components.map(comp => comp.productId);
      const newUniqueComponents = newComponents.filter(comp => !existingIds.includes(comp.productId));
      
      setComponents(prev => [...prev, ...newUniqueComponents]);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay-new" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-content-new" onClick={e => e.stopPropagation()}>
        <div className="modal-header-new">
          <h2>{editingCombo ? '✏️ Editar Combo' : '✨ Nuevo Combo'}</h2>
          <button className="close-button-new" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body-new">
          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}

          <form onSubmit={handleSubmit} className="combo-form-new">
            {/* Paso 1: Información Básica */}
            <div className="form-step">
              <h3>📋 Paso 1: Información Básica</h3>
              
              <div className="form-grid">
                <div className="form-field">
                  <label htmlFor="combo-code">Código del Combo</label>
                  <input
                    id="combo-code"
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({...formData, code: e.target.value})}
                    placeholder="Ej: COMBO_001"
                    className="form-input"
                  />
                </div>
                
                <div className="form-field">
                  <label htmlFor="combo-name">Nombre del Combo</label>
                  <input
                    id="combo-name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="Ej: Combo Familiar"
                    className="form-input"
                  />
                </div>
                
                <div className="form-field">
                  <label htmlFor="combo-price">Precio Base (S/.)</label>
                  <input
                    id="combo-price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.basePrice}
                    onChange={(e) => setFormData({...formData, basePrice: parseFloat(e.target.value) || 0})}
                    placeholder="25.90"
                    className="form-input"
                  />
                </div>
                
                <div className="form-field">
                  <label htmlFor="combo-category">Categoría</label>
                  <select
                    id="combo-category"
                    value={formData.categoryId}
                    onChange={(e) => setFormData({...formData, categoryId: e.target.value})}
                    className="form-select"
                  >
                    <option value="">Seleccionar categoría</option>
                    {categories.map((cat: Category) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="form-field-full">
                <label htmlFor="combo-description">Descripción</label>
                <textarea
                  id="combo-description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Describe tu combo..."
                  rows={3}
                  className="form-textarea"
                />
              </div>
            </div>

            {/* Paso 2: Configuración */}
            <div className="form-step">
              <h3>⚙️ Paso 2: Configuración</h3>
              
              <div className="form-grid">
                <div className="form-field">
                  <label htmlFor="combo-prep-time">Tiempo de Preparación (min)</label>
                  <input
                    id="combo-prep-time"
                    type="number"
                    value={formData.preparationTime}
                    onChange={(e) => setFormData({...formData, preparationTime: parseInt(e.target.value) || 20})}
                    min="1"
                    max="120"
                    className="form-input"
                  />
                </div>
                
                <div className="form-field">
                  <label htmlFor="combo-max-selections">Máximo de Selecciones</label>
                  <input
                    id="combo-max-selections"
                    type="number"
                    value={formData.maxSelections}
                    onChange={(e) => setFormData({...formData, maxSelections: parseInt(e.target.value) || 4})}
                    min="1"
                    max="10"
                    className="form-input"
                  />
                </div>
              </div>
              
              <div className="form-checkboxes">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.isEnabled}
                    onChange={(e) => setFormData({...formData, isEnabled: e.target.checked})}
                  />
                  <span className="checkmark"></span>
                  Habilitado
                </label>
                
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.isAvailable}
                    onChange={(e) => setFormData({...formData, isAvailable: e.target.checked})}
                  />
                  <span className="checkmark"></span>
                  Disponible
                </label>
              </div>
            </div>

            {/* Paso 3: Selección de Productos */}
            <div className="form-step">
              <h3>🧩 Paso 3: Productos Disponibles para el Combo</h3>
              <p className="step-description">
                Selecciona todos los productos que quieres que aparezcan como opciones en este combo. 
                El mozo podrá elegir entre estos productos cuando tome el pedido.
              </p>
              
              <div className="products-selection">
                <div className="selection-header">
                  <div className="selection-stats">
                    <span className="selected-count">
                      {components.length} productos seleccionados
                    </span>
                    <span className="total-count">
                      de {availableProducts.length} disponibles
                    </span>
                  </div>
                  
                  <div className="selection-actions">
                    <button
                      type="button"
                      className="btn-select-all"
                      onClick={() => selectAllProducts()}
                    >
                      ✅ Seleccionar Todos
                    </button>
                    <button
                      type="button"
                      className="btn-clear-all"
                      onClick={() => clearAllProducts()}
                    >
                      🗑️ Limpiar Todo
                    </button>
                  </div>
                </div>

                {/* Botones por Categoría */}
                <div className="category-selection">
                  <h4>📂 Seleccionar por Categoría:</h4>
                  <div className="category-buttons">
                    {categories.map((category) => {
                      const categoryProducts = availableProducts.filter(p => p.product_category_id === category.id);
                      const categoryProductIds = categoryProducts.map(p => p.product_id);
                      const selectedInCategory = components.filter(comp => 
                        categoryProductIds.includes(comp.productId)
                      ).length;
                      
                      return (
                        <button
                          key={category.id}
                          type="button"
                          className={`btn-category ${selectedInCategory === categoryProducts.length && categoryProducts.length > 0 ? 'all-selected' : selectedInCategory > 0 ? 'partially-selected' : ''}`}
                          onClick={() => toggleCategorySelection(category.id)}
                          title={`${selectedInCategory}/${categoryProducts.length} seleccionados`}
                          disabled={categoryProducts.length === 0}
                        >
                          <span className="category-icon">
                            {selectedInCategory === categoryProducts.length && categoryProducts.length > 0 ? '✅' : 
                             selectedInCategory > 0 ? '🔄' : '📁'}
                          </span>
                          <span className="category-name">{category.name}</span>
                          <span className="category-count">({categoryProducts.length})</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="products-grid">
                  {availableProducts.map((product) => {
                    const isSelected = components.some(comp => comp.productId === product.product_id);
                    return (
                      <div 
                        key={product.product_id} 
                        className={`product-card ${isSelected ? 'selected' : ''}`}
                        onClick={() => toggleProductSelection(product)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            toggleProductSelection(product);
                          }
                        }}
                      >
                        <div className="product-checkbox">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleProductSelection(product)}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                        
                        <div className="product-info">
                          <h4 className="product-name">{product.product_name}</h4>
                          <p className="product-category">{product.product_category_name}</p>
                          <p className="product-price">S/. {product.product_price}</p>
                          {product.product_description && (
                            <p className="product-description">{product.product_description}</p>
                          )}
                        </div>
                        
                        <div className="product-status">
                          {product.product_is_available ? (
                            <span className="status-available">✅ Disponible</span>
                          ) : (
                            <span className="status-unavailable">❌ No disponible</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {components.length > 0 && (
                  <div className="selected-products-summary">
                    <h4>📋 Productos Seleccionados:</h4>
                    <div className="selected-list">
                      {components.map((component, index) => (
                        <div key={component.id} className="selected-item">
                          <span className="item-name">{component.name}</span>
                          <span className="item-price">S/. {component.price}</span>
                          <button
                            type="button"
                            className="btn-remove-item"
                            onClick={() => handleDeleteComponent(component.id!)}
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Botones de Acción */}
            <div className="form-actions-new">
              <button type="submit" className="btn-save-new" disabled={loading}>
                {loading ? '⏳ Guardando...' : (editingCombo ? '💾 Actualizar Combo' : '✨ Crear Combo')}
              </button>
              
              <button
                type="button"
                className="btn-cancel-new"
                onClick={onClose}
                disabled={loading}
              >
                ❌ Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>

    </div>
  );
};

export default ComboCreationModal;
