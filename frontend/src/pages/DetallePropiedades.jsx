import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getPropiedad } from '../services/api'

function DetallePropiedades() {
  const { id } = useParams()
  const [propiedad, setPropiedad] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [imagenActiva, setImagenActiva] = useState(null)

  useEffect(() => {
    getPropiedad(id)
      .then(res => {
        setPropiedad(res.data)
        const imagenes = res.data.IMAGENES_PROPIEDAD || []
        const portada = imagenes.find(img => img.es_portada) || imagenes[0]
        setImagenActiva(portada ? portada.url_imagen : null)
        setLoading(false)
      })
      .catch(() => {
        setError('No se pudo cargar la propiedad')
        setLoading(false)
      })
  }, [id])

  if (loading) return <p style={styles.mensaje}>Cargando propiedad...</p>
  if (error)   return <p style={styles.mensaje}>{error}</p>

  const imagenes = propiedad.IMAGENES_PROPIEDAD || []

  return (
    <div style={styles.container}>
      <Link to="/propiedades" style={styles.volver}>← Volver a propiedades</Link>

      <div style={styles.card}>
        {/* Galería de imágenes */}
        <div style={styles.galeria}>
          <img
            src={imagenActiva || 'https://via.placeholder.com/700x400?text=Sin+imagen'}
            alt={propiedad.titulo}
            style={styles.imagenPrincipal}
            onError={(e) => { e.target.src = 'https://via.placeholder.com/700x400?text=Sin+imagen' }}
          />
          {imagenes.length > 1 && (
            <div style={styles.miniaturas}>
              {imagenes.map(img => (
                <img
                  key={img.id_imagen}
                  src={img.url_imagen}
                  alt="Miniatura"
                  onClick={() => setImagenActiva(img.url_imagen)}
                  style={{
                    ...styles.miniatura,
                    borderColor: img.url_imagen === imagenActiva ? '#e94560' : 'transparent'
                  }}
                  onError={(e) => { e.target.src = 'https://via.placeholder.com/100?text=Sin+imagen' }}
                />
              ))}
            </div>
          )}
          {imagenes.length === 0 && (
            <p style={styles.sinImagenes}>Esta propiedad aún no tiene fotografías.</p>
          )}
        </div>

        <h2 style={styles.titulo}>{propiedad.titulo}</h2>
        <p style={styles.precio}>L. {propiedad.precio_mensual} / mes</p>

        <div style={styles.detalles}>
          <div style={styles.detalle}>
            <span style={styles.label}>Tipo</span>
            <span style={styles.valor}>{propiedad.tipo}</span>
          </div>
          <div style={styles.detalle}>
            <span style={styles.label}>Estado</span>
            <span style={styles.valor}>{propiedad.estado}</span>
          </div>
          <div style={styles.detalle}>
            <span style={styles.label}>Habitaciones</span>
            <span style={styles.valor}>{propiedad.habitaciones}</span>
          </div>
          <div style={styles.detalle}>
            <span style={styles.label}>Baños</span>
            <span style={styles.valor}>{propiedad.banos}</span>
          </div>
          <div style={styles.detalle}>
            <span style={styles.label}>Metros cuadrados</span>
            <span style={styles.valor}>{propiedad.metros_cuadrados} m²</span>
          </div>
        </div>

        {propiedad.descripcion && (
          <div style={styles.descripcion}>
            <h3>Descripción</h3>
            <p>{propiedad.descripcion}</p>
          </div>
        )}

        {propiedad.UBICACIONES && (
          <div style={styles.ubicacion}>
            <h3>Ubicación</h3>
            <p>📍 {propiedad.UBICACIONES.direccion}, {propiedad.UBICACIONES.municipio}, {propiedad.UBICACIONES.departamento}</p>
          </div>
        )}

        {propiedad.PROPIETARIOS && (
          <div style={styles.propietario}>
            <h3>Propietario</h3>
            <p>👤 {propiedad.PROPIETARIOS.nombre} {propiedad.PROPIETARIOS.apellido}</p>
            <p>📧 {propiedad.PROPIETARIOS.email}</p>
          </div>
        )}
      </div>
    </div>
  )
}

const styles = {
  container: {
    padding: '2rem',
    fontFamily: 'sans-serif',
    maxWidth: '800px',
    margin: '0 auto'
  },
  volver: {
    display: 'inline-block',
    marginBottom: '1.5rem',
    color: '#1a1a2e',
    textDecoration: 'none',
    fontWeight: 'bold'
  },
  card: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '2rem',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
  },
  galeria: {
    marginBottom: '1.5rem'
  },
  imagenPrincipal: {
    width: '100%',
    height: '400px',
    objectFit: 'cover',
    borderRadius: '8px',
    marginBottom: '0.8rem'
  },
  miniaturas: {
    display: 'flex',
    gap: '0.6rem',
    overflowX: 'auto',
    paddingBottom: '0.3rem'
  },
  miniatura: {
    width: '80px',
    height: '60px',
    objectFit: 'cover',
    borderRadius: '4px',
    cursor: 'pointer',
    border: '3px solid transparent',
    flexShrink: 0
  },
  sinImagenes: {
    textAlign: 'center',
    color: '#888',
    padding: '1rem',
    fontSize: '0.9rem'
  },
  titulo: {
    fontSize: '1.8rem',
    color: '#1a1a2e',
    marginBottom: '0.5rem'
  },
  precio: {
    fontSize: '1.5rem',
    color: '#e94560',
    fontWeight: 'bold',
    marginBottom: '1.5rem'
  },
  detalles: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
    gap: '1rem',
    marginBottom: '1.5rem'
  },
  detalle: {
    backgroundColor: '#f5f5f5',
    borderRadius: '6px',
    padding: '0.8rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.3rem'
  },
  label: {
    fontSize: '0.75rem',
    color: '#888',
    textTransform: 'uppercase'
  },
  valor: {
    fontSize: '1rem',
    color: '#1a1a2e',
    fontWeight: 'bold',
    textTransform: 'capitalize'
  },
  descripcion: {
    marginBottom: '1.5rem',
    color: '#555'
  },
  ubicacion: {
    marginBottom: '1.5rem',
    color: '#555'
  },
  propietario: {
    color: '#555'
  },
  mensaje: {
    padding: '2rem',
    textAlign: 'center',
    color: '#888'
  }
}

export default DetallePropiedades