import './App.css'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Home from './componentes/Home'
import InfoUtil from './componentes/InfoUtil'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/info-util" element={<InfoUtil />} />
      </Routes>
    </Router>
  )
}

export default App
