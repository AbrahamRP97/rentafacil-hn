import { useEffect, useState } from 'react'
import { getPropiedades } from '../services/api'
import PropiedadCard from '../components/PropiedadCard'

function Propiedades() {
  const [propiedades, setPropiedades] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

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
      <h2 style={styles.titulo}>Propiedades disponibles</h2>
      {propiedades.length === 0 ? (
        <p style={styles.mensaje}>No hay propiedades registradas aún.</p>
      ) : (
        <div style={styles.grid}>
          {propiedades.map(p => (
            <PropiedadCard key={p.id_propiedad} propiedad={p} />
          ))}
        </div>
      )}
    </div>
  )
}

const styles = {
  container: {
    padding: '2rem',
    fontFamily: 'sans-serif'
  },
  titulo: {
    fontSize: '1.8rem',
    color: '#1a1a2e',
    marginBottom: '1.5rem'
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