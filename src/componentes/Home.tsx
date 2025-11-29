import MapboxMap from './MapboxMap'
import './Home.css'

const Home = () => {
  return (
    <div className="home-container">
      <nav className="navbar">
        <div className="navbar-content">
          <h1 className="navbar-title">RampApp</h1>
          <ul className="navbar-menu">
            <li><a href="#inicio" className="navbar-link active">Inicio</a></li>
            <li><a href="#mapa" className="navbar-link">Puntos guardados</a></li>
            <li><a href="#acerca" className="navbar-link">Mis puntos</a></li>
            <li><a href="#info" className="navbar-link">Info útill</a></li>
          </ul>
        </div>
      </nav>
      <div className="map-wrapper">
        <MapboxMap />
      </div>
    </div>
  )
}

export default Home

