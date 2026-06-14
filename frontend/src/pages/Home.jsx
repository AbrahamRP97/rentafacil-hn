import { Link } from 'react-router-dom'

function Home() {
  return (
    <div style={styles.container}>
      <div style={styles.hero}>
        <h1 style={styles.titulo}>Encuentra tu hogar ideal en Honduras</h1>
        <p style={styles.subtitulo}>
          Alquila propiedades de manera fácil, rápida y segura.
        </p>
        <Link to="/propiedades" style={styles.boton}>
          Ver Propiedades
        </Link>
      </div>

      <div style={styles.features}>
        <div style={styles.feature}>
          <span style={styles.icono}>🏠</span>
          <h3>Amplio catálogo</h3>
          <p>Casas, apartamentos, locales y más en todo Honduras.</p>
        </div>
        <div style={styles.feature}>
          <span style={styles.icono}>🔒</span>
          <h3>Seguro y confiable</h3>
          <p>Contratos digitales y pagos registrados en el sistema.</p>
        </div>
        <div style={styles.feature}>
          <span style={styles.icono}>⚡</span>
          <h3>Rápido y sencillo</h3>
          <p>Reserva tu propiedad en minutos desde cualquier lugar.</p>
        </div>
      </div>
    </div>
  )
}

const styles = {
  container: {
    fontFamily: 'sans-serif'
  },
  hero: {
    backgroundColor: '#1a1a2e',
    color: 'white',
    padding: '5rem 2rem',
    textAlign: 'center'
  },
  titulo: {
    fontSize: '2.5rem',
    marginBottom: '1rem'
  },
  subtitulo: {
    fontSize: '1.2rem',
    marginBottom: '2rem',
    color: '#ccc'
  },
  boton: {
    padding: '0.8rem 2rem',
    backgroundColor: '#e94560',
    color: 'white',
    textDecoration: 'none',
    borderRadius: '4px',
    fontSize: '1rem',
    fontWeight: 'bold'
  },
  features: {
    display: 'flex',
    justifyContent: 'center',
    gap: '2rem',
    padding: '4rem 2rem',
    backgroundColor: '#f5f5f5',
    flexWrap: 'wrap'
  },
  feature: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '2rem',
    textAlign: 'center',
    width: '250px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
  },
  icono: {
    fontSize: '2.5rem'
  }
}

export default Home