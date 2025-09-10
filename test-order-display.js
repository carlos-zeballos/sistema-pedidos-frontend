// Test para simular exactamente cómo se muestran los datos en las tarjetas de órdenes
console.log('🧪 Test de visualización de órdenes...');

// Simular datos de orden como los que vienen de la API
const mockOrder = {
  id: 'order-1',
  orderNumber: 'ORD250909000097',
  status: 'EN_PREPARACION',
  totalAmount: 55.80,
  customerName: 'Cliente 3',
  space: { name: 'Mesa 3' },
  items: [
    {
      id: 'item-1',
      name: 'Acevichado',
      quantity: 1,
      unitPrice: 25.90,  // Este debería ser el precio real
      totalPrice: 25.90, // Este debería ser el precio real
      notes: null
    },
    {
      id: 'item-2', 
      name: 'Bento 3',
      quantity: 1,
      unitPrice: 59.90,  // Este debería ser el precio real
      totalPrice: 59.90, // Este debería ser el precio real
      notes: '{"selectedComponents":{"SABOR":[{"name":"Parrillero","quantity":1},{"name":"Shiro","quantity":1}]}}'
    }
  ]
};

console.log('\n📋 Datos de la orden:');
console.log(`   Orden: ${mockOrder.orderNumber}`);
console.log(`   Estado: ${mockOrder.status}`);
console.log(`   Total Actualizado: $${mockOrder.totalAmount}`);

console.log('\n📦 Items de la orden:');
mockOrder.items.forEach((item, index) => {
  console.log(`   ${index + 1}. ${item.name}`);
  console.log(`      - Cantidad: x${item.quantity}`);
  console.log(`      - Precio unitario: $${item.unitPrice}`);
  console.log(`      - Precio total: $${item.totalPrice}`);
  
  // Simular el parsing de notas del combo
  if (item.notes && item.notes.includes('selectedComponents')) {
    try {
      const notesData = JSON.parse(item.notes);
      if (notesData.selectedComponents) {
        console.log(`      - Componentes:`);
        Object.entries(notesData.selectedComponents).forEach(([type, components]) => {
          const compNames = components.map(comp => comp.name || comp).join(', ');
          console.log(`        ${type}: ${compNames}`);
        });
      }
    } catch (error) {
      console.log(`      - Error parsing notes: ${error.message}`);
    }
  }
});

// Calcular Total Original
const totalOriginal = mockOrder.items.reduce((total, item) => {
  return total + (item.unitPrice * item.quantity);
}, 0);

console.log('\n💰 Cálculos:');
console.log(`   Total Original: $${totalOriginal.toFixed(2)}`);
console.log(`   Total Actualizado: $${mockOrder.totalAmount}`);

// Verificar si hay diferencia
const difference = Math.abs(totalOriginal - mockOrder.totalAmount);
if (difference > 0.01) {
  console.log(`   ⚠️ DIFERENCIA DETECTADA: $${difference.toFixed(2)}`);
  console.log(`   Esto indica que el precio fue modificado en el modal de pago`);
} else {
  console.log(`   ✅ Los precios coinciden`);
}

console.log('\n🔍 Análisis del problema:');
console.log('   Si en la interfaz ves S/ 0.00, significa que:');
console.log('   1. Los datos de unitPrice están llegando como 0 desde la API');
console.log('   2. O hay un problema en la visualización');
console.log('   3. O los datos se están perdiendo en algún punto del flujo');

console.log('\n✅ Test completado');

