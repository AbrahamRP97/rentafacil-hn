import { useEffect, useState } from 'react'
import { getPropiedades } from '../services/api'
import PropiedadCard from '../components/PropiedadCard'
import MapaPropiedades from '../components/MapaPropiedades'

function Propiedades() {
  const [propiedades, setPropiedades] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [vista, setVista] = useState('lista') // 'lista' | 'mapa'

  useEffect(() => {
    getPropiedades()
      .then(res => {
        setPropiedades(res.data)
        setLoading(false)
      })
      .catch(err => {
        setError('Error al cargar las propiedades')
        setLoading(false)
      })
  }, [])

  if (loading) return <p style={styles.mensaje}>Cargando propiedades...</p>
  if (error)   return <p style={styles.mensaje}>{error}</p>

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.titulo}>Propiedades disponibles</h2>
        <div style={styles.toggle}>
          <button
            onClick={() => setVista('lista')}
            style={{ ...styles.botonToggle, ...(vista === 'lista' ? styles.botonToggleActivo : {}) }}
          >
            📋 Lista
          </button>
          <button
            onClick={() => setVista('mapa')}
            style={{ ...styles.botonToggle, ...(vista === 'mapa' ? styles.botonToggleActivo : {}) }}
          >
            🗺️ Mapa
          </button>
        </div>
      </div>

      {propiedades.length === 0 ? (
        <p style={styles.mensaje}>No hay propiedades registradas aún.</p>
      ) : vista === 'lista' ? (
        <div style={styles.grid}>
          {propiedades.map(p => (
            <PropiedadCard key={p.id_propiedad} propiedad={p} />
          ))}
        </div>
      ) : (
        <MapaPropiedades propiedades={propiedades} />
      )}
    </div>
  )
}

const styles = {
  container: {
    padding: '2rem',
    fontFamily: 'sans-serif'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '1rem',
    marginBottom: '1.5rem'
  },
  titulo: {
    fontSize: '1.8rem',
    color: '#1a1a2e',
    margin: 0
  },
  toggle: {
    display: 'flex',
    gap: '0.5rem',
    backgroundColor: '#f0f0f0',
    padding: '0.3rem',
    borderRadius: '8px'
  },
  botonToggle: {
    padding: '0.5rem 1rem',
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.9rem',
    color: '#555',
    fontWeight: 'bold'
  },
  botonToggleActivo: {
    backgroundColor: '#1a1a2e',
    color: 'white'
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '1.5rem'
  },
  mensaje: {
    padding: '2rem',
    textAlign: 'center',
    color: '#888',
    fontSize: '1rem'
  }
}

export default Propiedades