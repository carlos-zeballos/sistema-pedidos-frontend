import React, { useState, useEffect } from 'react';
import { catalogService, authService } from '../services/api';
import { Category, Product, Space } from '../types';
import './CatalogManagement.css';

interface ProductFormData {
  code: string;
  name: string;
  categoryId: string;
  price: number;
  type: 'COMIDA' | 'BEBIDA' | 'POSTRE' | 'ADICIONAL';
  description?: string;
  image?: string;
  preparationTime?: number;
  isEnabled?: boolean;
  isAvailable?: boolean;
  allergens?: string[];
  nutritionalInfo?: Record<string, any>;
}

interface CategoryFormData {
  name: string;
  ord: number;
  description?: string;
  image?: string;
  isActive?: boolean;
}

interface SpaceFormData {
  code: string;
  name: string;
  type: 'MESA' | 'BARRA' | 'DELIVERY' | 'RESERVA';
  capacity?: number;
  status?: 'LIBRE' | 'OCUPADA' | 'RESERVADA' | 'MANTENIMIENTO';
  isActive?: boolean;
  notes?: string;
}

const CatalogManagement: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'products' | 'categories' | 'spaces'>('products');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // Estados para formularios
  const [showProductForm, setShowProductForm] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [showSpaceForm, setShowSpaceForm] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  // Estados de formularios
  const [productForm, setProductForm] = useState<ProductFormData>({
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

  const [categoryForm, setCategoryForm] = useState<CategoryFormData>({
    name: '',
    ord: 0,
    description: '',
    isActive: true
  });

  const [spaceForm, setSpaceForm] = useState<SpaceFormData>({
    code: '',
    name: '',
    type: 'MESA',
    capacity: 4,
    status: 'LIBRE',
    isActive: true,
    notes: ''
  });

  useEffect(() => {
    checkAuthentication();
    loadData();
  }, []);

  const checkAuthentication = () => {
    const authenticated = authService.isAuthenticated();
    const currentUser = authService.getCurrentUser();
    const token = localStorage.getItem('token');
    
    console.log('🔍 Authentication Debug:');
    console.log('  - isAuthenticated():', authenticated);
    console.log('  - currentUser:', currentUser);
    console.log('  - token exists:', !!token);
    console.log('  - token preview:', token ? token.substring(0, 50) + '...' : 'No token');
    
    setIsAuthenticated(authenticated);
    if (!authenticated) {
      setError('Debes iniciar sesión para acceder a esta funcionalidad');
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [categoriesData, productsData, spacesData] = await Promise.all([
        catalogService.getCategories(),
        catalogService.getProducts(),
        catalogService.getSpaces()
      ]);
      setCategories(categoriesData);
      setProducts(productsData);
      setSpaces(spacesData);
    } catch (error: any) {
      setError('Error al cargar los datos: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const resetForms = () => {
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
    setEditingItem(null);
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Verificar autenticación
    if (!isAuthenticated) {
      setError('Debes iniciar sesión para crear productos');
      return;
    }
    
    // Validación de campos requeridos
    if (!productForm.code.trim()) {
      setError('El código es requerido');
      return;
    }
    if (!productForm.name.trim()) {
      setError('El nombre es requerido');
      return;
    }
    if (!productForm.categoryId) {
      setError('La categoría es requerida');
      return;
    }
    if (isNaN(productForm.price) || productForm.price <= 0) {
      setError('El precio debe ser un número mayor a 0');
      return;
    }
    
    // Validación de duplicados (solo para nuevos productos)
    if (!editingItem) {
      const existingProduct = products.find(p => 
        p.code.toLowerCase() === productForm.code.toLowerCase()
      );
      if (existingProduct) {
        setError(`Ya existe un producto con el código "${productForm.code}". Por favor, elige un código diferente.`);
        return;
      }
      
      const existingNameInCategory = products.find(p => 
        p.name.toLowerCase() === productForm.name.toLowerCase() && 
        p.categoryId === productForm.categoryId
      );
      if (existingNameInCategory) {
        const categoryName = categories.find(c => c.id === productForm.categoryId)?.name || 'esta categoría';
        setError(`Ya existe un producto con el nombre "${productForm.name}" en ${categoryName}. Por favor, elige un nombre diferente.`);
        return;
      }
    }
    
    try {
      // Asegurar que todos los datos sean válidos antes de enviar
      const productData = {
        ...productForm,
        price: Number(productForm.price), // Asegurar que sea un número
        preparationTime: Number(productForm.preparationTime) || 15
      };
      
      console.log('📤 Enviando datos de producto:', productData);
      console.log('📋 Tipos de datos:');
      console.log('  - price:', typeof productData.price, productData.price);
      console.log('  - preparationTime:', typeof productData.preparationTime, productData.preparationTime);
      
      // Debug authentication before sending
      const token = localStorage.getItem('token');
      console.log('🔐 Auth status before request:');
      console.log('  - Token exists:', !!token);
      console.log('  - Token preview:', token ? token.substring(0, 50) + '...' : 'No token');
      console.log('  - isAuthenticated():', authService.isAuthenticated());
      
      if (editingItem) {
        await catalogService.updateProduct(editingItem.id, productData);
      } else {
        await catalogService.createProduct(productData);
      }
      setShowProductForm(false);
      resetForms();
      loadData();
      setError(''); // Limpiar errores
    } catch (error: any) {
      console.error('❌ Error creando producto:', error);
      
      // Handle specific error cases
      let errorMessage = 'Error al guardar producto';
      
      if (error.response?.data?.error?.message) {
        const backendError = error.response.data.error.message;
        
        if (backendError.includes('duplicate key value violates unique constraint')) {
          if (backendError.includes('product_name_cat_ci_uk')) {
            errorMessage = 'Ya existe un producto con ese nombre en esta categoría. Por favor, elige un nombre diferente.';
          } else if (backendError.includes('product_code_lower_uk')) {
            errorMessage = 'Ya existe un producto con ese código. Por favor, elige un código diferente.';
          } else {
            errorMessage = 'Ya existe un producto con esos datos. Por favor, verifica la información.';
          }
        } else {
          errorMessage = `Error del servidor: ${backendError}`;
        }
      } else if (error.message) {
        errorMessage = `Error: ${error.message}`;
      }
      
      setError(errorMessage);
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
    } catch (error: any) {
      setError('Error al guardar categoría: ' + error.message);
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
    } catch (error: any) {
      setError('Error al guardar espacio: ' + error.message);
    }
  };

  const handleEdit = (item: any, type: 'product' | 'category' | 'space') => {
    setEditingItem(item);
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
        capacity: item.capacity || 4,
        status: item.status || 'LIBRE',
        isActive: item.isActive,
        notes: item.notes || ''
      });
      setShowSpaceForm(true);
    }
  };

  const handleDelete = async (id: string, type: 'product' | 'category' | 'space') => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este elemento?')) return;
    
    try {
      if (type === 'product') {
        await catalogService.deleteProduct(id);
      } else if (type === 'category') {
        await catalogService.deleteCategory(id);
      } else if (type === 'space') {
        await catalogService.deleteSpace(id);
      }
      loadData();
    } catch (error: any) {
      setError('Error al eliminar: ' + error.message);
    }
  };

  if (loading) {
    return <div className="loading">Cargando...</div>;
  }

  // Si no está autenticado, mostrar mensaje de login
  if (!isAuthenticated) {
    return (
      <div className="catalog-management">
        <div className="catalog-header">
          <h1>📚 Gestión de Catálogo</h1>
          <p>Administra productos, categorías y espacios</p>
        </div>
        <div className="auth-required">
          <div className="auth-message">
            <h2>🔐 Autenticación Requerida</h2>
            <p>Debes iniciar sesión para acceder a la gestión de catálogo.</p>
            <button 
              className="login-button"
              onClick={() => window.location.href = '/login'}
            >
              🚀 Ir al Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="catalog-management">
      <div className="catalog-header">
        <h1>📚 Gestión de Catálogo</h1>
        <p>Administra productos, categorías y espacios</p>
        <div className="user-info">
          <span>👤 {authService.getCurrentUser()?.firstName} {authService.getCurrentUser()?.lastName}</span>
          <button 
            className="logout-button"
            onClick={() => {
              authService.logout();
              window.location.reload();
            }}
          >
            🚪 Cerrar Sesión
          </button>
          <button 
            className="debug-button"
            onClick={() => {
              const token = localStorage.getItem('token');
              const user = authService.getCurrentUser();
              console.log('🔍 Manual Auth Debug:');
              console.log('  - Token:', token ? token.substring(0, 50) + '...' : 'No token');
              console.log('  - User:', user);
              console.log('  - isAuthenticated:', authService.isAuthenticated());
              alert(`Auth Status:\nToken: ${token ? 'Present' : 'Missing'}\nUser: ${user ? user.firstName : 'None'}\nAuthenticated: ${authService.isAuthenticated()}`);
            }}
          >
            🔍 Debug Auth
          </button>
        </div>
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
      </div>

      {/* Tab de Productos */}
      {activeTab === 'products' && (
        <div className="tab-content products-tab">
          <div className="section-header">
            <h2>🍽️ Productos ({products.length})</h2>
            <button 
              className="add-button"
              onClick={() => {
                resetForms();
                setShowProductForm(true);
              }}
            >
              ➕ Nuevo Producto
            </button>
          </div>

          <div className="products-container">
            <div className="products-grid-enhanced">
              {products.map(product => {
                const category = categories.find(cat => cat.id === product.categoryId);
                return (
                  <div key={product.id} className="product-card-enhanced">
                    <div className="product-image">
                      {product.image ? (
                        <img src={product.image} alt={product.name} />
                      ) : (
                        <div className="product-image-placeholder">
                          <span className="product-icon">🍽️</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="product-content">
                      <div className="product-header">
                        <h3 className="product-name">{product.name}</h3>
                        <span className="product-code">{product.code}</span>
                      </div>
                      
                      <div className="product-category">
                        <span className="category-badge">
                          📂 {category?.name || 'Sin categoría'}
                        </span>
                        <span className={`product-type ${product.type?.toLowerCase()}`}>
                          {product.type}
                        </span>
                      </div>
                      
                      <p className="product-description">
                        {product.description || 'Sin descripción disponible'}
                      </p>
                      
                      <div className="product-details">
                        <span className="product-price">S/ {product.price}</span>
                        <span className="product-time">⏱️ {product.preparationTime || 15} min</span>
                      </div>
                      
                      <div className="product-status">
                        <span className={`status ${product.isAvailable ? 'available' : 'unavailable'}`}>
                          {product.isAvailable ? '✅ Disponible' : '❌ No disponible'}
                        </span>
                        <span className={`status ${product.isEnabled ? 'enabled' : 'disabled'}`}>
                          {product.isEnabled ? '🟢 Habilitado' : '🔴 Deshabilitado'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="product-actions">
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
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Tab de Categorías */}
      {activeTab === 'categories' && (
        <div className="tab-content categories-tab">
          <div className="section-header">
            <h2>📂 Categorías ({categories.length})</h2>
            <button 
              className="add-button"
              onClick={() => {
                resetForms();
                setShowCategoryForm(true);
              }}
            >
              ➕ Nueva Categoría
            </button>
          </div>

          <div className="items-grid">
            {categories.map(category => (
              <div key={category.id} className="item-card">
                <div className="item-header">
                  <h3>{category.name}</h3>
                  <span className="item-ord">Orden: {category.ord}</span>
                </div>
                <p className="item-description">{category.description || 'Sin descripción'}</p>
                <div className="item-status">
                  <span className={`status ${category.isActive ? 'active' : 'inactive'}`}>
                    {category.isActive ? '✅ Activa' : '❌ Inactiva'}
                  </span>
                </div>
                <div className="item-actions">
                  <button onClick={() => handleEdit(category, 'category')}>✏️ Editar</button>
                  <button onClick={() => handleDelete(category.id, 'category')} className="delete">🗑️ Eliminar</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab de Espacios */}
      {activeTab === 'spaces' && (
        <div className="tab-content spaces-tab">
          <div className="section-header">
            <h2>🏠 Espacios ({spaces.length})</h2>
            <button 
              className="add-button"
              onClick={() => {
                resetForms();
                setShowSpaceForm(true);
              }}
            >
              ➕ Nuevo Espacio
            </button>
          </div>

          <div className="items-grid">
            {spaces.map(space => (
              <div key={space.id} className="item-card">
                <div className="item-header">
                  <h3>{space.name}</h3>
                  <span className="item-code">{space.code}</span>
                </div>
                <div className="item-details">
                  <span className="space-type">{space.type}</span>
                  <span className="space-capacity">Capacidad: {space.capacity}</span>
                  <span className={`space-status ${space.status?.toLowerCase()}`}>
                    {space.status}
                  </span>
                </div>
                <p className="item-notes">{space.notes || 'Sin notas'}</p>
                <div className="item-status">
                  <span className={`status ${space.isActive ? 'active' : 'inactive'}`}>
                    {space.isActive ? '✅ Activo' : '❌ Inactivo'}
                  </span>
                </div>
                <div className="item-actions">
                  <button onClick={() => handleEdit(space, 'space')}>✏️ Editar</button>
                  <button onClick={() => handleDelete(space.id, 'space')} className="delete">🗑️ Eliminar</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal de Producto */}
      {showProductForm && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>{editingItem ? 'Editar' : 'Nuevo'} Producto</h2>
            <form onSubmit={handleCreateProduct}>
              <div className="form-group">
                <label>Código *</label>
                <input
                  type="text"
                  value={productForm.code}
                  onChange={(e) => setProductForm({...productForm, code: e.target.value})}
                  required
                  placeholder="Ej: PROD-001"
                />
                <small className="form-help">El código debe ser único en todo el sistema</small>
              </div>
              <div className="form-group">
                <label>Nombre *</label>
                <input
                  type="text"
                  value={productForm.name}
                  onChange={(e) => setProductForm({...productForm, name: e.target.value})}
                  required
                  placeholder="Ej: Hamburguesa Clásica"
                />
                <small className="form-help">El nombre debe ser único dentro de la categoría seleccionada</small>
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
                  value={productForm.price || ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    const numValue = value === '' ? 0 : parseFloat(value);
                    setProductForm({...productForm, price: isNaN(numValue) ? 0 : numValue});
                  }}
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
                  rows={3}
                />
              </div>
              <div className="form-group">
                <label>Tiempo de preparación (minutos)</label>
                <input
                  type="number"
                  min="1"
                  value={productForm.preparationTime || ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    const numValue = value === '' ? 15 : parseInt(value);
                    setProductForm({...productForm, preparationTime: isNaN(numValue) ? 15 : numValue});
                  }}
                />
              </div>
              <div className="form-group">
                <label>Estado</label>
                <div className="checkbox-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={productForm.isEnabled}
                      onChange={(e) => setProductForm({...productForm, isEnabled: e.target.checked})}
                    />
                    Habilitado
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      checked={productForm.isAvailable}
                      onChange={(e) => setProductForm({...productForm, isAvailable: e.target.checked})}
                    />
                    Disponible
                  </label>
                </div>
              </div>
              <div className="form-actions">
                <button type="submit" className="save-button">
                  {editingItem ? 'Actualizar' : 'Crear'}
                </button>
                <button 
                  type="button" 
                  onClick={() => {
                    setShowProductForm(false);
                    resetForms();
                  }}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Categoría */}
      {showCategoryForm && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>{editingItem ? 'Editar' : 'Nueva'} Categoría</h2>
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
                  rows={3}
                />
              </div>
              <div className="form-group">
                <label>Estado</label>
                <label>
                  <input
                    type="checkbox"
                    checked={categoryForm.isActive}
                    onChange={(e) => setCategoryForm({...categoryForm, isActive: e.target.checked})}
                  />
                  Activa
                </label>
              </div>
              <div className="form-actions">
                <button type="submit" className="save-button">
                  {editingItem ? 'Actualizar' : 'Crear'}
                </button>
                <button 
                  type="button" 
                  onClick={() => {
                    setShowCategoryForm(false);
                    resetForms();
                  }}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Espacio */}
      {showSpaceForm && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>{editingItem ? 'Editar' : 'Nuevo'} Espacio</h2>
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
                  min="1"
                  value={spaceForm.capacity}
                  onChange={(e) => setSpaceForm({...spaceForm, capacity: parseInt(e.target.value)})}
                />
              </div>
              <div className="form-group">
                <label>Estado</label>
                <select
                  value={spaceForm.status}
                  onChange={(e) => setSpaceForm({...spaceForm, status: e.target.value as any})}
                >
                  <option value="LIBRE">Libre</option>
                  <option value="OCUPADA">Ocupada</option>
                  <option value="RESERVADA">Reservada</option>
                  <option value="MANTENIMIENTO">Mantenimiento</option>
                </select>
              </div>
              <div className="form-group">
                <label>Notas</label>
                <textarea
                  value={spaceForm.notes}
                  onChange={(e) => setSpaceForm({...spaceForm, notes: e.target.value})}
                  rows={3}
                />
              </div>
              <div className="form-group">
                <label>Estado</label>
                <label>
                  <input
                    type="checkbox"
                    checked={spaceForm.isActive}
                    onChange={(e) => setSpaceForm({...spaceForm, isActive: e.target.checked})}
                  />
                  Activo
                </label>
              </div>
              <div className="form-actions">
                <button type="submit" className="save-button">
                  {editingItem ? 'Actualizar' : 'Crear'}
                </button>
                <button 
                  type="button" 
                  onClick={() => {
                    setShowSpaceForm(false);
                    resetForms();
                  }}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CatalogManagement;


