// Test para verificar el cálculo de precios
console.log('🧪 Iniciando test de precios...');

// Simular datos de productos y combos como los que vienen de la API
const mockProduct = {
  id: 'product-1',
  name: 'Acevichado',
  price: 25.90,
  type: 'COMIDA',
  categoryId: 'cat-1'
};

const mockCombo = {
  id: 'combo-1',
  name: 'Bento 3',
  basePrice: 59.90,
  categoryId: 'cat-1',
  ComboComponent: [
    { id: 'comp-1', name: 'Parrillero', type: 'SABOR', price: 0 },
    { id: 'comp-2', name: 'Shiro', type: 'SABOR', price: 0 }
  ]
};

// Función getSafePrice como está en el código
const getSafePrice = (item) => {
  console.log('🔍 getSafePrice called with:', {
    itemName: item.name,
    hasComboComponent: 'ComboComponent' in item,
    productPrice: item.price,
    basePrice: item.basePrice,
    itemKeys: Object.keys(item)
  });
  
  if ('ComboComponent' in item) {
    const price = item.basePrice || 0;
    console.log('🍱 Combo price calculated:', price);
    return price;
  }
  const price = item.price || 0;
  console.log('🍽️ Product price calculated:', price);
  return price;
};

// Test 1: Producto individual
console.log('\n📦 Test 1: Producto individual');
const productPrice = getSafePrice(mockProduct);
console.log(`✅ Precio del producto "${mockProduct.name}": $${productPrice}`);

// Test 2: Combo
console.log('\n🍱 Test 2: Combo');
const comboPrice = getSafePrice(mockCombo);
console.log(`✅ Precio del combo "${mockCombo.name}": $${comboPrice}`);

// Test 3: Simular creación de orden
console.log('\n🛒 Test 3: Simulación de creación de orden');
const cart = [
  { product: mockProduct, quantity: 1, notes: '' },
  { product: mockCombo, quantity: 1, notes: '{"selectedComponents":{"SABOR":[{"name":"Parrillero","quantity":1},{"name":"Shiro","quantity":1}]}}' }
];

const orderItems = cart.map(item => {
  const isCombo = item.product.id.startsWith('combo-') || 'ComboComponent' in item.product;
  const price = getSafePrice(item.product);
  
  console.log(`🔍 Procesando item: ${item.product.name}`);
  console.log(`   - Es combo: ${isCombo}`);
  console.log(`   - Precio calculado: $${price}`);
  console.log(`   - Cantidad: ${item.quantity}`);
  console.log(`   - Total: $${price * item.quantity}`);
  
  return {
    productId: isCombo ? null : item.product.id,
    comboId: isCombo ? item.product.id : null,
    name: item.product.name,
    unitPrice: price,
    totalPrice: price * item.quantity,
    quantity: item.quantity,
    notes: item.notes
  };
});

console.log('\n📋 Items de la orden:');
orderItems.forEach((item, index) => {
  console.log(`   ${index + 1}. ${item.name}: $${item.unitPrice} x ${item.quantity} = $${item.totalPrice}`);
});

const totalOriginal = orderItems.reduce((total, item) => total + item.totalPrice, 0);
console.log(`\n💰 Total Original: $${totalOriginal.toFixed(2)}`);

console.log('\n✅ Test completado');



