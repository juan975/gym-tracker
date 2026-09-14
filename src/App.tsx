import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Inicio from './pages/Inicio'
import Rutinas from './pages/Rutinas'
import RutinaDetalle from './pages/RutinaDetalle'
import SesionActiva from './pages/SesionActiva'
import Historial from './pages/Historial'
import EditarRutina from './pages/EditarRutina'
import Estadisticas from './pages/Estadisticas'
import CreatinaSeguimiento from './pages/CreatinaSeguimiento'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Sesión activa: full-screen, sin navbar */}
        <Route path="/sesion/:rutinaId" element={<SesionActiva />} />

        {/* Páginas con navbar */}
        <Route path="/" element={<Layout />}>
          <Route index element={<Inicio />} />
          <Route path="rutinas" element={<Rutinas />} />
          <Route path="rutina/:id" element={<RutinaDetalle />} />
          <Route path="historial" element={<Historial />} />
          <Route path="rutina/:id/editar" element={<EditarRutina />} />
          <Route path="estadisticas" element={<Estadisticas />} />
          <Route path="creatina" element={<CreatinaSeguimiento />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App