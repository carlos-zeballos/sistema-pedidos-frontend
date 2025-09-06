import React, { useState, useEffect } from 'react';
import { catalogService } from '../services/api';
import { Category, Product, Combo } from '../types';
import './Catalog.css';

const Catalog: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [combos, setCombos] = useState<Combo[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    loadData();
    
    // Actualizar datos cada 30 segundos
    const interval = setInterval(() => {
      console.log('🔄 Catalog - Actualización automática de datos...');
      loadData();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      console.log('🔄 Catalog.loadData - Iniciando carga de datos...');
      setLoading(true);
      setError('');
      
      console.log('📡 Catalog.loadData - Llamando a catalogService.getCategories()...');
      const categoriesData = await catalogService.getCategories();
      console.log('✅ Catalog.loadData - Categorías cargadas:', categoriesData?.length || 0);
      
      console.log('📡 Catalog.loadData - Llamando a catalogService.getProducts()...');
      const productsData = await catalogService.getProducts();
      console.log('✅ Catalog.loadData - Productos cargados:', productsData?.length || 0);
      
      console.log('📡 Catalog.loadData - Llamando a catalogService.getCombos()...');
      const combosData = await catalogService.getCombos();
      console.log('✅ Catalog.loadData - Combos cargados:', combosData?.length || 0);
      
      if (combosData && combosData.length > 0) {
        console.log('🍱 Catalog.loadData - Combos obtenidos:');
        combosData.forEach((combo: Combo, index: number) => {
          console.log(`   ${index + 1}. ${combo.name} (${combo.code}) - $${combo.basePrice}`);
        });
      }
      
      setCategories(categoriesData || []);
      setProducts(productsData || []);
      setCombos(combosData || []);
      setLastUpdated(new Date());
      
      console.log('🎉 Catalog.loadData - Datos cargados exitosamente');
      console.log(`📊 Catalog.loadData - ${categoriesData?.length || 0} categorías, ${productsData?.length || 0} productos, ${combosData?.length || 0} combos`);
    } catch (error: any) {
      console.error('❌ Catalog.loadData - Error:', error);
      console.error('❌ Catalog.loadData - Error message:', error.message);
      console.error('❌ Catalog.loadData - Error response:', error.response?.data);
      setError('Error al cargar los datos: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Función para combinar productos y combos
  const getAllItems = () => {
    const allItems: Array<Product | Combo> = [];
    
    // Agregar productos
    products.forEach(product => {
      allItems.push(product);
    });
    
    // Agregar combos
    combos.forEach(combo => {
      allItems.push(combo);
    });
    
    return allItems;
  };

  // Filtrar items (productos y combos)
  const filteredItems = getAllItems().filter(item => {
    const matchesCategory = selectedCategory ? item.categoryId === selectedCategory : true;
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleCategoryFilter = (categoryId: string | null) => {
    setSelectedCategory(categoryId);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  if (loading) {
    return (
      <div className="catalog-container">
        <div className="loading">Cargando catálogo...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="catalog-container">
        <div className="error">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="catalog-container">
      <div className="catalog-header">
        <div className="header-content">
          <div className="header-text">
            <h1>📚 Catálogo de Productos</h1>
            <p>Gestiona el menú del restaurante</p>
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
        
        <div className="catalog-stats">
          <div className="stat-item">
            <span className="stat-number">{categories.length}</span>
            <span className="stat-label">Categorías</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{products.length + combos.length}</span>
            <span className="stat-label">Total Items</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{products.length}</span>
            <span className="stat-label">Productos</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{combos.length}</span>
            <span className="stat-label">Combos</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{filteredItems.length}</span>
            <span className="stat-label">Mostrados</span>
          </div>
        </div>
      </div>

      <div className="catalog-filters">
        <div className="search-box">
          <input
            type="text"
            placeholder="Buscar productos..."
            value={searchTerm}
            onChange={handleSearch}
            className="search-input"
          />
        </div>

        <div className="category-filters">
          <button
            className={`category-filter-btn ${!selectedCategory ? 'active' : ''}`}
            onClick={() => handleCategoryFilter(null)}
          >
            Todas las categorías
          </button>
          {categories.map(category => (
            <button
              key={category.id}
              className={`category-filter-btn ${selectedCategory === category.id ? 'active' : ''}`}
              onClick={() => handleCategoryFilter(category.id)}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>

      <div className="products-grid">
        {filteredItems.map(item => {
          // Determinar si es un combo o un producto
          const isCombo = 'basePrice' in item;
          const price = isCombo ? item.basePrice : item.price;
          const preparationTime = isCombo ? item.preparationTime : item.preparationTime;
          const type = isCombo ? 'COMBO' : item.type;
          
          return (
            <div key={item.id} className="product-card">
              <div className="product-image">
                <span className="product-emoji">{isCombo ? '🍱' : '🍣'}</span>
                {!item.isAvailable && (
                  <div className="unavailable-badge">No disponible</div>
                )}
              </div>

              <div className="product-info">
                <h3 className="product-name">{item.name}</h3>
                {item.description && (
                  <p className="product-description">{item.description}</p>
                )}
                
                <div className="product-details">
                  <div className="product-price">
                    <span className="price-amount">${(price || 0).toFixed(2)}</span>
                  </div>

                  <div className="product-status">
                    <span className={`status-indicator ${item.isAvailable ? 'available' : 'unavailable'}`}>
                      {item.isAvailable ? 'Disponible' : 'No disponible'}
                    </span>
                  </div>
                </div>

                <div className="product-meta">
                  <span className="product-type">{type}</span>
                  {preparationTime && (
                    <span className="prep-time">⏱️ {preparationTime} min</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredItems.length === 0 && (
        <div className="no-products">
          <p>No se encontraron productos o combos que coincidan con tu búsqueda.</p>
        </div>
      )}
    </div>
  );
};

export default Catalog;


/* Frontend actualizado: 2025-08-31T10:20:35.338Z */
