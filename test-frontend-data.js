// Test para simular exactamente los datos que se envían desde el frontend
console.log('🧪 Test de datos del frontend...');

// Simular datos como los que se crean en OrderCreation.tsx
const mockCartItem1 = {
  product: {
    id: 'product-acevichado',
    name: 'Acevichado',
    price: 25.90,
    type: 'COMIDA',
    categoryId: 'cat-1'
  },
  quantity: 1,
  notes: ''
};

const mockCartItem2 = {
  product: {
    id: 'combo-bento3',
    name: 'Bento 3',
    basePrice: 59.90,
    categoryId: 'cat-1',
    ComboComponent: [
      { id: 'comp-1', name: 'Parrillero', type: 'SABOR', price: 0 },
      { id: 'comp-2', name: 'Shiro', type: 'SABOR', price: 0 }
    ]
  },
  quantity: 1,
  notes: '{"selectedComponents":{"SABOR":[{"name":"Parrillero","quantity":1},{"name":"Shiro","quantity":1}]}}'
};

const cart = [mockCartItem1, mockCartItem2];

// Función getSafePrice como está en el código
const getSafePrice = (item) => {
  if ('ComboComponent' in item) {
    return item.basePrice || 0;
  }
  return item.price || 0;
};

console.log('\n🛒 Procesando carrito...');

// Simular el mapeo que se hace en OrderCreation.tsx
const orderItems = cart.map(item => {
  const isCombo = item.product.id.startsWith('combo-') || 'ComboComponent' in item.product;
  const price = getSafePrice(item.product);
  
  console.log(`\n🔍 Procesando: ${item.product.name}`);
  console.log(`   - ID: ${item.product.id}`);
  console.log(`   - Es combo: ${isCombo}`);
  console.log(`   - Precio calculado: $${price}`);
  console.log(`   - Cantidad: ${item.quantity}`);
  
  const orderItem = {
    productId: isCombo ? null : item.product.id.replace('combo-', ''),
    comboId: isCombo ? item.product.id.replace('combo-', '') : null,
    name: item.product.name,
    unitPrice: price,
    totalPrice: price * item.quantity,
    quantity: item.quantity,
    notes: item.notes
  };
  
  console.log(`   - productId: ${orderItem.productId}`);
  console.log(`   - comboId: ${orderItem.comboId}`);
  console.log(`   - unitPrice: $${orderItem.unitPrice}`);
  console.log(`   - totalPrice: $${orderItem.totalPrice}`);
  
  return orderItem;
});

console.log('\n📋 Items finales para enviar al backend:');
orderItems.forEach((item, index) => {
  console.log(`   ${index + 1}. ${item.name}`);
  console.log(`      - productId: ${item.productId}`);
  console.log(`      - comboId: ${item.comboId}`);
  console.log(`      - unitPrice: $${item.unitPrice}`);
  console.log(`      - totalPrice: $${item.totalPrice}`);
  console.log(`      - quantity: ${item.quantity}`);
});

const totalAmount = orderItems.reduce((total, item) => total + item.totalPrice, 0);
console.log(`\n💰 Total calculado: $${totalAmount.toFixed(2)}`);

// Simular el payload completo que se envía al backend
const orderData = {
  spaceId: 'space-1',
  createdBy: 'user-1',
  customerName: 'Cliente 3',
  customerPhone: '',
  notes: '',
  totalAmount: totalAmount,
  subtotal: totalAmount,
  tax: 0,
  discount: 0,
  deliveryCost: 0,
  isDelivery: false,
  items: orderItems
};

console.log('\n📤 Payload completo para el backend:');
console.log(JSON.stringify(orderData, null, 2));

console.log('\n✅ Test del frontend completado');



