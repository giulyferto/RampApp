import { useState } from 'react'
import MapboxMap, { type Point } from './MapboxMap'
import NavBar from './NavBar'
import PointForm from './PointForm'
import SavedPointsList from './SavedPointsList'
import './Home.css'

const Home = () => {
  const [selectedPoint, setSelectedPoint] = useState<Point | null>(null)
  const [showOnlySavedPoints, setShowOnlySavedPoints] = useState(false)

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
  }

  const handleShowAllPoints = () => {
    setShowOnlySavedPoints(false)
  }

  return (
    <div className="home-container">
      <NavBar 
        onShowSavedPoints={handleShowSavedPoints}
        onShowAllPoints={handleShowAllPoints}
        showOnlySavedPoints={showOnlySavedPoints}
      />
      <div className="map-wrapper" style={{ position: 'relative' }}>
        <MapboxMap 
          onPointAdded={handlePointAdded}
          onPointUpdated={handlePointUpdated}
          isFormOpen={!!selectedPoint}
          showOnlySavedPoints={showOnlySavedPoints}
        />
        {showOnlySavedPoints && (
          <SavedPointsList onPointClick={handlePointAdded} />
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

