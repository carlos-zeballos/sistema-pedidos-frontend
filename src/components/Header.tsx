import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Header.css';

const Header: React.FC = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const handleLogout = () => {
    logout();
    setIsDropdownOpen(false);
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <header className="header">
      <div className="header-container">
        <div className="logo-section">
          <Link to="/" className="logo">
            <span className="logo-icon">🍽️</span>
            <span className="logo-text">RestoApp</span>
          </Link>
        </div>

        <nav className="nav-menu">
          <ul>
            <li className="nav-item">
              <Link 
                to="/" 
                className={`nav-link ${isActive('/') ? 'active' : ''}`}
              >
                <span className="nav-icon">🏠</span>
                <span className="nav-text">Dashboard</span>
              </Link>
            </li>
            
            <li className="nav-item">
              <Link 
                to="/new-order" 
                className={`nav-link ${isActive('/new-order') ? 'active' : ''}`}
              >
                <span className="nav-icon">➕</span>
                <span className="nav-text">Nueva Orden</span>
              </Link>
            </li>
            
            <li className="nav-item">
              <Link 
                to="/waiters" 
                className={`nav-link ${isActive('/waiters') ? 'active' : ''}`}
              >
                <span className="nav-icon">👨‍💼</span>
                <span className="nav-text">Mozos</span>
              </Link>
            </li>
            
            <li className="nav-item">
              <Link 
                to="/kitchen" 
                className={`nav-link ${isActive('/kitchen') ? 'active' : ''}`}
              >
                <span className="nav-icon">👨‍🍳</span>
                <span className="nav-text">Cocina</span>
              </Link>
            </li>
            
            <li className="nav-item">
              <Link 
                to="/catalog" 
                className={`nav-link ${isActive('/catalog') ? 'active' : ''}`}
              >
                <span className="nav-icon">📖</span>
                <span className="nav-text">Catálogo</span>
              </Link>
            </li>
            
            <li className="nav-item">
              <Link 
                to="/tables" 
                className={`nav-link ${isActive('/tables') ? 'active' : ''}`}
              >
                <span className="nav-icon">🪑</span>
                <span className="nav-text">Mesas</span>
              </Link>
            </li>


            {user?.role === 'ADMIN' && (
              <li className="nav-item">
                <Link 
                  to="/test" 
                  className={`nav-link ${isActive('/test') ? 'active' : ''}`}
                >
                  <span className="nav-icon">🔧</span>
                  <span className="nav-text">Test</span>
                </Link>
              </li>
            )}
          </ul>
        </nav>

        <div className="user-section">
          <div className="user-info">
            <div className="user-avatar">
              {user?.firstName?.charAt(0).toUpperCase()}
            </div>
            <div className="user-details">
              <span className="user-name">{user?.firstName} {user?.lastName}</span>
              <span className="user-role">{user?.role}</span>
            </div>
          </div>

          <div className="dropdown">
            <button 
              className="dropdown-toggle"
              onClick={toggleDropdown}
            >
              ▼
            </button>
            
            <ul className={`dropdown-menu ${isDropdownOpen ? 'show' : ''}`}>
              <li>
                <button 
                  className="dropdown-item danger"
                  onClick={handleLogout}
                >
                  <span className="dropdown-icon">🚪</span>
                  Cerrar Sesión
                </button>
              </li>
            </ul>
          </div>
        </div>

        <button 
          className="mobile-menu-toggle"
          onClick={toggleMobileMenu}
        >
          ☰
        </button>
      </div>

      {/* Mobile Menu */}
      <div className={`mobile-menu ${isMobileMenuOpen ? 'show' : ''}`}>
        <div className="mobile-menu-content">
          <div className="mobile-menu-header">
            <h3>Menú</h3>
            <button 
              className="mobile-menu-close"
              onClick={toggleMobileMenu}
            >
              ✕
            </button>
          </div>
          
          <ul className="mobile-nav-menu">
            <li className="mobile-nav-item">
              <Link 
                to="/" 
                className={`mobile-nav-link ${isActive('/') ? 'active' : ''}`}
                onClick={toggleMobileMenu}
              >
                <span className="mobile-nav-icon">🏠</span>
                Dashboard
              </Link>
            </li>
            
            <li className="mobile-nav-item">
              <Link 
                to="/new-order" 
                className={`mobile-nav-link ${isActive('/new-order') ? 'active' : ''}`}
                onClick={toggleMobileMenu}
              >
                <span className="mobile-nav-icon">➕</span>
                Nueva Orden
              </Link>
            </li>
            
            <li className="mobile-nav-item">
              <Link 
                to="/waiters" 
                className={`mobile-nav-link ${isActive('/waiters') ? 'active' : ''}`}
                onClick={toggleMobileMenu}
              >
                <span className="mobile-nav-icon">👨‍💼</span>
                Mozos
              </Link>
            </li>
            
            <li className="mobile-nav-item">
              <Link 
                to="/kitchen" 
                className={`mobile-nav-link ${isActive('/kitchen') ? 'active' : ''}`}
                onClick={toggleMobileMenu}
              >
                <span className="mobile-nav-icon">👨‍🍳</span>
                Cocina
              </Link>
            </li>
            
            <li className="mobile-nav-item">
              <Link 
                to="/catalog" 
                className={`mobile-nav-link ${isActive('/catalog') ? 'active' : ''}`}
                onClick={toggleMobileMenu}
              >
                <span className="mobile-nav-icon">📖</span>
                Catálogo
              </Link>
            </li>
            
            <li className="mobile-nav-item">
              <Link 
                to="/tables" 
                className={`mobile-nav-link ${isActive('/tables') ? 'active' : ''}`}
                onClick={toggleMobileMenu}
              >
                <span className="mobile-nav-icon">🪑</span>
                Mesas
              </Link>
            </li>


            {user?.role === 'ADMIN' && (
              <li className="mobile-nav-item">
                <Link 
                  to="/test" 
                  className={`mobile-nav-link ${isActive('/test') ? 'active' : ''}`}
                  onClick={toggleMobileMenu}
                >
                  <span className="mobile-nav-icon">🔧</span>
                  Test
                </Link>
              </li>
            )}

            <li className="mobile-nav-item">
              <button 
                className="mobile-nav-link danger"
                onClick={() => {
                  handleLogout();
                  toggleMobileMenu();
                }}
              >
                <span className="mobile-nav-icon">🚪</span>
                Cerrar Sesión
              </button>
            </li>
          </ul>
        </div>
      </div>
    </header>
  );
};

export default Header;
