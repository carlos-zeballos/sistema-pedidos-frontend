import React, { useState, useEffect } from 'react';
import { catalogService } from '../services/api';
import ComboCreationModal from './ComboCreationModal';
import './ComboManagement.css';

interface ComboFormData {
  code: string;
  name: string;
  basePrice: number;
  categoryId: string;
  description?: string;
  image?: string;
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

interface Product {
  id: string;
  name: string;
  price: number;
  type: string;
  categoryId: string;
  isEnabled: boolean;
  isAvailable: boolean;
}

interface Category {
  id: string;
  name: string;
  isActive: boolean;
}

interface Combo {
  id: string;
  code: string;
  name: string;
  basePrice: number;
  description?: string;
  image?: string;
  isEnabled: boolean;
  isAvailable: boolean;
  preparationTime: number;
  categoryId: string;
  maxSelections: number;
  components?: ComboComponent[];
}

interface ComboComponent {
  id: string;
  name: string;
  description?: string;
  type: 'SABOR' | 'SALSA' | 'COMPLEMENTO';
  price?: number;
  isRequired: boolean;
  isAvailable: boolean;
  maxSelections: number;
  ord: number;
}

const ComboManagement: React.FC = () => {
  const [combos, setCombos] = useState<Combo[]>([]);
  const [, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  
  // Estados del formulario
  const [showForm, setShowForm] = useState(false);
  const [editingCombo, setEditingCombo] = useState<Combo | null>(null);
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

  // Estados para gestión de componentes
  const [components, setComponents] = useState<ComboComponentForm[]>([]);
  const [showComponentForm, setShowComponentForm] = useState(false);
  const [editingComponent, setEditingComponent] = useState<ComboComponentForm | null>(null);
  const [componentForm, setComponentForm] = useState<ComboComponentForm>({
    productId: '',
    name: '',
    description: '',
    type: 'SABOR',
    price: 0,
    isRequired: false,
    isAvailable: true,
    maxSelections: 1,
    ord: 1
  });

  // Estados para productos disponibles
  const [availableProducts, setAvailableProducts] = useState<ProductForCombo[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  // Estados de filtros
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadData();
    loadAvailableProducts();
    
    // Actualizar datos cada 30 segundos
    const interval = setInterval(() => {
      console.log('🔄 ComboManagement - Actualización automática de datos...');
      loadData();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const loadAvailableProducts = async () => {
    try {
      setLoadingProducts(true);
      const products = await catalogService.getProductsForComboComponents();
      setAvailableProducts(products);
    } catch (error: any) {
      console.error('Error loading products for combo components:', error);
      setError('Error al cargar productos disponibles');
    } finally {
      setLoadingProducts(false);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log('🔄 ComboManagement.loadData - Iniciando carga de datos...');
      
      const [combosData, , categoriesData] = await Promise.all([
        catalogService.getCombos(),
        catalogService.getProducts(),
        catalogService.getCategories()
      ]);

      console.log('✅ ComboManagement.loadData - Datos obtenidos:');
      console.log(`   📊 Combos: ${combosData?.length || 0}`);
      console.log(`   📊 Categorías: ${categoriesData?.length || 0}`);
      
      if (combosData && combosData.length > 0) {
        console.log('🍱 Combos obtenidos:');
        combosData.forEach((combo: Combo, index: number) => {
          console.log(`   ${index + 1}. ${combo.name} (${combo.code}) - $${combo.basePrice}`);
        });
      }

      setCombos(combosData || []);
      setCategories(categoriesData.filter((cat: Category) => cat.isActive));
      setLastUpdated(new Date());
      
      console.log('🎉 ComboManagement.loadData - Datos cargados exitosamente');
    } catch (error: any) {
      setError('Error al cargar los datos: ' + error.message);
      console.error('❌ ComboManagement.loadData - Error:', error);
      console.error('❌ ComboManagement.loadData - Error message:', error.message);
      console.error('❌ ComboManagement.loadData - Error response:', error.response?.data);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
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
    setComponents([]);
    setEditingCombo(null);
  };

  const resetComponentForm = () => {
    setComponentForm({
      productId: '',
      name: '',
      description: '',
      type: 'SABOR',
      price: 0,
      isRequired: false,
      isAvailable: true,
      maxSelections: 1,
      ord: 1
    });
    setEditingComponent(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('🔍 Form submission - formData:', formData);
    
    try {
      setError('');
      setSuccess('');

      // Validaciones básicas
      if (!formData.code.trim()) {
        console.log('❌ Code validation failed:', formData.code);
        setError('El código es obligatorio');
        return;
      }
      if (!formData.name.trim()) {
        console.log('❌ Name validation failed:', formData.name);
        setError('El nombre es obligatorio');
        return;
      }
      if (formData.basePrice <= 0) {
        setError('El precio debe ser mayor a 0');
        return;
      }
      if (!formData.categoryId) {
        setError('Debe seleccionar una categoría');
        return;
      }
      // Validación simplificada - los componentes se manejan en el backend

      // Preparar datos con componentes
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
        // Actualizar combo existente
        await catalogService.updateCombo(editingCombo.id, comboData);
        setSuccess('Combo actualizado exitosamente');
      } else {
        // Crear nuevo combo
        await catalogService.createCombo(comboData);
        setSuccess('Combo creado exitosamente');
      }

      // Limpiar formulario y recargar datos
      resetForm();
      setShowForm(false);
      await loadData();
      
      // Limpiar mensaje de éxito después de 3 segundos
      setTimeout(() => setSuccess(''), 3000);
      
    } catch (error: any) {
      setError('Error al guardar el combo: ' + error.message);
      console.error('Error saving combo:', error);
    }
  };

  const handleEdit = async (combo: Combo) => {
    console.log('🔍 Editing combo:', combo);
    
    try {
      setLoading(true);
      setError('');
      
      // Cargar datos completos del combo incluyendo componentes
      const fullComboData = await catalogService.getComboById(combo.id);
      console.log('📋 Full combo data:', fullComboData);
      
      setEditingCombo(fullComboData);
      
      // Mapear datos básicos del combo
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

      // Mapear componentes del combo
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
        console.log('📋 Mapped components:', mappedComponents);
      } else {
        setComponents([]);
        console.log('📋 No components found');
      }
      
      setShowForm(true);
    } catch (error: any) {
      setError('Error al cargar los datos del combo: ' + error.message);
      console.error('Error loading combo data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (comboId: string) => {
    if (!window.confirm('¿Está seguro de que desea eliminar este combo?')) {
      return;
    }

    try {
      await catalogService.deleteCombo(comboId);
      setSuccess('Combo eliminado exitosamente');
      await loadData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error: any) {
      setError('Error al eliminar el combo: ' + error.message);
    }
  };

  const toggleComboStatus = async (combo: Combo, field: 'isEnabled' | 'isAvailable') => {
    try {
      const updatedData = { ...formData, [field]: !combo[field] };
      await catalogService.updateCombo(combo.id, updatedData);
      await loadData();
    } catch (error: any) {
      setError('Error al actualizar el estado: ' + error.message);
    }
  };

  // Funciones para gestión de componentes
  const handleAddComponent = () => {
    setEditingComponent(null);
    resetComponentForm();
    setShowComponentForm(true);
  };

  const handleEditComponent = (component: ComboComponentForm) => {
    setEditingComponent(component);
    setComponentForm(component);
    setShowComponentForm(true);
  };

  const handleSaveComponent = () => {
    if (!componentForm.productId) {
      alert('Debe seleccionar un producto');
      return;
    }

    if (!componentForm.name.trim()) {
      alert('El nombre del componente es requerido');
      return;
    }

    if (editingComponent) {
      // Actualizar componente existente
      setComponents(prev => prev.map(comp => 
        comp.id === editingComponent.id ? componentForm : comp
      ));
    } else {
      // Agregar nuevo componente
      const newComponent = {
        ...componentForm,
        id: `temp-${Date.now()}` // ID temporal para nuevos componentes
      };
      setComponents(prev => [...prev, newComponent]);
    }
    setShowComponentForm(false);
    resetComponentForm();
  };

  const handleDeleteComponent = (componentId: string) => {
    setComponents(prev => prev.filter(comp => comp.id !== componentId));
  };

  const handleProductSelect = (productId: string) => {
    const selectedProduct = availableProducts.find(p => p.product_id === productId);
    if (selectedProduct) {
      setComponentForm(prev => ({
        ...prev,
        productId: selectedProduct.product_id,
        name: selectedProduct.product_name,
        price: selectedProduct.product_price,
        description: selectedProduct.product_description
      }));
    }
  };

  const getComponentsByType = (type: string) => {
    return components.filter(comp => comp.type === type);
  };

  // Filtrar combos
  const filteredCombos = combos.filter((combo: Combo) => {
    const matchesCategory = selectedCategory === 'all' || combo.categoryId === selectedCategory;
    const matchesSearch = combo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         combo.code.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Debug: Log de filtrado
  console.log('🔍 ComboManagement - Filtrado:');
  console.log(`   📊 Total combos: ${combos.length}`);
  console.log(`   📊 Combos filtrados: ${filteredCombos.length}`);
  console.log(`   🔍 Categoría seleccionada: ${selectedCategory}`);
  console.log(`   🔍 Término de búsqueda: "${searchTerm}"`);

  // Obtener productos por tipo (para futuras funcionalidades)
  // const comidaProducts = products.filter((p: Product) => p.type === 'COMIDA' && p.isEnabled && p.isAvailable);
  // const acompProducts = products.filter((p: Product) => p.type === 'ADICIONAL' && p.isEnabled && p.isAvailable);

  if (loading) {
    return (
      <div className="combo-management">
        <div className="loading">Cargando combos...</div>
      </div>
    );
  }

  return (
    <div className="combo-management">
      {/* Header */}
      <div className="combo-header">
        <div className="header-content">
          <div className="header-text">
            <h1>🍱 Gestión de Combos</h1>
            <p>Administra los combos personalizables de tu restaurante</p>
            {lastUpdated && (
              <p className="last-updated">
                Última actualización: {lastUpdated.toLocaleTimeString()}
              </p>
            )}
          </div>
          <div className="header-actions">
            <button 
              className="refresh-btn"
              onClick={loadData}
              disabled={loading}
              title="Actualizar datos"
            >
              🔄 {loading ? 'Cargando...' : 'Actualizar'}
            </button>
          </div>
        </div>
        
        <div className="combo-stats">
          <div className="stat-item">
            <span className="stat-number">{combos.length}</span>
            <span className="stat-label">Total Combos</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{filteredCombos.length}</span>
            <span className="stat-label">Mostrados</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{combos.filter(c => c.isAvailable).length}</span>
            <span className="stat-label">Disponibles</span>
          </div>
        </div>
      </div>

      {/* Mensajes de estado */}
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      {/* Controles superiores */}
      <div className="combo-controls">
        <div className="controls-left">
          <button 
            className="btn-primary"
            onClick={() => setShowForm(true)}
          >
            ➕ Nuevo Combo
          </button>
        </div>
        
        <div className="controls-right">
          <select 
            value={selectedCategory} 
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="filter-select"
          >
            <option value="all">Todas las categorías</option>
            {categories.map((cat: Category) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
          
          <input
            type="text"
            placeholder="Buscar combos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      {/* Lista de combos */}
      <div className="combos-grid">
        {filteredCombos.length === 0 ? (
          <div className="no-combos">
            <p>No se encontraron combos</p>
            <button 
              className="btn-secondary"
              onClick={() => {
                resetForm();
                setShowForm(true);
              }}
            >
              Crear el primer combo
            </button>
          </div>
        ) : (
          filteredCombos.map((combo: Combo) => (
            <div key={combo.id} className="combo-card">
              <div className="combo-header-card">
                <h3>{combo.name}</h3>
                <span className="combo-code">{combo.code}</span>
              </div>
              
              <div className="combo-details">
                <div className="combo-price">
                  <span className="price-label">Precio base:</span>
                  <span className="price-value">${combo.basePrice}</span>
                </div>
                
                <div className="combo-info">
                  <span className="prep-time">⏱️ {combo.preparationTime} min</span>
                  <span className={`status ${combo.isAvailable ? 'available' : 'unavailable'}`}>
                    {combo.isAvailable ? '✅ Disponible' : '❌ No disponible'}
                  </span>
                </div>
              </div>

              {combo.components && combo.components.length > 0 && (
                <div className="combo-components">
                  <h4>Componentes:</h4>
                  <div className="components-list">
                                         {combo.components.map((comp: any, index: number) => (
                      <div key={index} className="component-item">
                        <span className="component-name">{comp.name}</span>
                        <span className="component-type">{comp.type}</span>
                        <span className="component-max">Max: {comp.maxSelections}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="combo-actions">
                <button 
                  onClick={() => handleEdit(combo)}
                  className="btn-edit"
                >
                  ✏️ Editar
                </button>
                
                <button 
                  onClick={() => toggleComboStatus(combo, 'isEnabled')}
                  className={`btn-toggle ${combo.isEnabled ? 'enabled' : 'disabled'}`}
                >
                  {combo.isEnabled ? '✅ Habilitado' : '❌ Deshabilitado'}
                </button>
                
                <button 
                  onClick={() => toggleComboStatus(combo, 'isAvailable')}
                  className={`btn-toggle ${combo.isAvailable ? 'available' : 'unavailable'}`}
                >
                  {combo.isAvailable ? '🟢 Disponible' : '🔴 No disponible'}
                </button>
                
                <button 
                  onClick={() => handleDelete(combo.id)}
                  className="btn-delete"
                >
                  🗑️ Eliminar
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal del formulario */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingCombo ? 'Editar Combo' : 'Nuevo Combo'}</h2>
              <button 
                className="close-button"
                onClick={() => setShowForm(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="combo-form" style={{padding: '20px', minHeight: '400px'}}>
              {/* Información básica */}
              <div className="form-section">
                <h3>📋 Información Básica</h3>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>Código *</label>
                    <input
                      type="text"
                      name="code"
                      value={formData.code}
                      onChange={(e) => setFormData({...formData, code: e.target.value})}
                      placeholder="Ej: COMBO_001"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Nombre *</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      placeholder="Ej: Combo Familiar"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Precio Base *</label>
                    <input
                      type="number"
                      name="basePrice"
                      step="0.01"
                      min="0"
                      value={formData.basePrice}
                      onChange={(e) => setFormData({...formData, basePrice: parseFloat(e.target.value) || 0})}
                      placeholder="0.00"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Categoría *</label>
                    <select
                      name="categoryId"
                      value={formData.categoryId}
                      onChange={(e) => setFormData({...formData, categoryId: e.target.value})}
                    >
                      <option value="">Seleccionar categoría</option>
                                             {categories.map((cat: Category) => (
                         <option key={cat.id} value={cat.id}>{cat.name}</option>
                       ))}
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Máximo de selecciones</label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={formData.maxSelections}
                      onChange={(e) => setFormData({...formData, maxSelections: parseInt(e.target.value) || 4})}
                      placeholder="4"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Tiempo de preparación (minutos)</label>
                    <input
                      type="number"
                      min="1"
                      max="120"
                      value={formData.preparationTime}
                      onChange={(e) => setFormData({...formData, preparationTime: parseInt(e.target.value) || 20})}
                      placeholder="20"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Descripción</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Descripción del combo..."
                    rows={3}
                  />
                </div>
              </div>

              {/* Gestión de componentes */}
              <div className="form-section">
                <h3>🍽️ Componentes del Combo</h3>
                
                <div className="components-header">
                  <button 
                    type="button"
                    onClick={handleAddComponent}
                    className="btn-add-component"
                  >
                    ➕ Agregar Componente
                  </button>
                </div>

                {/* Componentes por tipo */}
                {['SABOR', 'SALSA', 'COMPLEMENTO'].map(type => {
                  const typeComponents = getComponentsByType(type);
                  return (
                    <div key={type} className="component-type-section">
                      <h4>{type}s ({typeComponents.length})</h4>
                      {typeComponents.length === 0 ? (
                        <p className="no-components">No hay {type.toLowerCase()}s configurados</p>
                      ) : (
                        <div className="components-list">
                          {typeComponents.map((component, index) => (
                            <div key={component.id} className="component-item">
                              <div className="component-info">
                                <span className="component-name">{component.name}</span>
                                <span className="component-details">
                                  Max: {component.maxSelections} | 
                                  {component.isRequired ? ' Requerido' : ' Opcional'} |
                                  {component.isAvailable ? ' Disponible' : ' No disponible'}
                                </span>
                              </div>
                              <div className="component-actions">
                                <button 
                                  type="button"
                                  onClick={() => handleEditComponent(component)}
                                  className="btn-edit-small"
                                >
                                  ✏️
                                </button>
                                <button 
                                  type="button"
                                  onClick={() => handleDeleteComponent(component.id!)}
                                  className="btn-delete-small"
                                >
                                  🗑️
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Configuración adicional */}
              <div className="form-section">
                <h3>⚙️ Configuración</h3>
                
                <div className="form-group">
                  <label>Estado del combo</label>
                  <div className="checkbox-group">
                    <label className="checkbox-item">
                      <input
                        type="checkbox"
                        checked={formData.isEnabled}
                        onChange={(e) => setFormData({...formData, isEnabled: e.target.checked})}
                      />
                      <span>Habilitado</span>
                    </label>
                    
                    <label className="checkbox-item">
                      <input
                        type="checkbox"
                        checked={formData.isAvailable}
                        onChange={(e) => setFormData({...formData, isAvailable: e.target.checked})}
                      />
                      <span>Disponible</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Acciones del formulario */}
              <div className="form-actions">
                <button type="submit" className="btn-save">
                  {editingCombo ? '💾 Actualizar Combo' : '✨ Crear Combo'}
                </button>
                
                <button 
                  type="button" 
                  className="btn-cancel"
                  onClick={() => setShowForm(false)}
                >
                  ❌ Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal para crear/editar componentes */}
      {showComponentForm && (
        <div className="modal-overlay" onClick={() => setShowComponentForm(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingComponent ? 'Editar Componente' : 'Nuevo Componente'}</h2>
              <button 
                className="close-button"
                onClick={() => setShowComponentForm(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handleSaveComponent(); }} className="component-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Producto *</label>
                  <select
                    name="productId"
                    value={componentForm.productId}
                    onChange={(e) => handleProductSelect(e.target.value)}
                    disabled={loadingProducts}
                  >
                    <option value="">
                      {loadingProducts ? 'Cargando productos...' : 'Seleccionar producto...'}
                    </option>
                    {availableProducts.map(product => (
                      <option key={product.product_id} value={product.product_id}>
                        {product.product_name} - S/. {product.product_price} ({product.product_category_name})
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="form-group">
                  <label>Tipo *</label>
                  <select
                    name="type"
                    value={componentForm.type}
                    onChange={(e) => setComponentForm({...componentForm, type: e.target.value as any})}
                  >
                    <option value="SABOR">SABOR</option>
                    <option value="SALSA">SALSA</option>
                    <option value="COMPLEMENTO">COMPLEMENTO</option>
                    <option value="PLATO">PLATO</option>
                    <option value="ACOMPAÑAMIENTO">ACOMPAÑAMIENTO</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Nombre *</label>
                  <input
                    type="text"
                    name="componentName"
                    value={componentForm.name}
                    onChange={(e) => setComponentForm({...componentForm, name: e.target.value})}
                    placeholder="Ej: Acevichado"
                    readOnly
                  />
                </div>
                
                <div className="form-group">
                  <label>Precio</label>
                  <input
                    type="number"
                    value={componentForm.price}
                    onChange={(e) => setComponentForm({...componentForm, price: parseFloat(e.target.value) || 0})}
                    placeholder="0.00"
                    step="0.01"
                    readOnly
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Máximo de selecciones</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={componentForm.maxSelections}
                    onChange={(e) => setComponentForm({...componentForm, maxSelections: parseInt(e.target.value) || 1})}
                  />
                </div>
                
                <div className="form-group">
                  <label>Orden</label>
                  <input
                    type="number"
                    min="1"
                    value={componentForm.ord}
                    onChange={(e) => setComponentForm({...componentForm, ord: parseInt(e.target.value) || 1})}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Descripción</label>
                <textarea
                  value={componentForm.description}
                  onChange={(e) => setComponentForm({...componentForm, description: e.target.value})}
                  placeholder="Descripción del componente..."
                  rows={2}
                />
              </div>

              <div className="form-group">
                <label>Configuración</label>
                <div className="checkbox-group">
                  <label className="checkbox-item">
                    <input
                      type="checkbox"
                      checked={componentForm.isRequired}
                      onChange={(e) => setComponentForm({...componentForm, isRequired: e.target.checked})}
                    />
                    <span>Requerido</span>
                  </label>
                  
                  <label className="checkbox-item">
                    <input
                      type="checkbox"
                      checked={componentForm.isAvailable}
                      onChange={(e) => setComponentForm({...componentForm, isAvailable: e.target.checked})}
                    />
                    <span>Disponible</span>
                  </label>
                </div>
              </div>

              <div className="form-actions">
                <button type="submit" className="btn-save">
                  {editingComponent ? '💾 Actualizar Componente' : '✨ Crear Componente'}
                </button>
                
                <button 
                  type="button" 
                  className="btn-cancel"
                  onClick={() => setShowComponentForm(false)}
                >
                  ❌ Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Nuevo Modal de Creación de Combos */}
      <ComboCreationModal
        isOpen={showForm}
        onClose={() => {
          console.log('🚪 Cerrando modal, reseteando editingCombo');
          setEditingCombo(null);
          setShowForm(false);
        }}
        onSuccess={() => {
          loadData();
          setEditingCombo(null);
          setShowForm(false);
        }}
        editingCombo={editingCombo}
      />
    </div>
  );
};

export default ComboManagement;
