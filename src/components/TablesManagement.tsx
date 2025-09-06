import React, { useState, useEffect } from 'react';
import { tableService } from '../services/api';
import { Space } from '../types';
import './TablesManagement.css';

const TablesManagement: React.FC = () => {
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingSpace, setEditingSpace] = useState<Space | null>(null);
  
  // Formulario para crear/editar espacios
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    type: 'MESA',
    capacity: 4,
    status: 'LIBRE',
    isActive: true,
    notes: ''
  });

  useEffect(() => {
    loadSpaces();
  }, []);

  const loadSpaces = async () => {
    try {
      setLoading(true);
      const spacesData = await tableService.getSpaces();
      setSpaces(spacesData);
    } catch (error: any) {
      setError('Error al cargar los espacios: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      await tableService.updateSpaceStatus(id, status);
      await loadSpaces();
    } catch (error: any) {
      console.error('Error updating space status:', error);
      alert('Error al actualizar el estado del espacio');
    }
  };

  const handleDeleteSpace = async (id: string) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este espacio?')) {
      return;
    }

    try {
      await tableService.deleteTable(id);
      await loadSpaces();
      alert('Espacio eliminado exitosamente');
    } catch (error: any) {
      console.error('Error deleting space:', error);
      alert('Error al eliminar el espacio');
    }
  };

  const handleCreateSpace = async () => {
    try {
      // Aquí implementarías la llamada al API para crear un espacio
      // await tableService.createSpace(formData);
      alert('Funcionalidad de crear espacio en desarrollo');
      setShowCreateForm(false);
      resetForm();
    } catch (error: any) {
      console.error('Error creating space:', error);
      alert('Error al crear el espacio');
    }
  };

  const handleEditSpace = (space: Space) => {
    setEditingSpace(space);
    setFormData({
      code: space.code || '',
      name: space.name || '',
      type: space.type || 'MESA',
      capacity: space.capacity || 4,
      status: space.status || 'LIBRE',
      isActive: space.isActive !== false,
      notes: space.notes || ''
    });
    setShowCreateForm(true);
  };

  const handleUpdateSpace = async () => {
    if (!editingSpace) return;
    
    try {
      // Aquí implementarías la llamada al API para actualizar un espacio
      // await tableService.updateSpace(editingSpace.id, formData);
      alert('Funcionalidad de actualizar espacio en desarrollo');
      setShowCreateForm(false);
      setEditingSpace(null);
      resetForm();
    } catch (error: any) {
      console.error('Error updating space:', error);
      alert('Error al actualizar el espacio');
    }
  };

  const resetForm = () => {
    setFormData({
      code: '',
      name: '',
      type: 'MESA',
      capacity: 4,
      status: 'LIBRE',
      isActive: true,
      notes: ''
    });
    setEditingSpace(null);
  };

  // Filtrar espacios
  const filteredSpaces = spaces.filter(space => {
    const matchesSearch = space.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         space.code?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || space.status === statusFilter;
    const matchesType = typeFilter === 'ALL' || space.type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  // Calcular estadísticas
  const stats = {
    total: spaces.length,
    libre: spaces.filter(s => s.status === 'LIBRE').length,
    ocupada: spaces.filter(s => s.status === 'OCUPADA').length,
    reservada: spaces.filter(s => s.status === 'RESERVADA').length,
    mantenimiento: spaces.filter(s => s.status === 'MANTENIMIENTO').length,
    activos: spaces.filter(s => s.isActive !== false).length,
    inactivos: spaces.filter(s => s.isActive === false).length
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'LIBRE': return '#4caf50';
      case 'OCUPADA': return '#f44336';
      case 'RESERVADA': return '#ff9800';
      case 'MANTENIMIENTO': return '#9e9e9e';
      default: return '#666';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'LIBRE': return 'Libre';
      case 'OCUPADA': return 'Ocupada';
      case 'RESERVADA': return 'Reservada';
      case 'MANTENIMIENTO': return 'Mantenimiento';
      default: return status;
    }
  };

  const getTypeText = (type: string) => {
    switch (type) {
      case 'MESA': return 'Mesa';
      case 'BARRA': return 'Barra';
      case 'DELIVERY': return 'Delivery';
      case 'RESERVA': return 'Reserva';
      default: return type;
    }
  };

  if (loading) {
    return (
      <div className="tables-management-container">
        <div className="loading">Cargando espacios...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="tables-management-container">
        <div className="error">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="tables-management-container">
      <div className="tables-header">
        <div className="header-content">
          <h1>🪑 Gestión de Espacios</h1>
          <p>Administra mesas, barra y espacios de delivery</p>
        </div>
        <button 
          className="btn btn-primary create-btn"
          onClick={() => {
            resetForm();
            setShowCreateForm(true);
          }}
        >
          ➕ Nuevo Espacio
        </button>
      </div>

      {/* Estadísticas */}
      <div className="stats-section">
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-number">{stats.total}</div>
            <div className="stat-label">Total</div>
          </div>
          <div className="stat-card libre">
            <div className="stat-number">{stats.libre}</div>
            <div className="stat-label">Libres</div>
          </div>
          <div className="stat-card ocupada">
            <div className="stat-number">{stats.ocupada}</div>
            <div className="stat-label">Ocupadas</div>
          </div>
          <div className="stat-card reservada">
            <div className="stat-number">{stats.reservada}</div>
            <div className="stat-label">Reservadas</div>
          </div>
          <div className="stat-card mantenimiento">
            <div className="stat-number">{stats.mantenimiento}</div>
            <div className="stat-label">Mantenimiento</div>
          </div>
        </div>
      </div>

      {/* Filtros y búsqueda */}
      <div className="filters-section">
        <div className="search-box">
          <input
            type="text"
            placeholder="🔍 Buscar espacios..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        <div className="filter-controls">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="filter-select"
          >
            <option value="ALL">Todos los estados</option>
            <option value="LIBRE">Libre</option>
            <option value="OCUPADA">Ocupada</option>
            <option value="RESERVADA">Reservada</option>
            <option value="MANTENIMIENTO">Mantenimiento</option>
          </select>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="filter-select"
          >
            <option value="ALL">Todos los tipos</option>
            <option value="MESA">Mesa</option>
            <option value="BARRA">Barra</option>
            <option value="DELIVERY">Delivery</option>
            <option value="RESERVA">Reserva</option>
          </select>
        </div>
      </div>

      {/* Formulario de crear/editar */}
      {showCreateForm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{editingSpace ? 'Editar Espacio' : 'Nuevo Espacio'}</h3>
              <button 
                className="modal-close"
                onClick={() => {
                  setShowCreateForm(false);
                  resetForm();
                }}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label htmlFor="code">Código:</label>
                <input
                  id="code"
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({...formData, code: e.target.value})}
                  placeholder="Ej: MESA-01"
                />
              </div>
              <div className="form-group">
                <label htmlFor="name">Nombre:</label>
                <input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Ej: Mesa 1"
                />
              </div>
              <div className="form-group">
                <label htmlFor="type">Tipo:</label>
                <select
                  id="type"
                  value={formData.type}
                  onChange={(e) => setFormData({...formData, type: e.target.value})}
                >
                  <option value="MESA">Mesa</option>
                  <option value="BARRA">Barra</option>
                  <option value="DELIVERY">Delivery</option>
                  <option value="RESERVA">Reserva</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="capacity">Capacidad:</label>
                <input
                  id="capacity"
                  type="number"
                  min="1"
                  max="20"
                  value={formData.capacity}
                  onChange={(e) => setFormData({...formData, capacity: parseInt(e.target.value) || 4})}
                />
              </div>
              <div className="form-group">
                <label htmlFor="status">Estado:</label>
                <select
                  id="status"
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                >
                  <option value="LIBRE">Libre</option>
                  <option value="OCUPADA">Ocupada</option>
                  <option value="RESERVADA">Reservada</option>
                  <option value="MANTENIMIENTO">Mantenimiento</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="isActive">
                  <input
                    id="isActive"
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                  />
                  Activo
                </label>
              </div>
              <div className="form-group">
                <label htmlFor="notes">Notas:</label>
                <textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  placeholder="Notas adicionales..."
                  rows={3}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button 
                className="btn btn-secondary"
                onClick={() => {
                  setShowCreateForm(false);
                  resetForm();
                }}
              >
                Cancelar
              </button>
              <button 
                className="btn btn-primary"
                onClick={editingSpace ? handleUpdateSpace : handleCreateSpace}
              >
                {editingSpace ? 'Actualizar' : 'Crear'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Grid de espacios */}
      <div className="spaces-grid">
        {filteredSpaces.map(space => (
          <div key={space.id} className="space-card">
            <div className="space-header">
              <h3>{space.name}</h3>
              <span
                className="status-badge"
                style={{ backgroundColor: getStatusColor(space.status) }}
              >
                {getStatusText(space.status)}
              </span>
            </div>

            <div className="space-info">
              <p><strong>Código:</strong> {space.code || 'N/A'}</p>
              <p><strong>Tipo:</strong> {getTypeText(space.type)}</p>
              {space.capacity && (
                <p><strong>Capacidad:</strong> {space.capacity} personas</p>
              )}
              <p><strong>Estado:</strong> {space.isActive ? '✅ Activo' : '❌ Inactivo'}</p>
              {space.notes && (
                <p><strong>Notas:</strong> {space.notes}</p>
              )}
            </div>

            <div className="space-actions">
              <select
                value={space.status}
                onChange={(e) => handleUpdateStatus(space.id, e.target.value)}
                className="status-select"
              >
                <option value="LIBRE">Libre</option>
                <option value="OCUPADA">Ocupada</option>
                <option value="RESERVADA">Reservada</option>
                <option value="MANTENIMIENTO">Mantenimiento</option>
              </select>

              <div className="action-buttons">
                <button
                  onClick={() => handleEditSpace(space)}
                  className="btn btn-secondary btn-sm"
                >
                  ✏️ Editar
                </button>
                <button
                  onClick={() => handleDeleteSpace(space.id)}
                  className="btn btn-danger btn-sm"
                >
                  🗑️ Eliminar
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredSpaces.length === 0 && spaces.length > 0 && (
        <div className="no-results">
          <p>🔍 No se encontraron espacios que coincidan con los filtros.</p>
        </div>
      )}

      {spaces.length === 0 && (
        <div className="no-spaces">
          <p>📋 No hay espacios configurados.</p>
          <button 
            className="btn btn-primary"
            onClick={() => setShowCreateForm(true)}
          >
            ➕ Crear Primer Espacio
          </button>
        </div>
      )}
    </div>
  );
};

export default TablesManagement;

