require('dotenv').config();
const axios = require('axios');

const API_BASE_URL = 'https://sistema-pedidos-restaurante.onrender.com';

async function debugProductsIssue() {
  try {
    console.log('🔍 DIAGNÓSTICO: Problema con productos individuales');
    console.log('='.repeat(60));
    
    // 1. Verificar endpoint de productos
    console.log('\n1️⃣ Verificando endpoint de productos...');
    const productsResponse = await axios.get(`${API_BASE_URL}/catalog/public/products`);
    const products = productsResponse.data;
    
    console.log(`📦 Productos encontrados: ${products.length}`);
    if (products.length > 0) {
      console.log('📦 Primeros 5 productos:');
      products.slice(0, 5).forEach((product, index) => {
        console.log(`  ${index + 1}. ${product.name} - $${product.price} - Categoría: ${product.categoryId}`);
      });
    }
    
    // 2. Verificar endpoint de combos
    console.log('\n2️⃣ Verificando endpoint de combos...');
    const combosResponse = await axios.get(`${API_BASE_URL}/catalog/public/combos`);
    const combos = combosResponse.data;
    
    console.log(`🍱 Combos encontrados: ${combos.length}`);
    if (combos.length > 0) {
      console.log('🍱 Primeros 3 combos:');
      combos.slice(0, 3).forEach((combo, index) => {
        console.log(`  ${index + 1}. ${combo.name} - $${combo.basePrice} - Categoría: ${combo.categoryId}`);
      });
    }
    
    // 3. Verificar categorías
    console.log('\n3️⃣ Verificando categorías...');
    const categoriesResponse = await axios.get(`${API_BASE_URL}/catalog/public/categories`);
    const categories = categoriesResponse.data;
    
    console.log(`📂 Categorías encontradas: ${categories.length}`);
    categories.forEach((category, index) => {
      console.log(`  ${index + 1}. ${category.name} (${category.id})`);
    });
    
    // 4. Verificar productos por categoría
    console.log('\n4️⃣ Verificando productos por categoría...');
    for (const category of categories) {
      const categoryProducts = products.filter(p => p.categoryId === category.id);
      console.log(`📂 ${category.name}: ${categoryProducts.length} productos`);
      if (categoryProducts.length > 0) {
        categoryProducts.slice(0, 3).forEach(product => {
          console.log(`    - ${product.name} - $${product.price}`);
        });
      }
    }
    
    // 5. Verificar estructura de datos
    console.log('\n5️⃣ Verificando estructura de datos...');
    if (products.length > 0) {
      const firstProduct = products[0];
      console.log('📦 Estructura del primer producto:');
      console.log(JSON.stringify(firstProduct, null, 2));
    }
    
    if (combos.length > 0) {
      const firstCombo = combos[0];
      console.log('\n🍱 Estructura del primer combo:');
      console.log(JSON.stringify(firstCombo, null, 2));
    }
    
    console.log('\n✅ Diagnóstico completado');
    
  } catch (error) {
    console.error('❌ Error en diagnóstico:', error.message);
    if (error.response) {
      console.error('📊 Status:', error.response.status);
      console.error('📊 Data:', error.response.data);
    }
  }
}

debugProductsIssue();

