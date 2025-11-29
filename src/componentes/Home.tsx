import { useState } from 'react'
import MapboxMap, { type Point } from './MapboxMap'
import NavBar from './NavBar'
import PointForm from './PointForm'
import PointsList from './PointsList'
import { getSavedPoints, getMyPoints } from '../firebase/points'
import { Bookmark as BookmarkIcon, Person as PersonIcon } from '@mui/icons-material'
import './Home.css'

const Home = () => {
  const [selectedPoint, setSelectedPoint] = useState<Point | null>(null)
  const [showOnlySavedPoints, setShowOnlySavedPoints] = useState(false)
  const [showOnlyMyPoints, setShowOnlyMyPoints] = useState(false)

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

  const handleShowSavedPoints = () => {
    setShowOnlySavedPoints(true)
    setShowOnlyMyPoints(false)
  }

  const handleShowMyPoints = () => {
    setShowOnlyMyPoints(true)
    setShowOnlySavedPoints(false)
  }

  const handleShowAllPoints = () => {
    setShowOnlySavedPoints(false)
    setShowOnlyMyPoints(false)
  }

  return (
    <div className="home-container">
      <NavBar 
        onShowSavedPoints={handleShowSavedPoints}
        onShowAllPoints={handleShowAllPoints}
        onShowMyPoints={handleShowMyPoints}
        showOnlySavedPoints={showOnlySavedPoints}
        showOnlyMyPoints={showOnlyMyPoints}
      />
      <div className="map-wrapper" style={{ position: 'relative' }}>
        <MapboxMap 
          onPointAdded={handlePointAdded}
          onPointUpdated={handlePointUpdated}
          isFormOpen={!!selectedPoint}
          showOnlySavedPoints={showOnlySavedPoints}
          showOnlyMyPoints={showOnlyMyPoints}
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
        {selectedPoint && (
          <PointForm 
            point={selectedPoint} 
            onConfirmDelete={handleConfirmDelete}
          />
        )}
      </div>
    </div>
  )
}

export default Home

