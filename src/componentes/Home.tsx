import { useState } from 'react'
import MapboxMap, { type Point } from './MapboxMap'
import NavBar from './NavBar'
import PointForm from './PointForm'
import './Home.css'

const Home = () => {
  const [selectedPoint, setSelectedPoint] = useState<Point | null>(null)

  const handlePointAdded = (point: Point) => {
    setSelectedPoint(point)
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

  return (
    <div className="home-container">
      <NavBar />
      <div className="map-wrapper" style={{ position: 'relative' }}>
        <MapboxMap 
          onPointAdded={handlePointAdded} 
          isFormOpen={!!selectedPoint}
        />
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

