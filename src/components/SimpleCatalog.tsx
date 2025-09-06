import React, { useState, useEffect } from 'react';
import { catalogService } from '../services/api';
import { Category, Product, Space, Combo } from '../types';
import './SimpleCatalog.css';

const SimpleCatalog: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [combos, setCombos] = useState<Combo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'products' | 'categories' | 'spaces' | 'combos'>('products');
  
  // Estados para formularios
  const [showProductForm, setShowProductForm] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [showSpaceForm, setShowSpaceForm] = useState(false);
  const [showComboForm, setShowComboForm] = useState(false);

  // Estados para edición
  const [editingItem, setEditingItem] = useState<any>(null);
  const [editingType, setEditingType] = useState<'product' | 'category' | 'space' | 'combo' | null>(null);

  // Datos de formularios
  const [productForm, setProductForm] = useState({
    code: '',
    name: '',
    categoryId: '',
    price: 0,
    type: 'COMIDA' as const,
    description: '',
    preparationTime: 15,
    isEnabled: true,
    isAvailable: true,
    allergens: [] as string[],
    nutritionalInfo: {}
  });

  const [categoryForm, setCategoryForm] = useState({
    name: '',
    ord: 0,
    description: '',
    isActive: true
  });

  const [spaceForm, setSpaceForm] = useState({
    code: '',
    name: '',
    type: 'MESA' as const,
    capacity: 4,
    status: 'LIBRE' as const,
    isActive: true,
    notes: ''
  });

  // Cargar datos
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [categoriesData, productsData, spacesData, combosData] = await Promise.all([
        catalogService.getCategories(),
        catalogService.getProducts(),
        catalogService.getSpaces(),
        catalogService.getCombos()
      ]);
      
      setCategories(categoriesData);
      setProducts(productsData);
      setSpaces(spacesData);
      setCombos(combosData);
      setError('');
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  // Funciones de editar y borrar
  const handleEdit = (item: any, type: 'product' | 'category' | 'space' | 'combo') => {
    setEditingItem(item);
    setEditingType(type);
    
    if (type === 'product') {
      setProductForm({
        code: item.code,
        name: item.name,
        categoryId: item.categoryId,
        price: item.price,
        type: item.type,
        description: item.description || '',
        preparationTime: item.preparationTime || 15,
        isEnabled: item.isEnabled,
        isAvailable: item.isAvailable,
        allergens: item.allergens || [],
        nutritionalInfo: item.nutritionalInfo || {}
      });
      setShowProductForm(true);
    } else if (type === 'category') {
      setCategoryForm({
        name: item.name,
        ord: item.ord,
        description: item.description || '',
        isActive: item.isActive
      });
      setShowCategoryForm(true);
    } else if (type === 'space') {
      setSpaceForm({
        code: item.code,
        name: item.name,
        type: item.type,
        capacity: item.capacity,
        status: item.status,
        isActive: item.isActive,
        notes: item.notes || ''
      });
      setShowSpaceForm(true);
    }
  };

  const handleDelete = async (id: string, type: 'product' | 'category' | 'space' | 'combo') => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este elemento?')) {
      return;
    }

    try {
      if (type === 'product') {
        await catalogService.deleteProduct(id);
      } else if (type === 'category') {
        await catalogService.deleteCategory(id);
      } else if (type === 'space') {
        await catalogService.deleteSpace(id);
      } else if (type === 'combo') {
        await catalogService.deleteCombo(id);
      }
      loadData();
    } catch (err) {
      console.error(`Error deleting ${type}:`, err);
      setError(`Error al eliminar el ${type}`);
    }
  };

  const resetForms = () => {
    setEditingItem(null);
    setEditingType(null);
    setProductForm({
      code: '',
      name: '',
      categoryId: '',
      price: 0,
      type: 'COMIDA',
      description: '',
      preparationTime: 15,
      isEnabled: true,
      isAvailable: true,
      allergens: [],
      nutritionalInfo: {}
    });
    setCategoryForm({
      name: '',
      ord: 0,
      description: '',
      isActive: true
    });
    setSpaceForm({
      code: '',
      name: '',
      type: 'MESA',
      capacity: 4,
      status: 'LIBRE',
      isActive: true,
      notes: ''
    });
  };

  // Handlers para crear
  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await catalogService.updateProduct(editingItem.id, productForm);
      } else {
        await catalogService.createProduct(productForm);
      }
      setShowProductForm(false);
      resetForms();
      loadData();
    } catch (err) {
      console.error('Error creating/updating product:', err);
      setError('Error al crear/actualizar el producto');
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await catalogService.updateCategory(editingItem.id, categoryForm);
      } else {
        await catalogService.createCategory(categoryForm);
      }
      setShowCategoryForm(false);
      resetForms();
      loadData();
    } catch (err) {
      console.error('Error creating/updating category:', err);
      setError('Error al crear/actualizar la categoría');
    }
  };

  const handleCreateSpace = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await catalogService.updateSpace(editingItem.id, spaceForm);
      } else {
        await catalogService.createSpace(spaceForm);
      }
      setShowSpaceForm(false);
      resetForms();
      loadData();
    } catch (err) {
      console.error('Error creating/updating space:', err);
      setError('Error al crear/actualizar el espacio');
    }
  };

  if (loading) {
    return (
      <div className="simple-catalog">
        <div className="loading">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="simple-catalog">
      <div className="catalog-header">
        <h1>📋 Gestión de Catálogo</h1>
        <p>Administra productos, categorías y espacios</p>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="tabs">
        <button 
          className={`tab ${activeTab === 'products' ? 'active' : ''}`}
          onClick={() => setActiveTab('products')}
        >
          🍽️ Productos ({products.length})
        </button>
        <button 
          className={`tab ${activeTab === 'categories' ? 'active' : ''}`}
          onClick={() => setActiveTab('categories')}
        >
          📂 Categorías ({categories.length})
        </button>
        <button 
          className={`tab ${activeTab === 'spaces' ? 'active' : ''}`}
          onClick={() => setActiveTab('spaces')}
        >
          🏠 Espacios ({spaces.length})
        </button>
        <button 
          className={`tab ${activeTab === 'combos' ? 'active' : ''}`}
          onClick={() => setActiveTab('combos')}
        >
          🍱 Combos ({combos.length})
        </button>
      </div>

      <div className="tab-content">
        {/* Tab de Productos */}
        {activeTab === 'products' && (
          <div>
            <div className="section-header">
              <h2>Productos</h2>
              <button 
                className="create-button"
                onClick={() => { resetForms(); setShowProductForm(true); }}
              >
                ➕ Nuevo Producto
              </button>
            </div>
            
            <div className="items-list">
              {products.map(product => (
                <div key={product.id} className="item-card">
                  <h3>{product.name}</h3>
                  <p>Código: {product.code}</p>
                  <p>Precio: S/ {product.price}</p>
                  <p>Tipo: {product.type}</p>
                  <p>Disponible: {product.isAvailable ? 'Sí' : 'No'}</p>
                  <div className="item-actions">
                    <button 
                      className="edit-button"
                      onClick={() => handleEdit(product, 'product')}
                      title="Editar producto"
                    >
                      ✏️ Editar
                    </button>
                    <button 
                      className="delete-button"
                      onClick={() => handleDelete(product.id, 'product')}
                      title="Eliminar producto"
                    >
                      🗑️ Eliminar
                    </button>
                  </div>
                </div>
              ))}
              {products.length === 0 && (
                <div className="empty-state">
                  <p>No hay productos disponibles</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab de Categorías */}
        {activeTab === 'categories' && (
          <div>
            <div className="section-header">
              <h2>Categorías</h2>
              <button 
                className="create-button"
                onClick={() => { resetForms(); setShowCategoryForm(true); }}
              >
                ➕ Nueva Categoría
              </button>
            </div>
            
            <div className="items-list">
              {categories.map(category => (
                <div key={category.id} className="item-card">
                  <h3>{category.name}</h3>
                  <p>Orden: {category.ord}</p>
                  <p>Descripción: {category.description || 'Sin descripción'}</p>
                  <p>Activa: {category.isActive ? 'Sí' : 'No'}</p>
                  <div className="item-actions">
                    <button 
                      className="edit-button"
                      onClick={() => handleEdit(category, 'category')}
                      title="Editar categoría"
                    >
                      ✏️ Editar
                    </button>
                    <button 
                      className="delete-button"
                      onClick={() => handleDelete(category.id, 'category')}
                      title="Eliminar categoría"
                    >
                      🗑️ Eliminar
                    </button>
                  </div>
                </div>
              ))}
              {categories.length === 0 && (
                <div className="empty-state">
                  <p>No hay categorías disponibles</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab de Espacios */}
        {activeTab === 'spaces' && (
          <div>
            <div className="section-header">
              <h2>Espacios</h2>
              <button 
                className="create-button"
                onClick={() => { resetForms(); setShowSpaceForm(true); }}
              >
                ➕ Nuevo Espacio
              </button>
            </div>
            
            <div className="items-list">
              {spaces.map(space => (
                <div key={space.id} className="item-card">
                  <h3>{space.name}</h3>
                  <p>Código: {space.code}</p>
                  <p>Tipo: {space.type}</p>
                  <p>Capacidad: {space.capacity}</p>
                  <p>Estado: {space.status}</p>
                  <div className="item-actions">
                    <button 
                      className="edit-button"
                      onClick={() => handleEdit(space, 'space')}
                      title="Editar espacio"
                    >
                      ✏️ Editar
                    </button>
                    <button 
                      className="delete-button"
                      onClick={() => handleDelete(space.id, 'space')}
                      title="Eliminar espacio"
                    >
                      🗑️ Eliminar
                    </button>
                  </div>
                </div>
              ))}
              {spaces.length === 0 && (
                <div className="empty-state">
                  <p>No hay espacios disponibles</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab de Combos */}
        {activeTab === 'combos' && (
          <div>
            <div className="section-header">
              <h2>Combos</h2>
              <button 
                className="create-button"
                onClick={() => { resetForms(); setShowComboForm(true); }}
              >
                ➕ Nuevo Combo
              </button>
            </div>
            
            <div className="items-list">
              {combos.map(combo => (
                <div key={combo.id} className="item-card">
                  <h3>{combo.name}</h3>
                  <p>Código: {combo.code}</p>
                  <p>Precio Base: S/ {combo.basePrice}</p>
                  <p>Disponible: {combo.isAvailable ? 'Sí' : 'No'}</p>
                  <div className="item-actions">
                    <button 
                      className="edit-button"
                      onClick={() => handleEdit(combo, 'combo')}
                      title="Editar combo"
                    >
                      ✏️ Editar
                    </button>
                    <button 
                      className="delete-button"
                      onClick={() => handleDelete(combo.id, 'combo')}
                      title="Eliminar combo"
                    >
                      🗑️ Eliminar
                    </button>
                  </div>
                </div>
              ))}
              {combos.length === 0 && (
                <div className="empty-state">
                  <p>No hay combos disponibles</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modal de Producto */}
      {showProductForm && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>{editingItem ? "Editar Producto" : "Nuevo Producto"}</h2>
            <form onSubmit={handleCreateProduct}>
              <div className="form-group">
                <label>Código *</label>
                <input
                  type="text"
                  value={productForm.code}
                  onChange={(e) => setProductForm({...productForm, code: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Nombre *</label>
                <input
                  type="text"
                  value={productForm.name}
                  onChange={(e) => setProductForm({...productForm, name: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Categoría *</label>
                <select
                  value={productForm.categoryId}
                  onChange={(e) => setProductForm({...productForm, categoryId: e.target.value})}
                  required
                >
                  <option value="">Seleccionar categoría</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Precio *</label>
                <input
                  type="number"
                  step="0.01"
                  value={productForm.price}
                  onChange={(e) => setProductForm({...productForm, price: parseFloat(e.target.value)})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Tipo</label>
                <select
                  value={productForm.type}
                  onChange={(e) => setProductForm({...productForm, type: e.target.value as any})}
                >
                  <option value="COMIDA">Comida</option>
                  <option value="BEBIDA">Bebida</option>
                  <option value="POSTRE">Postre</option>
                  <option value="ADICIONAL">Adicional</option>
                </select>
              </div>
              <div className="form-group">
                <label>Descripción</label>
                <textarea
                  value={productForm.description}
                  onChange={(e) => setProductForm({...productForm, description: e.target.value})}
                />
              </div>
              <div className="modal-actions">
                <button type="submit" className="save-button">{editingItem ? "Actualizar" : "Crear"}</button>
                <button type="button" onClick={() => { setShowProductForm(false); resetForms(); }}>Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Categoría */}
      {showCategoryForm && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>{editingItem ? "Editar Categoría" : "Nueva Categoría"}</h2>
            <form onSubmit={handleCreateCategory}>
              <div className="form-group">
                <label>Nombre *</label>
                <input
                  type="text"
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({...categoryForm, name: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Orden</label>
                <input
                  type="number"
                  value={categoryForm.ord}
                  onChange={(e) => setCategoryForm({...categoryForm, ord: parseInt(e.target.value)})}
                />
              </div>
              <div className="form-group">
                <label>Descripción</label>
                <textarea
                  value={categoryForm.description}
                  onChange={(e) => setCategoryForm({...categoryForm, description: e.target.value})}
                />
              </div>
              <div className="modal-actions">
                <button type="submit" className="save-button">{editingItem ? "Actualizar" : "Crear"}</button>
                <button type="button" onClick={() => { setShowCategoryForm(false); resetForms(); }}>Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Espacio */}
      {showSpaceForm && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>{editingItem ? "Editar Espacio" : "Nuevo Espacio"}</h2>
            <form onSubmit={handleCreateSpace}>
              <div className="form-group">
                <label>Código *</label>
                <input
                  type="text"
                  value={spaceForm.code}
                  onChange={(e) => setSpaceForm({...spaceForm, code: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Nombre *</label>
                <input
                  type="text"
                  value={spaceForm.name}
                  onChange={(e) => setSpaceForm({...spaceForm, name: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Tipo</label>
                <select
                  value={spaceForm.type}
                  onChange={(e) => setSpaceForm({...spaceForm, type: e.target.value as any})}
                >
                  <option value="MESA">Mesa</option>
                  <option value="BARRA">Barra</option>
                  <option value="DELIVERY">Delivery</option>
                  <option value="RESERVA">Reserva</option>
                </select>
              </div>
              <div className="form-group">
                <label>Capacidad</label>
                <input
                  type="number"
                  value={spaceForm.capacity}
                  onChange={(e) => setSpaceForm({...spaceForm, capacity: parseInt(e.target.value)})}
                />
              </div>
              <div className="modal-actions">
                <button type="submit" className="save-button">{editingItem ? "Actualizar" : "Crear"}</button>
                <button type="button" onClick={() => { setShowSpaceForm(false); resetForms(); }}>Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Combo */}
      {showComboForm && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>{editingItem ? "Editar Combo" : "Nuevo Combo"}</h2>
            <form onSubmit={(e) => e.preventDefault()}>
              <div className="form-group">
                <label>Código *</label>
                <input
                  type="text"
                  placeholder="Ej: COMBO001"
                  required
                />
              </div>
              <div className="form-group">
                <label>Nombre *</label>
                <input
                  type="text"
                  placeholder="Ej: Combo Sushi Clásico"
                  required
                />
              </div>
              <div className="form-group">
                <label>Precio Base *</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  required
                />
              </div>
              <div className="form-group">
                <label>Descripción</label>
                <textarea
                  placeholder="Descripción del combo..."
                />
              </div>
              <div className="modal-actions">
                <button type="submit" className="save-button">{editingItem ? "Actualizar" : "Crear"}</button>
                <button type="button" onClick={() => { setShowComboForm(false); resetForms(); }}>Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SimpleCatalog;

/* Catálogo simplificado corregido: 2025-08-31T12:14:40.452Z */