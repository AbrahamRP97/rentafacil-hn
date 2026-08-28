import { Link } from 'react-router-dom'

function PropiedadCard({ propiedad }) {
  const imagenes = propiedad.IMAGENES_PROPIEDAD || []
  const portada = imagenes.find(img => img.es_portada) || imagenes[0]
  const urlImagen = portada ? portada.url_imagen : 'https://via.placeholder.com/400x250?text=Sin+imagen'

  return (
    <div style={styles.card}>
      <img
        src={urlImagen}
        alt={propiedad.titulo}
        style={styles.imagen}
        onError={(e) => { e.target.src = 'https://via.placeholder.com/400x250?text=Sin+imagen' }}
      />
      <div style={styles.contenido}>
        <h3 style={styles.titulo}>{propiedad.titulo}</h3>
        <p style={styles.precio}>L. {propiedad.precio_mensual} / mes</p>
        <p style={styles.tipo}>🏠 {propiedad.tipo}</p>
        <p style={styles.estado}>Estado: {propiedad.estado}</p>
        <Link to={`/propiedades/${propiedad.id_propiedad}`} style={styles.boton}>
          Ver detalle
        </Link>
      </div>
    </div>
  )
}

const styles = {
  card: {
    backgroundColor: '#fff',
    borderRadius: '8px',
    overflow: 'hidden',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    display: 'flex',
    flexDirection: 'column'
  },
  imagen: {
    width: '100%',
    height: '180px',
    objectFit: 'cover'
  },
  contenido: {
    padding: '1.5rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem'
  },
  titulo: {
    fontSize: '1.1rem',
    fontWeight: 'bold',
    color: '#1a1a2e',
    margin: 0
  },
  precio: {
    fontSize: '1rem',
    color: '#e94560',
    fontWeight: 'bold',
    margin: 0
  },
  tipo: {
    fontSize: '0.9rem',
    color: '#555',
    margin: 0,
    textTransform: 'capitalize'
  },
  estado: {
    fontSize: '0.85rem',
    color: '#888',
    margin: 0,
    textTransform: 'capitalize'
  },
  boton: {
    marginTop: '0.5rem',
    padding: '0.5rem 1rem',
    backgroundColor: '#1a1a2e',
    color: 'white',
    textDecoration: 'none',
    borderRadius: '4px',
    textAlign: 'center',
    fontSize: '0.9rem'
  }
}

export default PropiedadCard