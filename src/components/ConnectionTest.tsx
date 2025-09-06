import React, { useState, useEffect } from 'react';
import { diagnosticService, authService } from '../services/api';
import './ConnectionTest.css';

interface TestResult {
  name: string;
  status: 'success' | 'error' | 'pending';
  message: string;
  details?: any;
}

const ConnectionTest: React.FC = () => {
  const [tests, setTests] = useState<TestResult[]>([]);
  const [running, setRunning] = useState(false);
  const [overallStatus, setOverallStatus] = useState<'success' | 'error' | 'pending'>('pending');

  const runTests = async () => {
    setRunning(true);
    setOverallStatus('pending');

    const testResults: TestResult[] = [
      { name: 'Backend API', status: 'pending', message: 'Verificando conexión...' },
      { name: 'Base de Datos', status: 'pending', message: 'Verificando base de datos...' },
      { name: 'Sistema de Autenticación', status: 'pending', message: 'Verificando autenticación...' },
      { name: 'Configuración de API', status: 'pending', message: 'Verificando configuración...' }
    ];

    setTests(testResults);

    try {
      // Test 1: Backend API
      const backendHealth = await diagnosticService.checkBackendHealth();
      testResults[0] = {
        name: 'Backend API',
        status: backendHealth.status === 'success' ? 'success' : 'error',
        message: backendHealth.status === 'success' ? 'Backend conectado correctamente' : backendHealth.message,
        details: backendHealth.data
      };

      // Test 2: Database
      const databaseHealth = await diagnosticService.checkDatabaseConnection();
      testResults[1] = {
        name: 'Base de Datos',
        status: databaseHealth.status === 'success' ? 'success' : 'error',
        message: databaseHealth.status === 'success' ? 'Base de datos conectada correctamente' : databaseHealth.message,
        details: databaseHealth.data
      };

      // Test 3: Authentication
      try {
        const isAuth = authService.isAuthenticated();
        const currentUser = authService.getCurrentUser();
        testResults[2] = {
          name: 'Sistema de Autenticación',
          status: 'success',
          message: isAuth ? 'Usuario autenticado correctamente' : 'No hay usuario autenticado',
          details: currentUser
        };
      } catch (error: any) {
        testResults[2] = {
          name: 'Sistema de Autenticación',
          status: 'error',
          message: 'Error en autenticación: ' + error.message
        };
      }

      // Test 4: API Configuration
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001';
      testResults[3] = {
        name: 'Configuración de API',
        status: 'success',
        message: `API configurada en: ${apiUrl}`,
        details: { apiUrl }
      };

    } catch (error: any) {
      console.error('Error running tests:', error);
    }

    setTests([...testResults]);
    
    const hasErrors = testResults.some(test => test.status === 'error');
    setOverallStatus(hasErrors ? 'error' : 'success');
    setRunning(false);
  };

  useEffect(() => {
    runTests();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'pending': return '⏳';
      default: return '❓';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return '#4caf50';
      case 'error': return '#f44336';
      case 'pending': return '#ff9800';
      default: return '#9e9e9e';
    }
  };

  return (
    <div className="connection-test">
      <div className="test-header">
        <h1>🔍 Diagnóstico del Sistema</h1>
        <p>Verificando la conectividad y configuración del sistema</p>
      </div>

      <div className="overall-status">
        <div className={`status-indicator ${overallStatus}`}>
          {getStatusIcon(overallStatus)}
          <span>
            {overallStatus === 'success' && 'Sistema funcionando correctamente'}
            {overallStatus === 'error' && 'Se encontraron problemas'}
            {overallStatus === 'pending' && 'Verificando sistema...'}
          </span>
        </div>
      </div>

      <div className="test-results">
        {tests.map((test, index) => (
          <div key={index} className={`test-item ${test.status}`}>
            <div className="test-header">
              <span className="test-icon">{getStatusIcon(test.status)}</span>
              <h3>{test.name}</h3>
              <span className="test-status" style={{ color: getStatusColor(test.status) }}>
                {test.status.toUpperCase()}
              </span>
            </div>
            <p className="test-message">{test.message}</p>
            {test.details && (
              <div className="test-details">
                <pre>{JSON.stringify(test.details, null, 2)}</pre>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="test-actions">
        <button 
          onClick={runTests} 
          disabled={running}
          className="btn btn-primary"
        >
          {running ? 'Ejecutando...' : '🔄 Ejecutar Pruebas'}
        </button>
      </div>

      <div className="system-info">
        <h3>📋 Información del Sistema</h3>
        <div className="info-grid">
          <div className="info-item">
            <strong>API URL:</strong> {process.env.REACT_APP_API_URL || 'http://localhost:3001'}
          </div>
          <div className="info-item">
            <strong>Navegador:</strong> {navigator.userAgent}
          </div>
          <div className="info-item">
            <strong>Timestamp:</strong> {new Date().toLocaleString()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConnectionTest;
