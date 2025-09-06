// Script para probar la conexión al backend
const https = require('https');

console.log('🔍 Probando conexión al backend...');

const testBackend = () => {
  const options = {
    hostname: 'sistema-pedidos-restaurante.onrender.com',
    port: 443,
    path: '/health',
    method: 'GET',
    timeout: 10000
  };

  const req = https.request(options, (res) => {
    console.log(`✅ Status: ${res.statusCode}`);
    console.log(`✅ Headers:`, res.headers);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log('✅ Response:', data);
      if (res.statusCode === 200) {
        console.log('🎉 ¡Backend funcionando correctamente!');
      } else {
        console.log('⚠️ Backend respondiendo pero con error');
      }
    });
  });

  req.on('error', (error) => {
    console.error('❌ Error de conexión:', error.message);
    console.log('🔧 Posibles soluciones:');
    console.log('   1. Verificar que Render esté activo');
    console.log('   2. Revisar logs en Render dashboard');
    console.log('   3. Hacer redeploy manual');
  });

  req.on('timeout', () => {
    console.error('⏰ Timeout - Backend no responde');
    req.destroy();
  });

  req.end();
};

// Probar también el endpoint de login
const testLogin = () => {
  const loginData = JSON.stringify({
    username: 'admin',
    password: 'admin123'
  });

  const options = {
    hostname: 'sistema-pedidos-restaurante.onrender.com',
    port: 443,
    path: '/auth/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(loginData)
    },
    timeout: 10000
  };

  const req = https.request(options, (res) => {
    console.log(`\n🔐 Login test - Status: ${res.statusCode}`);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log('🔐 Login response:', data);
      if (res.statusCode === 200) {
        console.log('🎉 ¡Login funcionando!');
      } else if (res.statusCode === 401) {
        console.log('⚠️ Login falló - credenciales incorrectas');
      } else {
        console.log('❌ Error en login');
      }
    });
  });

  req.on('error', (error) => {
    console.error('❌ Error en login test:', error.message);
  });

  req.write(loginData);
  req.end();
};

// Ejecutar tests
testBackend();
setTimeout(testLogin, 2000);

