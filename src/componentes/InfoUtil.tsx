import { Box, Typography } from '@mui/material'
import NavBar from './NavBar'
import martinGiuliana from '../assets/martin-giuliana.png'
import './InfoUtil.css'

const InfoUtil = () => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw', overflow: 'hidden' }}>
      <NavBar />
      <Box className="info-util-container">
        <Box className="info-util-content">
        {/* Sección izquierda */}
        <Box className="info-util-left">
          <Box className="photo-section">
            <img src={martinGiuliana} alt="Martin y Giuliana" className="info-photo" />
          </Box>
          <Typography variant="h3" className="info-slogan">
            ¡CÓRDOBA MÁS ACCESIBLE, PARA TODOS!
          </Typography>
        </Box>

        {/* Sección derecha */}
        <Box className="info-util-right">
          <Box className="info-icon-section">
            <Box className="info-icon-circle">
              <Typography variant="h1" className="info-icon-text">i</Typography>
            </Box>
            <Typography variant="h2" className="info-title">
              INFORMACIÓN UTIL
            </Typography>
          </Box>
          <Box className="info-panel">
            <Typography variant="body1" className="info-paragraph">
              En RampApp trabajamos para construir ciudades más inclusivas, accesibles y amigables para todos. 
              Nuestro propósito es brindar información confiable y actualizada sobre rampas, accesos y espacios 
              adaptados, facilitando la movilidad de personas que utilizan sillas de ruedas o requieren 
              desplazamientos accesibles.
            </Typography>
            <Typography variant="body1" className="info-paragraph">
              Creemos en un entorno urbano donde cada persona pueda moverse con libertad, seguridad y autonomía. 
              Por eso, desarrollamos una plataforma colaborativa que permite identificar, evaluar y sugerir puntos 
              accesibles en la ciudad, contribuyendo a una comunidad más consciente y comprometida.
            </Typography>
            <Typography variant="body1" className="info-tagline">
              RampApp: conectamos accesibilidad con igualdad de oportunidades.
            </Typography>
          </Box>
        </Box>
      </Box>
      </Box>
    </Box>
  )
}

export default InfoUtil

