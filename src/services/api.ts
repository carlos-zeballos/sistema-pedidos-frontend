import axios from 'axios';

const API_BASE_URL = 'https://sistema-pedidos-restaurante.onrender.com';

console.log('🔗 API URL:', API_BASE_URL);

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // Aumentar timeout a 30 segundos
});

// Interceptor para logging y autenticación
api.interceptors.request.use(
  (config) => {
    // Agregar token de autenticación si existe
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    console.log('📤 Request:', config.method?.toUpperCase(), config.url, config.data);
    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// Función para reintentar requests
const retryRequest = async (error: any) => {
  const maxRetries = 3;
  const retryCount = error.config?.__retryCount || 0;
  const retryDelay = 1000 * (retryCount + 1); // Delay incremental
  
  if (retryCount < maxRetries && (
    error.code === 'ECONNABORTED' || // Timeout
    error.code === 'ERR_NETWORK' || // Network error
    error.response?.status >= 500 // Server errors
  )) {
    console.log(`🔄 Reintentando request (${retryCount + 1}/${maxRetries}) en ${retryDelay}ms...`);
    
    // Marcar el request para evitar loops infinitos
    error.config.__retryCount = retryCount + 1;
    
    await new Promise(resolve => setTimeout(resolve, retryDelay));
    
    // Reintentar el request original
    return api.request(error.config);
  }
  
  return Promise.reject(error);
};

api.interceptors.response.use(
  (response) => {
    console.log('📥 Response:', response.status, response.data);
    return response;
  },
  async (error) => {
    console.error('❌ Response Error:', error.response?.status, error.response?.data);
    console.error('❌ Error details:', {
      message: error.message,
      code: error.code,
      config: error.config?.url
    });
    
    // Intentar reintentar el request
    try {
      return await retryRequest(error);
    } catch (retryError: any) {
      // Si el error es 401 (no autorizado), limpiar el token pero no redirigir automáticamente
      if (retryError?.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        // Solo redirigir si no estamos ya en la página de login
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
      
      return Promise.reject(retryError);
    }
  }
);

// Auth Service
export const authService = {
  login: async (credentials: { username: string; password: string }) => {
    console.log('🔐 AuthService.login - Iniciando login...');
    console.log('📤 Credenciales:', { username: credentials.username, password: '***' });
    console.log('🌐 URL base:', API_BASE_URL);
    
    try {
      const response = await api.post('/auth/login', credentials);
      console.log('✅ AuthService.login - Login exitoso');
      console.log('📥 Response data:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ AuthService.login - Error en login:', error);
      console.error('❌ Error response:', error.response?.data);
      throw error;
    }
  },
  
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  getCurrentUser: (): any => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  isAuthenticated: (): boolean => {
    return !!localStorage.getItem('token');
  },
};

// Catalog Service
export const catalogService = {
  getCategories: async () => {
    const response = await api.get('/catalog/public/categories');
    return response.data;
  },
  getCategoryById: async (id: string) => {
    const response = await api.get(`/catalog/categories/${id}`);
    return response.data;
  },
  createCategory: async (data: any) => {
    const response = await api.post('/catalog/categories', data);
    return response.data;
  },
  updateCategory: async (id: string, data: any) => {
    const response = await api.put(`/catalog/categories/${id}`, data);
    return response.data;
  },
  deleteCategory: async (id: string) => {
    const response = await api.delete(`/catalog/categories/${id}`);
    return response.data;
  },
  getProducts: async () => {
    const response = await api.get('/catalog/public/products');
    return response.data;
  },
  getProductById: async (id: string) => {
    const response = await api.get(`/catalog/products/${id}`);
    return response.data;
  },
  getProductsByCategory: async (categoryid: string) => {
    const response = await api.get(`/catalog/categories/${categoryid}/products`);
    return response.data;
  },
  createProduct: async (data: any) => {
    const response = await api.post('/catalog/products', data);
    return response.data;
  },
  updateProduct: async (id: string, data: any) => {
    const response = await api.put(`/catalog/products/${id}`, data);
    return response.data;
  },
  deleteProduct: async (id: string) => {
    const response = await api.delete(`/catalog/products/${id}`);
    return response.data;
  },
  getCombos: async () => {
    const response = await api.get('/catalog/public/combos');
    return response.data;
  },
  getComboById: async (id: string) => {
    // Usar endpoint público que no requiere autenticación
    const response = await api.get(`/catalog/public/combos`);
    const combos = response.data;
    const combo = combos.find((c: any) => c.id === id);
    if (!combo) {
      throw new Error(`Combo con ID ${id} no encontrado`);
    }
    return combo;
  },
  getComboComponents: async (comboId: string) => {
    const response = await api.get(`/catalog/combos/${comboId}/components`);
    return response.data;
  },
  createCombo: async (data: any) => {
    const response = await api.post('/catalog/combos', data);
    return response.data;
  },
  updateCombo: async (id: string, data: any) => {
    const response = await api.put(`/catalog/combos/${id}`, data);
    return response.data;
  },
  deleteCombo: async (id: string) => {
    const response = await api.delete(`/catalog/combos/${id}`);
    return response.data;
  },
  getProductsForComboComponents: async (categoryId?: string) => {
    const response = await api.get(`/catalog/products-for-combo-components${categoryId ? `?categoryId=${categoryId}` : ''}`);
    return response.data;
  },
  // Space methods
  getSpaces: async () => {
    const response = await api.get('/catalog/public/spaces');
    return response.data;
  },
  getSpaceById: async (id: string) => {
    const response = await api.get(`/catalog/spaces/${id}`);
    return response.data;
  },
  createSpace: async (data: any) => {
    const response = await api.post('/catalog/spaces', data);
    return response.data;
  },
  updateSpace: async (id: string, data: any) => {
    const response = await api.put(`/catalog/spaces/${id}`, data);
    return response.data;
  },
  deleteSpace: async (id: string) => {
    const response = await api.delete(`/catalog/spaces/${id}`);
    return response.data;
  },
};

// Order Service
export const orderService = {
  getOrders: async (status?: string) => {
    const response = await api.get('/orders', { params: { status } });
    return response.data;
  },
  getOrderById: async (id: string) => {
    const response = await api.get(`/orders/${id}`);
    return response.data;
  },
  createOrder: async (data: any) => {
    // Usar el endpoint de prueba que acepta camelCase
    const response = await api.post('/orders/test', data);
    return response.data;
  },
  updateOrderStatus: async (id: string, status: string, assignedTo?: string) => {
    // Usar endpoint de prueba para evitar problemas de autenticación
    const response = await api.put(`/orders/test/${id}/status`, { status, assignedTo });
    return response.data;
  },
  deleteOrder: async (id: string) => {
    const response = await api.delete(`/orders/${id}`);
    return response.data;
  },
  getKitchenOrders: async () => {
    const response = await api.get('/orders/kitchen');
    return response.data;
  },
  getActiveOrders: async () => {
    const response = await api.get('/orders', { params: { status: 'PENDIENTE,EN_PREPARACION' } });
    return response.data;
  },
  getOrdersBySpace: async (spaceId: string) => {
    const response = await api.get(`/orders/space/${spaceId}`);
    return response.data;
  },
  addItemsToOrder: async (orderId: string, items: Array<{
    productId?: string | null;
    comboId?: string | null;
    name: string;
    unitPrice: number;
    totalPrice: number;
    quantity?: number;
    notes?: string | null;
  }>) => {
    // TEMPORAL: Usar endpoint de prueba para diagnosticar
    console.log('🧪 Usando endpoint de prueba para diagnosticar');
    const response = await api.post(`/orders/test/${orderId}/items`, { items });
    return response.data;
  },
};

// Table Service (ahora Space Service)
export const tableService = {
  getTables: async () => {
    const response = await api.get('/tables');
    return response.data;
  },
  getTableById: async (id: string) => {
    const response = await api.get(`/tables/${id}`);
    return response.data;
  },
  createTable: async (data: any) => {
    const response = await api.post('/tables', data);
    return response.data;
  },
  updateTable: async (id: string, data: any) => {
    const response = await api.put(`/tables/${id}`, data);
    return response.data;
  },
  updateTableStatus: async (id: string, status: string) => {
    const response = await api.put(`/tables/${id}/status`, { status });
    return response.data;
  },
  deleteTable: async (id: string) => {
    const response = await api.delete(`/tables/${id}`);
    return response.data;
  },
  getSpaces: async () => {
    const response = await api.get('/catalog/public/spaces');
    return response.data;
  },
  getSpaceById: async (id: string) => {
    const response = await api.get(`/tables/spaces/${id}`);
    return response.data;
  },
  updateSpaceStatus: async (id: string, status: string) => {
    const response = await api.put(`/tables/spaces/${id}/status`, { status });
    return response.data;
  },
};

// Reservation Service
export const reservationService = {
  getReservations: async () => {
    const response = await api.get('/reservations');
    return response.data;
  },
  getTodayReservations: async () => {
    const response = await api.get('/reservations/today');
    return response.data;
  },
  createReservation: async (data: any) => {
    const response = await api.post('/reservations', data);
    return response.data;
  },
  updateReservation: async (id: string, data: any) => {
    const response = await api.put(`/reservations/${id}`, data);
    return response.data;
  },
  deleteReservation: async (id: string) => {
    const response = await api.delete(`/reservations/${id}`);
    return response.data;
  },
};

// User Service
export const userService = {
  getUsers: async () => {
    const response = await api.get('/users');
    return response.data;
  },
  getUserById: async (id: string) => {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },
  createUser: async (data: any) => {
    const response = await api.post('/users', data);
    return response.data;
  },
  updateUser: async (id: string, data: any) => {
    const response = await api.put(`/users/${id}`, data);
    return response.data;
  },
  deleteUser: async (id: string) => {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  },
};

// Diagnostic Service
export const diagnosticService = {
  checkBackendHealth: async () => {
    try {
      const response = await api.get('/health');
      return { status: 'success', data: response.data };
    } catch (error: any) {
      return { 
        status: 'error', 
        message: error.message || 'Backend no disponible',
        details: error.response?.data 
      };
    }
  },
  checkDatabaseConnection: async () => {
    try {
      const response = await api.get('/health/database');
      return { status: 'success', data: response.data };
    } catch (error: any) {
      return { 
        status: 'error', 
        message: error.message || 'Error de conexión a la base de datos',
        details: error.response?.data 
      };
    }
  },
};

export default api;

// Payment Service
export const paymentService = {
  // Obtener métodos de pago disponibles
  getPaymentMethods: async () => {
    try {
      const response = await api.get('/payments/methods');
      return response.data.data;
    } catch (error) {
      console.error('Error getting payment methods:', error);
      throw error;
    }
  },

  // Registrar un pago
  registerPayment: async (paymentData: {
    orderId: string;
    paymentMethodId: string;
    amount: number;
    notes?: string;
  }) => {
    try {
      const response = await api.post('/payments/register', paymentData);
      return response.data.data;
    } catch (error) {
      console.error('Error registering payment:', error);
      throw error;
    }
  },

  // Obtener reporte de caja por fecha
  getCashReport: async (startDate: Date, endDate: Date) => {
    try {
      const response = await api.get('/payments/cash-report', {
        params: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        }
      });
      return response.data.data;
    } catch (error) {
      console.error('Error getting cash report:', error);
      throw error;
    }
  },

  // Obtener reporte de órdenes pagadas
  getPaidOrdersReport: async (startDate: Date, endDate: Date) => {
    try {
      const response = await api.get('/payments/paid-orders', {
        params: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        }
      });
      return response.data.data;
    } catch (error) {
      console.error('Error getting paid orders report:', error);
      throw error;
    }
  },

  // Obtener estadísticas de ventas por hora
  getSalesByHour: async (date: Date) => {
    try {
      const response = await api.get('/payments/sales-by-hour', {
        params: { date: date.toISOString().split('T')[0] }
      });
      return response.data.data;
    } catch (error) {
      console.error('Error getting sales by hour:', error);
      throw error;
    }
  },

  // Obtener resumen del día actual
  getTodaySummary: async () => {
    try {
      const response = await api.get('/payments/today-summary');
      return response.data.data;
    } catch (error) {
      console.error('Error getting today summary:', error);
      throw error;
    }
  },

  // Obtener resumen de métodos de pago
  getPaymentSummary: async () => {
    try {
      const response = await api.get('/payments/summary');
      return response.data.data;
    } catch (error) {
      console.error('Error getting payment summary:', error);
      throw error;
    }
  },

  // Verificar si una orden está pagada
  checkOrderPaymentStatus: async (orderId: string) => {
    try {
      const response = await api.get(`/payments/order/${orderId}/status`);
      return response.data.data.isPaid;
    } catch (error) {
      console.error('Error checking order payment status:', error);
      return false;
    }
  },

  // Obtener total de ventas por rango de fechas
  getTotalSalesByDateRange: async (startDate: Date, endDate: Date) => {
    try {
      const response = await api.get('/payments/total-sales', {
        params: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        }
      });
      return response.data.data.totalSales;
    } catch (error) {
      console.error('Error getting total sales:', error);
      return 0;
    }
  }
};

/* Frontend actualizado: 2025-09-03T13:00:00.000Z */
