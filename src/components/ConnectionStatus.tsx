import React, { useState, useEffect } from 'react';
import { diagnosticService } from '../services/api';

interface ConnectionStatusProps {
  onStatusChange?: (isConnected: boolean) => void;
}

const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ onStatusChange }) => {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  const checkConnection = async () => {
    setIsChecking(true);
    try {
      const result = await diagnosticService.checkBackendHealth();
      const connected = result.status === 'success';
      setIsConnected(connected);
      setLastCheck(new Date());
      onStatusChange?.(connected);
      
      if (connected) {
        console.log('✅ Conexión al backend restaurada');
      } else {
        console.log('❌ Backend no disponible:', result.message);
      }
    } catch (error) {
      console.error('❌ Error checking connection:', error);
      setIsConnected(false);
      setLastCheck(new Date());
      onStatusChange?.(false);
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    // Verificar conexión inicial
    checkConnection();
    
    // Verificar cada 30 segundos
    const interval = setInterval(checkConnection, 30000);
    
    return () => clearInterval(interval);
  }, []);

  if (isConnected === null) {
    return (
      <div className="flex items-center space-x-2 text-gray-500">
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
        <span className="text-sm">Verificando conexión...</span>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-2">
      <div 
        className={`w-2 h-2 rounded-full ${
          isConnected 
            ? 'bg-green-500' 
            : 'bg-red-500 animate-pulse'
        }`}
      ></div>
      <span className={`text-sm ${
        isConnected ? 'text-green-600' : 'text-red-600'
      }`}>
        {isConnected ? 'Conectado' : 'Desconectado'}
      </span>
      {lastCheck && (
        <span className="text-xs text-gray-400">
          ({lastCheck.toLocaleTimeString()})
        </span>
      )}
      {!isConnected && (
        <button
          onClick={checkConnection}
          disabled={isChecking}
          className="ml-2 px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {isChecking ? 'Verificando...' : 'Reintentar'}
        </button>
      )}
    </div>
  );
};

export default ConnectionStatus;

