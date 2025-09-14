// Script para probar los datos de combos desde el backend
const https = require('https');

console.log('🔍 Probando datos de combos desde el backend...');

const testCombos = () => {
  const options = {
    hostname: 'sistema-pedidos-restaurante.onrender.com',
    port: 443,
    path: '/catalog/public/combos',
    method: 'GET',
    timeout: 10000
  };

  const req = https.request(options, (res) => {
    console.log(`✅ Status: ${res.statusCode}`);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      try {
        const combos = JSON.parse(data);
        console.log('🍱 Combos recibidos:', combos.length);
        
        combos.forEach((combo, index) => {
          console.log(`\n🍱 Combo ${index + 1}:`);
          console.log(`   ID: ${combo.id}`);
          console.log(`   Nombre: ${combo.name}`);
          console.log(`   Precio: $${combo.basePrice}`);
          console.log(`   Tiene ComboComponent: ${!!combo.ComboComponent}`);
          console.log(`   Cantidad de componentes: ${combo.ComboComponent?.length || 0}`);
          
          if (combo.ComboComponent && combo.ComboComponent.length > 0) {
            console.log('   Componentes:');
            combo.ComboComponent.forEach((comp, compIndex) => {
              console.log(`     ${compIndex + 1}. ${comp.name} (${comp.type}) - $${comp.price}`);
            });
          } else {
            console.log('   ❌ SIN COMPONENTES');
          }
        });
        
        if (combos.length === 0) {
          console.log('❌ No hay combos en la base de datos');
        }
        
      } catch (error) {
        console.error('❌ Error parseando JSON:', error);
        console.log('📄 Respuesta raw:', data);
      }
    });
  });

  req.on('error', (error) => {
    console.error('❌ Error de conexión:', error.message);
  });

  req.on('timeout', () => {
    console.error('⏰ Timeout - Backend no responde');
    req.destroy();
  });

  req.end();
};

// Ejecutar test
testCombos();









