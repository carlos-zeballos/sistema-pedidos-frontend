// Script para probar la carga de datos de un combo específico
const axios = require('axios');

const API_BASE_URL = 'https://sistema-pedidos-restaurante.onrender.com';

async function testComboEdit() {
  try {
    console.log('🔍 Probando carga de datos de combo para edición...');
    
    // 1. Obtener lista de combos
    console.log('\n📋 Obteniendo lista de combos...');
    const combosResponse = await axios.get(`${API_BASE_URL}/catalog/public/combos`);
    const combos = combosResponse.data;
    
    if (combos.length === 0) {
      console.log('❌ No hay combos disponibles');
      return;
    }
    
    console.log(`✅ Se encontraron ${combos.length} combos`);
    
    // 2. Tomar el primer combo para probar
    const testCombo = combos[0];
    console.log(`\n🧪 Probando con combo: ${testCombo.name} (ID: ${testCombo.id})`);
    
    // 3. Obtener datos completos del combo (usando endpoint público)
    console.log('\n📊 Obteniendo datos completos del combo...');
    const comboDetail = combos.find(c => c.id === testCombo.id);
    
    console.log('✅ Datos del combo obtenidos:');
    console.log('   📝 Nombre:', comboDetail.name);
    console.log('   💰 Precio:', comboDetail.basePrice);
    console.log('   📋 Descripción:', comboDetail.description || 'Sin descripción');
    console.log('   🏷️ Categoría ID:', comboDetail.categoryId);
    console.log('   ⏱️ Tiempo preparación:', comboDetail.preparationTime);
    console.log('   🔢 Máx. selecciones:', comboDetail.maxSelections);
    console.log('   ✅ Habilitado:', comboDetail.isEnabled);
    console.log('   🟢 Disponible:', comboDetail.isAvailable);
    
    // 4. Verificar componentes
    if (comboDetail.components && comboDetail.components.length > 0) {
      console.log(`\n🧩 Componentes (${comboDetail.components.length}):`);
      comboDetail.components.forEach((comp, index) => {
        console.log(`   ${index + 1}. ${comp.name} (${comp.type}) - $${comp.price}`);
        console.log(`      Requerido: ${comp.isRequired ? 'Sí' : 'No'}`);
        console.log(`      Disponible: ${comp.isAvailable ? 'Sí' : 'No'}`);
      });
    } else {
      console.log('\n🧩 No hay componentes configurados');
    }
    
    // 5. Verificar si hay ComboComponent (formato alternativo)
    if (comboDetail.ComboComponent && comboDetail.ComboComponent.length > 0) {
      console.log(`\n🔧 ComboComponent (${comboDetail.ComboComponent.length}):`);
      comboDetail.ComboComponent.forEach((comp, index) => {
        console.log(`   ${index + 1}. ${comp.name} (${comp.type}) - $${comp.price}`);
      });
    }
    
    console.log('\n✅ Prueba completada exitosamente');
    
  } catch (error) {
    console.error('❌ Error en la prueba:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', error.response.data);
    }
  }
}

// Ejecutar la prueba
testComboEdit();
