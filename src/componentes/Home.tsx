import MapboxMap from './MapboxMap'
import NavBar from './NavBar'
import './Home.css'

const Home = () => {
  return (
    <div className="home-container">
      <NavBar />
      <div className="map-wrapper">
        <MapboxMap />
      </div>
    </div>
  )
}

export default Home

