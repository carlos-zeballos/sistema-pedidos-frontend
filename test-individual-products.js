require('dotenv').config();
const axios = require('axios');

const API_BASE_URL = 'https://sistema-pedidos-restaurante.onrender.com';

async function testIndividualProducts() {
  try {
    console.log('🔍 PROBANDO PRODUCTOS INDIVIDUALES');
    console.log('='.repeat(60));
    
    // 1. Obtener productos individuales
    console.log('\n1️⃣ Obteniendo productos individuales...');
    const productsResponse = await axios.get(`${API_BASE_URL}/catalog/public/products`);
    const products = productsResponse.data;
    
    // Filtrar productos que NO son combos (no tienen ComboComponent)
    const individualProducts = products.filter(product => !product.ComboComponent);
    
    console.log(`📦 Productos individuales encontrados: ${individualProducts.length}`);
    
    if (individualProducts.length > 0) {
      console.log('\n📦 Primeros 10 productos individuales:');
      individualProducts.slice(0, 10).forEach((product, index) => {
        console.log(`  ${index + 1}. ${product.name} - $${product.price} - Categoría: ${product.categoryId}`);
        console.log(`     ID: ${product.id}`);
        console.log(`     Disponible: ${product.isAvailable}`);
        console.log(`     Tipo: ${product.type}`);
        console.log('');
      });
    }
    
    // 2. Obtener categorías para verificar nombres
    console.log('\n2️⃣ Obteniendo categorías...');
    const categoriesResponse = await axios.get(`${API_BASE_URL}/catalog/public/categories`);
    const categories = categoriesResponse.data;
    
    console.log('📂 Categorías disponibles:');
    categories.forEach((category, index) => {
      const categoryProducts = individualProducts.filter(p => p.categoryId === category.id);
      console.log(`  ${index + 1}. ${category.name} (${category.id}) - ${categoryProducts.length} productos`);
    });
    
    // 3. Verificar estructura de un producto individual
    if (individualProducts.length > 0) {
      console.log('\n3️⃣ Estructura de un producto individual:');
      const sampleProduct = individualProducts[0];
      console.log(JSON.stringify(sampleProduct, null, 2));
    }
    
    console.log('\n✅ Prueba completada');
    
  } catch (error) {
    console.error('❌ Error en prueba:', error.message);
    if (error.response) {
      console.error('📊 Status:', error.response.status);
      console.error('📊 Data:', error.response.data);
    }
  }
}

testIndividualProducts();






