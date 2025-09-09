# Modern Kitchen View (KDS) - Documentación

## 🎯 Descripción

La **Modern Kitchen View** es una nueva interfaz de cocina (Kitchen Display System) diseñada con un estilo moderno "franja superior roja" que mantiene toda la funcionalidad del sistema actual mientras mejora significativamente la experiencia visual y de usuario.

## ✨ Características Principales

### 🎨 Diseño Visual
- **Header rojo** con código de ticket, estado y timer
- **Body blanco** con información completa de la orden
- **Grid responsive** (5 columnas desktop, 3 tablet, 2 móvil)
- **Tres pestañas** con contadores en tiempo real

### ⚡ Funcionalidad
- **Estados de color** por tiempo transcurrido:
  - 🟢 **Blanco**: < 15 minutos (En tiempo)
  - 🟠 **Naranja**: 15-30 minutos (Atención)
  - 🔴 **Rojo**: > 30 minutos (Crítico)
- **Interacción de ítems**: Pendiente → Trabajando (verde) → Finalizado
- **Sonidos/notificaciones** para nuevas comandas y críticos
- **Accesibilidad** completa con navegación por teclado

### 🔧 Técnico
- **Conserva toda la información** del sistema actual
- **IDs y relaciones** para sincronización con backend
- **WebSocket/SSE** o polling sin recargar página
- **Rendimiento optimizado** para 50+ tickets

## 🚀 Cómo Usar

### Acceso
1. Navega a **"Cocina Moderna"** en el menú lateral
2. O accede directamente a `/kitchen-modern`

### Navegación
- **Pestañas**: Haz clic en "En preparación", "Listas", o "Entregadas"
- **Atajos de teclado**: Presiona `1`, `2`, o `3` para cambiar pestañas
- **Contadores**: Se actualizan automáticamente en tiempo real

### Interacción con Tickets
- **Clic en ítem**: Cambia estado (Pendiente → Trabajando → Finalizado)
- **Marcar como listo**: Botón azul para órdenes en preparación
- **Entregar**: Botón azul para órdenes listas
- **Actualizar**: Sincroniza con el backend
- **Reimprimir**: Reimprime el ticket

### Estados de Color
- **Header blanco**: Orden en tiempo (< 15 min)
- **Header naranja**: Orden en atención (15-30 min)
- **Header rojo**: Orden crítica (> 30 min)
- **Header gris**: Pedidos para llevar

## 📱 Responsive Design

### Desktop (1200px+)
- **5 columnas** en el grid
- **Tamaño completo** de tickets
- **Hover effects** completos

### Tablet (768px - 1199px)
- **3 columnas** en el grid
- **Tamaño medio** de tickets
- **Touch-friendly** buttons

### Móvil (< 768px)
- **2 columnas** en el grid
- **Tamaño compacto** de tickets
- **Stack vertical** de botones

### Móvil pequeño (< 480px)
- **1 columna** en el grid
- **Pestañas apiladas** verticalmente
- **Botones de ancho completo**

## 🎨 Personalización

### Colores
Los colores se pueden personalizar en `ModernKitchenView.css`:

```css
/* Header colors */
.ticket-header.white { background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%); }
.ticket-header.orange { background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); }
.ticket-header.red { background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); }
.ticket-header.grey { background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%); }
```

### Tamaños
Los tamaños del grid se pueden ajustar:

```css
/* Grid responsive */
@media (min-width: 1200px) { .orders-grid { grid-template-columns: repeat(5, 1fr); } }
@media (max-width: 1199px) and (min-width: 768px) { .orders-grid { grid-template-columns: repeat(3, 1fr); } }
@media (max-width: 767px) { .orders-grid { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 480px) { .orders-grid { grid-template-columns: 1fr; } }
```

## 🔧 Integración con Backend

### Servicios Utilizados
- `orderService.getKitchenOrders()` - Obtener órdenes de cocina
- `orderService.updateOrderStatus()` - Actualizar estado de orden

### Estructura de Datos
```typescript
interface KitchenOrder extends Order {
  items: OrderItem[];
  timeStatus: TimeStatus;
  elapsedMinutes: number;
  priority: number;
}

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  notes?: string;
  status: ItemStatus;
  hasAllergy?: boolean;
  modifiers?: string[];
}
```

## 🚨 Solución de Problemas

### Problemas Comunes
1. **Tickets no se actualizan**: Verificar conexión con backend
2. **Colores incorrectos**: Verificar lógica de tiempo en `calculatePriority`
3. **Responsive no funciona**: Verificar media queries en CSS

### Debug
- Abrir **DevTools** para ver logs de consola
- Verificar **Network** para peticiones al backend
- Comprobar **Console** para errores de JavaScript

## 🔄 Actualizaciones Futuras

### Funcionalidades Planificadas
- [ ] **Sonidos/notificaciones** para nuevas comandas
- [ ] **WebSocket** para actualizaciones en tiempo real
- [ ] **Filtros avanzados** por estación y canal
- [ ] **Modo oscuro** para cocinas con poca luz
- [ ] **Estadísticas** de tiempo de preparación

### Mejoras Técnicas
- [ ] **Virtualización** para 100+ tickets
- [ ] **Service Worker** para offline
- [ ] **PWA** para instalación en tablets
- [ ] **Tests** unitarios y de integración

## 📞 Soporte

Para reportar problemas o solicitar nuevas funcionalidades:
1. Verificar que el problema no esté en la documentación
2. Revisar los logs de consola
3. Contactar al equipo de desarrollo

---

**Versión**: 1.0.0  
**Última actualización**: Diciembre 2024  
**Compatibilidad**: React 18+, TypeScript 4.9+

