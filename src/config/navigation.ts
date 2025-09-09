import { 
  Home, 
  Plus, 
  Users, 
  ChefHat, 
  BookOpen, 
  Square, 
  BarChart3, 
  Settings,
  Package
} from 'lucide-react';

export interface NavItem {
  path: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: string[];
  description?: string;
}

export const navigationConfig: NavItem[] = [
  {
    path: '/',
    label: 'Dashboard',
    icon: Home,
    roles: ['ADMIN', 'MOZO', 'COCINERO', 'CAJA', 'BARRA'],
    description: 'Vista general del sistema'
  },
  {
    path: '/new-order',
    label: 'Nueva Orden',
    icon: Plus,
    roles: ['ADMIN', 'MOZO', 'CAJA'],
    description: 'Crear nueva orden'
  },
  {
    path: '/waiters',
    label: 'Mozos',
    icon: Users,
    roles: ['ADMIN', 'MOZO'],
    description: 'Gestión de mozos'
  },
  {
    path: '/kitchen',
    label: 'Cocina',
    icon: ChefHat,
    roles: ['ADMIN', 'COCINERO'],
    description: 'Panel de cocina'
  },
  {
    path: '/catalog',
    label: 'Catálogo',
    icon: BookOpen,
    roles: ['ADMIN'],
    description: 'Ver catálogo de productos'
  },
  {
    path: '/catalog-management',
    label: 'Gestión Catálogo',
    icon: Settings,
    roles: ['ADMIN'],
    description: 'Crear y editar productos, categorías y espacios'
  },
  {
    path: '/combos',
    label: 'Gestión Combos',
    icon: Package,
    roles: ['ADMIN'],
    description: 'Crear y editar combos personalizables'
  },
  {
    path: '/tables',
    label: 'Mesas',
    icon: Square,
    roles: ['ADMIN', 'MOZO', 'CAJA'],
    description: 'Gestión de espacios'
  },
  {
    path: '/reports',
    label: 'Reportes',
    icon: BarChart3,
    roles: ['ADMIN'],
    description: 'Reportes y estadísticas'
  },
  {
    path: '/test',
    label: 'Test',
    icon: Settings,
    roles: ['ADMIN'],
    description: 'Herramientas de prueba'
  }
];

export const quickActions = [
  {
    path: '/new-order',
    label: 'Nueva Orden',
    icon: Plus,
    roles: ['ADMIN', 'MOZO', 'CAJA'],
    description: 'Crear nueva orden'
  },
  {
    path: '/kitchen',
    label: 'Vista Cocina',
    icon: ChefHat,
    roles: ['ADMIN', 'COCINERO'],
    description: 'Panel de cocina'
  },
  {
    path: '/tables',
    label: 'Gestionar Espacios',
    icon: Square,
    roles: ['ADMIN', 'MOZO', 'CAJA'],
    description: 'Gestión de mesas'
  },
  {
    path: '/catalog',
    label: 'Catálogo',
    icon: BookOpen,
    roles: ['ADMIN'],
    description: 'Ver catálogo de productos'
  },
  {
    path: '/catalog-management',
    label: 'Gestión Catálogo',
    icon: Settings,
    roles: ['ADMIN'],
    description: 'Crear y editar productos, categorías y espacios'
  },
  {
    path: '/combos',
    label: 'Gestión Combos',
    icon: Package,
    roles: ['ADMIN'],
    description: 'Crear y editar combos personalizables'
  },
  {
    path: '/waiters',
    label: 'Vista Mozos',
    icon: Users,
    roles: ['ADMIN', 'MOZO'],
    description: 'Vista de mozos'
  },
  {
    path: '/reports',
    label: 'Reportes',
    icon: BarChart3,
    roles: ['ADMIN'],
    description: 'Reportes y estadísticas'
  }
];

export const getNavigationForRole = (role: string): NavItem[] => {
  return navigationConfig.filter(item => item.roles.includes(role));
};

export const getQuickActionsForRole = (role: string) => {
  return quickActions.filter(action => action.roles.includes(role));
};
