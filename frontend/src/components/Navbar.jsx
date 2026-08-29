import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getPropietarioPorAuth, getInquilinoPorAuth, getConversacionesPropietario, getConversacionesInquilino } from '../services/api'

const INTERVALO_ACTUALIZACION = 15000 // 15 segundos

function Navbar() {
  const { usuario, logout } = useAuth()
  const navigate = useNavigate()
  const [noLeidos, setNoLeidos] = useState(0)

  useEffect(() => {
    if (!usuario) {
      setNoLeidos(0)
      return
    }

    let cancelado = false

    const actualizarContador = async () => {
      try {
        const cargarPerfil = usuario.rol === 'anfitrion' ? getPropietarioPorAuth : getInquilinoPorAuth
        const { data: perfil } = await cargarPerfil(usuario.id)

        const cargarConversaciones = usuario.rol === 'anfitrion'
          ? getConversacionesPropietario(perfil.id_propietario)
          : getConversacionesInquilino(perfil.id_inquilino)

        const { data: conversaciones } = await cargarConversaciones
        if (!cancelado) {
          const total = conversaciones.reduce((suma, c) => suma + c.no_leidos, 0)
          setNoLeidos(total)
        }
      } catch {
        if (!cancelado) setNoLeidos(0)
      }
    }

    actualizarContador()
    const intervalo = setInterval(actualizarContador, INTERVALO_ACTUALIZACION)
    return () => { cancelado = true; clearInterval(intervalo) }
  }, [usuario])

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  return (
    <nav style={styles.nav}>
      <Link to="/" style={styles.logo}>RentaFácil HN</Link>
      <div style={styles.links}>
        <Link to="/" style={styles.link}>Inicio</Link>
        <Link to="/propiedades" style={styles.link}>Propiedades</Link>

        {usuario && (
          <Link to="/mensajes" style={styles.linkMensajes}>
            Mensajes
            {noLeidos > 0 && <span style={styles.badge}>{noLeidos}</span>}
          </Link>
        )}

        {!usuario && (
          <>
            <Link to="/login" style={styles.link}>Iniciar Sesión</Link>
            <Link to="/admin" style={styles.botonAnfitrion}>Anfitriones</Link>
          </>
        )}

        {usuario && usuario.rol === 'anfitrion' && (
          <>
            <Link to="/admin" style={styles.botonAnfitrion}>Panel Admin</Link>
            <button onClick={handleLogout} style={styles.botonCerrarSesion}>Cerrar Sesión</button>
          </>
        )}

        {usuario && usuario.rol === 'inquilino' && (
          <>
            <Link to="/mis-reservas" style={styles.link}>Mis reservas</Link>
            <button onClick={handleLogout} style={styles.botonCerrarSesion}>Cerrar Sesión</button>
          </>
        )}
      </div>
    </nav>
  )
}

const styles = {
  nav: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1rem 2rem',
    backgroundColor: '#1a1a2e',
    color: 'white'
  },
  logo: {
    color: 'white',
    textDecoration: 'none',
    fontSize: '1.5rem',
    fontWeight: 'bold'
  },
  links: {
    display: 'flex',
    gap: '1.5rem',
    alignItems: 'center'
  },
  link: {
    color: 'white',
    textDecoration: 'none',
    fontSize: '1rem'
  },
  linkMensajes: {
    color: 'white',
    textDecoration: 'none',
    fontSize: '1rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem'
  },
  badge: {
    backgroundColor: '#e94560',
    color: 'white',
    borderRadius: '50%',
    minWidth: '20px',
    height: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.7rem',
    fontWeight: 'bold',
    padding: '0 0.3rem'
  },
  botonAnfitrion: {
    padding: '0.5rem 1.2rem',
    backgroundColor: '#e94560',
    color: 'white',
    textDecoration: 'none',
    borderRadius: '4px',
    fontSize: '0.95rem',
    fontWeight: 'bold'
  },
  botonCerrarSesion: {
    padding: '0.5rem 1.2rem',
    backgroundColor: 'transparent',
    color: 'white',
    border: '1px solid white',
    borderRadius: '4px',
    fontSize: '0.95rem',
    fontWeight: 'bold',
    cursor: 'pointer'
  }
}

export default Navbar