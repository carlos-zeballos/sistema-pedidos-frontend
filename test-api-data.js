// Test para verificar los datos reales de la API
const axios = require('axios');

async function testApiData() {
  console.log('🧪 Iniciando test de datos de API...');
  
  const API_BASE_URL = 'http://localhost:3001';
  
  try {
    // Test 1: Obtener productos
    console.log('\n📦 Test 1: Obteniendo productos...');
    const productsResponse = await axios.get(`${API_BASE_URL}/catalog/public/products`);
    const products = productsResponse.data;
    
    console.log(`✅ Productos obtenidos: ${products.length}`);
    
    // Mostrar algunos productos con sus precios
    const foodProducts = products.filter(p => p.type === 'COMIDA').slice(0, 3);
    console.log('\n🍽️ Productos de comida (primeros 3):');
    foodProducts.forEach(product => {
      console.log(`   - ${product.name}: $${product.price}`);
    });
    
    // Test 2: Obtener combos
    console.log('\n🍱 Test 2: Obteniendo combos...');
    const combosResponse = await axios.get(`${API_BASE_URL}/catalog/public/combos`);
    const combos = combosResponse.data;
    
    console.log(`✅ Combos obtenidos: ${combos.length}`);
    
    // Mostrar algunos combos con sus precios
    console.log('\n🍱 Combos (primeros 3):');
    combos.slice(0, 3).forEach(combo => {
      console.log(`   - ${combo.name}: $${combo.basePrice}`);
      console.log(`     - Tiene ComboComponent: ${!!combo.ComboComponent}`);
      console.log(`     - Componentes: ${combo.ComboComponent?.length || 0}`);
    });
    
    // Test 3: Simular getSafePrice con datos reales
    console.log('\n🔍 Test 3: Simulando getSafePrice con datos reales...');
    
    const getSafePrice = (item) => {
      if ('ComboComponent' in item) {
        return item.basePrice || 0;
      }
      return item.price || 0;
    };
    
    // Probar con un producto real
    if (foodProducts.length > 0) {
      const realProduct = foodProducts[0];
      const productPrice = getSafePrice(realProduct);
      console.log(`   Producto real "${realProduct.name}": $${productPrice}`);
    }
    
    // Probar con un combo real
    if (combos.length > 0) {
      const realCombo = combos[0];
      const comboPrice = getSafePrice(realCombo);
      console.log(`   Combo real "${realCombo.name}": $${comboPrice}`);
    }
    
    console.log('\n✅ Test de API completado');
    
  } catch (error) {
    console.error('❌ Error en test de API:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', error.response.data);
    }
  }
}

testApiData();



