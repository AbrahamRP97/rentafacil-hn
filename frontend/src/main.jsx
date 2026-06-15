import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Propiedades from './pages/Propiedades'
import DetallePropiedades from './pages/DetallePropiedades'
import Login from './pages/Login'
import Registro from './pages/Registro'
import PanelAdmin from './pages/PanelAdmin'
import ConsultasAvanzadas from './pages/ConsultasAvanzadas'
import RutaProtegida from './components/RutaProtegida'
import './index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Navbar />
        <Routes>
          <Route path="/"                element={<Home />} />
          <Route path="/propiedades"     element={<Propiedades />} />
          <Route path="/propiedades/:id" element={<DetallePropiedades />} />
          <Route path="/login"           element={<Login />} />
          <Route path="/registro"        element={<Registro />} />
          <Route path="/admin"           element={
            <RutaProtegida rol="anfitrion">
              <PanelAdmin />
            </RutaProtegida>
          } />
          <Route path="/admin/consultas-avanzadas" element={
            <RutaProtegida rol="anfitrion">
              <ConsultasAvanzadas />
            </RutaProtegida>
          } />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
)
