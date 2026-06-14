import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function RutaProtegida({ children, rol }) {
  const { usuario } = useAuth()

  if (!usuario) {
    return <Navigate to="/login" />
  }

  if (rol && usuario.rol !== rol) {
    return <Navigate to="/" />
  }

  return children
}

export default RutaProtegida