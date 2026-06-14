import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Propiedades from './pages/Propiedades'
import DetallePropiedades from './pages/DetallePropiedades'
import Login from './pages/Login'
import PanelAdmin from './pages/PanelAdmin'
import './index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/"                   element={<Home />} />
        <Route path="/propiedades"        element={<Propiedades />} />
        <Route path="/propiedades/:id"    element={<DetallePropiedades />} />
        <Route path="/login"              element={<Login />} />
        <Route path="/admin"              element={<PanelAdmin />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
)