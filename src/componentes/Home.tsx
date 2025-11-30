import { useState } from 'react'
import MapboxMap from './MapboxMap'
import NavBar from './NavBar'
import PointForm from './PointForm'
import PointsList from './PointsList'
import { getSavedPoints, getMyPoints, getPendingPoints } from '../firebase/points'
import { Bookmark as BookmarkIcon, Person as PersonIcon, PendingActions as PendingIcon, FilterList as FilterIcon } from '@mui/icons-material'
import { Select, MenuItem, FormControl, InputLabel, Box, Paper, IconButton, Tooltip } from '@mui/material'
import type { Point } from '../types'
import { CATEGORY_OPTIONS, STATUS_OPTIONS } from '../constants/points'
import './Home.css'

const Home = () => {
  const [selectedPoint, setSelectedPoint] = useState<Point | null>(null)
  const [showOnlySavedPoints, setShowOnlySavedPoints] = useState(false)
  const [showOnlyMyPoints, setShowOnlyMyPoints] = useState(false)
  const [showPendingPoints, setShowPendingPoints] = useState(false)
  const [savedPointsRefreshKey, setSavedPointsRefreshKey] = useState(0)
  const [pendingPointsRefreshKey, setPendingPointsRefreshKey] = useState(0)
  const [mapRefreshKey, setMapRefreshKey] = useState(0)
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [selectedStatus, setSelectedStatus] = useState<string>('')
  const [showFilters, setShowFilters] = useState(false)

  const handlePointAdded = (point: Point) => {
    setSelectedPoint(point)
  }

  const handlePointUpdated = (updatedPoint: Point) => {
    // Actualizar el punto seleccionado con las nuevas coordenadas
    if (selectedPoint && selectedPoint.id === updatedPoint.id) {
      setSelectedPoint(updatedPoint)
    }
  }

  const handleRemovePoint = (pointId: string) => {
    // Llamar a la función global para eliminar el punto del mapa
    interface WindowWithRemovePoint extends Window {
      __removePointFromMap?: (pointId: string) => void;
    }
    const removePoint = (window as WindowWithRemovePoint).__removePointFromMap;
    if (removePoint) {
      removePoint(pointId)
    }
    setSelectedPoint(null)
  }

  const handleConfirmDelete = () => {
    if (selectedPoint) {
      handleRemovePoint(selectedPoint.id)
    }
  }

  const handleCloseForm = () => {
    setSelectedPoint(null)
  }

  const handleFavoriteChanged = () => {
    // Refrescar el listado de puntos guardados cuando se quita un favorito
    if (showOnlySavedPoints) {
      setSavedPointsRefreshKey(prev => prev + 1)
    }
  }

  const handleStatusUpdated = () => {
    // Refrescar el listado de puntos pendientes cuando se actualiza el estado
    if (showPendingPoints) {
      setPendingPointsRefreshKey(prev => prev + 1)
      setMapRefreshKey(prev => prev + 1) // También refrescar el mapa
    }
  }

  const handlePointSaved = () => {
    // Cuando se guarda un punto nuevo, eliminar el punto temporal del mapa
    // y forzar refresh del mapa para mostrar el punto guardado
    if (selectedPoint) {
      // Eliminar el punto temporal del mapa (tiene ID temporal)
      handleRemovePoint(selectedPoint.id)
      // Forzar refresh del mapa para que cargue el punto guardado
      setMapRefreshKey(prev => prev + 1)
    }
  }

  const handleShowSavedPoints = () => {
    setShowOnlySavedPoints(true)
    setShowOnlyMyPoints(false)
    setShowPendingPoints(false)
    setSelectedPoint(null) // Cerrar el formulario si está abierto
  }

  const handleShowMyPoints = () => {
    setShowOnlyMyPoints(true)
    setShowOnlySavedPoints(false)
    setShowPendingPoints(false)
    setSelectedPoint(null) // Cerrar el formulario si está abierto
  }

  const handleShowAllPoints = () => {
    setShowOnlySavedPoints(false)
    setShowOnlyMyPoints(false)
    setShowPendingPoints(false)
    setSelectedPoint(null) // Cerrar el formulario si está abierto
  }

  const handleShowPendingPoints = () => {
    setShowPendingPoints(true)
    setShowOnlySavedPoints(false)
    setShowOnlyMyPoints(false)
    setSelectedPoint(null) // Cerrar el formulario si está abierto
  }

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category)
    setMapRefreshKey(prev => prev + 1) // Refrescar el mapa cuando cambia el filtro
  }

  const handleStatusChange = (status: string) => {
    setSelectedStatus(status)
    setMapRefreshKey(prev => prev + 1) // Refrescar el mapa cuando cambia el filtro
  }

  const handleClearFilters = () => {
    setSelectedCategory('')
    setSelectedStatus('')
    setMapRefreshKey(prev => prev + 1) // Refrescar el mapa cuando se limpian los filtros
  }

  return (
    <div className="home-container">
      <NavBar 
        onShowSavedPoints={handleShowSavedPoints}
        onShowAllPoints={handleShowAllPoints}
        onShowMyPoints={handleShowMyPoints}
        onShowPendingPoints={handleShowPendingPoints}
        showOnlySavedPoints={showOnlySavedPoints}
        showOnlyMyPoints={showOnlyMyPoints}
        showPendingPoints={showPendingPoints}
      />
      <div className="map-wrapper" style={{ position: 'relative' }}>
        {showFilters && (
          <Paper 
            elevation={3}
            sx={{
              position: 'absolute',
              top: '10px',
              right: '10px',
              zIndex: 1000,
              p: 2,
              backgroundColor: 'white',
              borderRadius: 2,
              minWidth: '250px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <FilterIcon sx={{ color: '#3b82f6' }} />
                <Box component="span" sx={{ fontWeight: 600, fontSize: '1rem' }}>Filtros</Box>
              </Box>
              <IconButton 
                size="small" 
                onClick={() => setShowFilters(false)}
                sx={{ ml: 1 }}
              >
                ×
              </IconButton>
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <FormControl fullWidth size="small">
                <InputLabel id="category-filter-label">Tipo de punto</InputLabel>
                <Select
                  labelId="category-filter-label"
                  value={selectedCategory}
                  label="Tipo de punto"
                  onChange={(e) => handleCategoryChange(e.target.value)}
                >
                  <MenuItem value="">
                    <em>Todos</em>
                  </MenuItem>
                  {CATEGORY_OPTIONS.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth size="small">
                <InputLabel id="status-filter-label">Estado</InputLabel>
                <Select
                  labelId="status-filter-label"
                  value={selectedStatus}
                  label="Estado"
                  onChange={(e) => handleStatusChange(e.target.value)}
                >
                  <MenuItem value="">
                    <em>Todos</em>
                  </MenuItem>
                  {STATUS_OPTIONS.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box
                          sx={{
                            width: 12,
                            height: 12,
                            borderRadius: '50%',
                            backgroundColor: option.color,
                          }}
                        />
                        {option.label}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              {(selectedCategory || selectedStatus) && (
                <Tooltip title="Limpiar filtros">
                  <IconButton
                    onClick={handleClearFilters}
                    size="small"
                    sx={{
                      alignSelf: 'flex-start',
                      color: '#3b82f6',
                      '&:hover': {
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                      },
                    }}
                  >
                    Limpiar filtros
                  </IconButton>
                </Tooltip>
              )}
            </Box>
          </Paper>
        )}
        {!showFilters && (
          <Tooltip title="Mostrar filtros">
            <IconButton
              onClick={() => setShowFilters(true)}
              sx={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                zIndex: 1000,
                backgroundColor: 'white',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                '&:hover': {
                  backgroundColor: '#f5f5f5',
                },
              }}
            >
              <FilterIcon sx={{ color: '#3b82f6' }} />
            </IconButton>
          </Tooltip>
        )}
        <MapboxMap 
          onPointAdded={handlePointAdded}
          onPointUpdated={handlePointUpdated}
          isFormOpen={!!selectedPoint}
          showOnlySavedPoints={showOnlySavedPoints}
          showOnlyMyPoints={showOnlyMyPoints}
          showPendingPoints={showPendingPoints}
          savedPointsRefreshKey={savedPointsRefreshKey}
          mapRefreshKey={mapRefreshKey}
          selectedCategory={selectedCategory}
          selectedStatus={selectedStatus}
        />
        {showOnlySavedPoints && (
          <PointsList
            title="Puntos Guardados"
            fetchPoints={getSavedPoints}
            onPointClick={handlePointAdded}
            showPointStatus={false}
            icon={<BookmarkIcon sx={{ color: '#3b82f6', fontSize: '24px' }} />}
            emptyMessage="No tienes puntos guardados aún"
            tooltipTitle="Mostrar puntos guardados"
            refreshKey={savedPointsRefreshKey}
          />
        )}
        {showOnlyMyPoints && (
          <PointsList
            title="Mis Puntos"
            fetchPoints={getMyPoints}
            onPointClick={handlePointAdded}
            showPointStatus={true}
            icon={<PersonIcon sx={{ color: '#3b82f6', fontSize: '24px' }} />}
            emptyMessage="No has creado puntos aún"
            tooltipTitle="Mostrar mis puntos"
          />
        )}
        {showPendingPoints && (
          <PointsList
            title="Puntos Pendientes"
            fetchPoints={getPendingPoints}
            onPointClick={handlePointAdded}
            showPointStatus={true}
            icon={<PendingIcon sx={{ color: '#f59e0b', fontSize: '24px' }} />}
            emptyMessage="No hay puntos pendientes"
            tooltipTitle="Mostrar puntos pendientes"
            refreshKey={pendingPointsRefreshKey}
          />
        )}
        {selectedPoint && (
          <PointForm 
            point={selectedPoint} 
            onConfirmDelete={handleConfirmDelete}
            onClose={handleCloseForm}
            onFavoriteChanged={handleFavoriteChanged}
            onPointSaved={handlePointSaved}
            isAdminMode={showPendingPoints}
            onStatusUpdated={handleStatusUpdated}
          />
        )}
      </div>
    </div>
  )
}

export default Home

