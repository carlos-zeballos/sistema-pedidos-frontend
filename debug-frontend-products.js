// Script para debuggear el problema de productos individuales en el frontend
// Este script simula lo que hace el frontend para agregar productos al carrito

console.log('🔍 DEBUG: Simulando lógica del frontend');
console.log('='.repeat(60));

// Simular datos de productos (como los que vienen del backend)
const mockProducts = [
  {
    id: "72db50b0-0b66-44fe-8c22-87f339eef634",
    name: "Acevichado",
    price: 25.9,
    categoryId: "12a6b9fb-6b31-407d-a2c5-9b461697215b",
    isAvailable: true,
    // NO tiene ComboComponent - es un producto individual
  },
  {
    id: "e0d724f6-47b6-4747-9e1e-f64ab1568b62",
    name: "ALALAU MAKI",
    price: 14.9,
    categoryId: "2c3011b4-ebce-448e-ac4a-06424a621c79",
    isAvailable: true,
    // NO tiene ComboComponent - es un producto individual
  }
];

// Simular datos de combos (como los que vienen del backend)
const mockCombos = [
  {
    id: "f3592ae6-5dfc-4881-bab8-9aa2b7b8cefa",
    name: "Bento 1",
    basePrice: 29.9,
    categoryId: "6d24ee06-f4a6-4dd3-a5d4-f95e5e4a7bff",
    isAvailable: true,
    ComboComponent: [
      { id: "1", name: "Causa Acevichada", type: "SABOR" },
      { id: "2", name: "California", type: "SABOR" }
    ]
  }
];

// Simular la lógica del frontend
console.log('\n1️⃣ Simulando detección de tipo de producto:');

mockProducts.forEach((product, index) => {
  const isCombo = 'ComboComponent' in product;
  console.log(`📦 Producto ${index + 1}: ${product.name}`);
  console.log(`   - ID: ${product.id}`);
  console.log(`   - Precio: $${product.price}`);
  console.log(`   - Es combo: ${isCombo}`);
  console.log(`   - Tiene ComboComponent: ${!!product.ComboComponent}`);
  console.log(`   - Disponible: ${product.isAvailable}`);
  console.log('');
});

mockCombos.forEach((combo, index) => {
  const isCombo = 'ComboComponent' in combo;
  console.log(`🍱 Combo ${index + 1}: ${combo.name}`);
  console.log(`   - ID: ${combo.id}`);
  console.log(`   - Precio: $${combo.basePrice}`);
  console.log(`   - Es combo: ${isCombo}`);
  console.log(`   - Tiene ComboComponent: ${!!combo.ComboComponent}`);
  console.log(`   - Disponible: ${combo.isAvailable}`);
  console.log('');
});

// Simular la función addToCart
console.log('\n2️⃣ Simulando función addToCart:');

function simulateAddToCart(item) {
  console.log(`🛒 Intentando agregar: ${item.name}`);
  
  // Determinar si es un producto o combo
  const isCombo = 'ComboComponent' in item;
  console.log(`   - Detectado como combo: ${isCombo}`);
  
  if (isCombo) {
    console.log('   ✅ Es un combo - debería abrir modal de personalización');
    return 'ABRIR_MODAL_COMBO';
  } else {
    console.log('   ✅ Es un producto individual - debería agregar directamente al carrito');
    return 'AGREGAR_AL_CARRITO';
  }
}

// Probar con productos individuales
console.log('\n📦 Probando con productos individuales:');
mockProducts.forEach(product => {
  const result = simulateAddToCart(product);
  console.log(`   Resultado: ${result}`);
});

// Probar con combos
console.log('\n🍱 Probando con combos:');
mockCombos.forEach(combo => {
  const result = simulateAddToCart(combo);
  console.log(`   Resultado: ${result}`);
});

console.log('\n✅ Simulación completada');
console.log('\n🔍 CONCLUSIÓN:');
console.log('Si los productos individuales no se pueden agregar al carrito,');
console.log('el problema NO está en la lógica de detección de tipo.');
console.log('El problema podría estar en:');
console.log('1. Los datos no se están cargando correctamente');
console.log('2. Los botones no están funcionando');
console.log('3. Hay un error en el renderizado');
console.log('4. Los productos están siendo filtrados incorrectamente');








