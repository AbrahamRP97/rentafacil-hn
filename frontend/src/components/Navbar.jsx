import { Link } from 'react-router-dom'

function Navbar() {
  return (
    <nav style={styles.nav}>
      <Link to="/" style={styles.logo}>RentaFácil HN</Link>
      <div style={styles.links}>
        <Link to="/" style={styles.link}>Inicio</Link>
        <Link to="/propiedades" style={styles.link}>Propiedades</Link>
        <Link to="/login" style={styles.link}>Iniciar Sesión</Link>
        <Link to="/admin" style={styles.botonAnfitrion}>Anfitriones</Link>
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
  botonAnfitrion: {
    padding: '0.5rem 1.2rem',
    backgroundColor: '#e94560',
    color: 'white',
    textDecoration: 'none',
    borderRadius: '4px',
    fontSize: '0.95rem',
    fontWeight: 'bold'
  }
}

export default Navbar