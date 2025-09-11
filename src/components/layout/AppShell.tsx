import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Menu, 
  X, 
  Search, 
  Bell, 
  ChevronDown,
  LogOut
} from 'lucide-react';
import { getNavigationForRole } from '../../config/navigation';

interface AppShellProps {
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();
  const userDropdownRef = useRef<HTMLDivElement>(null);

  const navigationItems = user ? getNavigationForRole(user.role) : [];

  // Cerrar dropdown cuando se hace clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false);
      }
    };

    if (userDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [userDropdownOpen]);

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const handleLogout = () => {
    logout();
    setUserDropdownOpen(false);
  };

  const getBreadcrumb = () => {
    const currentItem = navigationItems.find(item => isActive(item.path));
    return currentItem ? currentItem.label : 'Dashboard';
  };

  return (
    <div className="app-shell">
      {/* Header Horizontal */}
      <header className="app-header">
        <div className="header-container">
          {/* Logo y Toggle Mobile */}
          <div className="header-left">
            <button 
              className="mobile-menu-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <Menu className="icon" />
            </button>
            
            <Link to="/" className="logo">
              <div className="logo-icon">
                <span>🍽️</span>
              </div>
              <span className="logo-text">RestoApp</span>
            </Link>
          </div>

          {/* Navegación Horizontal */}
          <nav className="header-nav">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`nav-link ${isActive(item.path) ? 'active' : ''}`}
                >
                  <Icon className="nav-icon" />
                  <span className="nav-text">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Header Right */}
          <div className="header-right">
            {/* Search */}
            <div className="search-container">
              <Search className="search-icon" />
              <input
                type="text"
                placeholder="Buscar..."
                className="search-input"
              />
            </div>

            {/* Notifications */}
            <button className="notification-btn">
              <Bell className="icon" />
              <span className="notification-badge">3</span>
            </button>

            {/* User Menu */}
            <div className="user-menu" ref={userDropdownRef}>
              <button
                className="user-menu-toggle"
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              >
                <div className="user-avatar">
                  <span>{user?.firstName?.charAt(0).toUpperCase()}</span>
                </div>
                <div className="user-info">
                  <span className="user-name">{user?.firstName} {user?.lastName}</span>
                  <span className="user-role">{user?.role}</span>
                </div>
                <ChevronDown className="chevron-icon" />
              </button>

              {/* Dropdown Menu */}
              {userDropdownOpen && (
                <div className="user-dropdown">
                  <div className="dropdown-header">
                    <div className="dropdown-user-info">
                      <div className="dropdown-avatar">
                        <span>{user?.firstName?.charAt(0).toUpperCase()}</span>
                      </div>
                      <div>
                        <p className="dropdown-name">{user?.firstName} {user?.lastName}</p>
                        <p className="dropdown-email">{user?.email}</p>
                      </div>
                    </div>
                  </div>
                  <div className="dropdown-divider"></div>
                  <button className="dropdown-item" onClick={handleLogout}>
                    <LogOut className="dropdown-icon" />
                    <span>Cerrar Sesión</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="mobile-nav">
          <div className="mobile-nav-header">
            <span className="mobile-nav-title">Navegación</span>
            <button 
              className="mobile-nav-close"
              onClick={() => setMobileMenuOpen(false)}
            >
              <X className="icon" />
            </button>
          </div>
          <nav className="mobile-nav-links">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`mobile-nav-link ${isActive(item.path) ? 'active' : ''}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Icon className="mobile-nav-icon" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      )}

      {/* Main Content */}
      <main className="app-main">
        <div className="main-container">
          {/* Breadcrumb */}
          <div className="breadcrumb">
            <span className="breadcrumb-item">Dashboard</span>
            <span className="breadcrumb-separator">/</span>
            <span className="breadcrumb-current">{getBreadcrumb()}</span>
          </div>

          {/* Page Content */}
          <div className="page-content">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};
