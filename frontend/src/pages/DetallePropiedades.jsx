import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getPropiedad, getReservas, createReserva, getInquilinoPorAuth } from '../services/api'
import CalendarioDisponibilidad from '../components/CalendarioDisponibilidad'

const ESTADOS_OCUPADOS = ['pendiente', 'aprobada']

function fechasSeSolapan(inicioA, finA, inicioB, finB) {
  const a1 = new Date(inicioA).setHours(0, 0, 0, 0)
  const a2 = new Date(finA).setHours(0, 0, 0, 0)
  const b1 = new Date(inicioB).setHours(0, 0, 0, 0)
  const b2 = new Date(finB).setHours(0, 0, 0, 0)
  return a1 <= b2 && a2 >= b1
}

function DetallePropiedades() {
  const { id } = useParams()
  const { usuario } = useAuth()

  const [propiedad, setPropiedad] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [imagenActiva, setImagenActiva] = useState(null)

  const [reservasPropiedad, setReservasPropiedad] = useState([])
  const [inquilinoActual, setInquilinoActual] = useState(null)

  const [formReserva, setFormReserva] = useState({ fecha_inicio: '', fecha_fin: '' })
  const [errorReserva, setErrorReserva] = useState(null)
  const [exitoReserva, setExitoReserva] = useState(false)
  const [enviandoReserva, setEnviandoReserva] = useState(false)

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

    getReservas()
      .then(res => {
        setReservasPropiedad(res.data.filter(r => r.id_propiedad === parseInt(id)))
      })
      .catch(() => setReservasPropiedad([]))
  }, [id])

  // Si el usuario logueado es inquilino, busca su registro real (id_inquilino)
  useEffect(() => {
    if (usuario && usuario.rol === 'inquilino') {
      getInquilinoPorAuth(usuario.id)
        .then(res => setInquilinoActual(res.data))
        .catch(() => setInquilinoActual(null))
    }
  }, [usuario])

  const handleChangeReserva = (e) => {
    setFormReserva({ ...formReserva, [e.target.name]: e.target.value })
  }

  const handleSubmitReserva = async (e) => {
    e.preventDefault()
    setErrorReserva(null)

    if (!formReserva.fecha_inicio || !formReserva.fecha_fin) {
      setErrorReserva('Selecciona fecha de inicio y de fin')
      return
    }

    if (new Date(formReserva.fecha_fin) <= new Date(formReserva.fecha_inicio)) {
      setErrorReserva('La fecha de fin debe ser posterior a la fecha de inicio')
      return
    }

    const haySolape = reservasPropiedad
      .filter(r => ESTADOS_OCUPADOS.includes(r.estado))
      .some(r => fechasSeSolapan(formReserva.fecha_inicio, formReserva.fecha_fin, r.fecha_inicio, r.fecha_fin))

    if (haySolape) {
      setErrorReserva('Esas fechas ya están ocupadas o pendientes de aprobación. Revisa el calendario.')
      return
    }

    if (!inquilinoActual) {
      setErrorReserva('No se pudo identificar tu perfil de inquilino. Intenta cerrar sesión y volver a entrar.')
      return
    }

    setEnviandoReserva(true)
    try {
      await createReserva({
        id_propiedad: parseInt(id),
        id_inquilino: inquilinoActual.id_inquilino,
        fecha_inicio: formReserva.fecha_inicio,
        fecha_fin: formReserva.fecha_fin,
        estado: 'pendiente'
      })
      setExitoReserva(true)
      setFormReserva({ fecha_inicio: '', fecha_fin: '' })
      const res = await getReservas()
      setReservasPropiedad(res.data.filter(r => r.id_propiedad === parseInt(id)))
      setTimeout(() => setExitoReserva(false), 4000)
    } catch (err) {
      setErrorReserva('Error al enviar la solicitud de reserva. Intenta de nuevo.')
    } finally {
      setEnviandoReserva(false)
    }
  }

  if (loading) return <p style={styles.mensaje}>Cargando propiedad...</p>
  if (error)   return <p style={styles.mensaje}>{error}</p>

  const imagenes = propiedad.IMAGENES_PROPIEDAD || []
  const propietario = propiedad.PROPIETARIOS

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

        {propietario && (
          <div style={styles.propietario}>
            <h3>Propietario</h3>
            <p>👤 {propietario.nombre} {propietario.apellido}</p>
            <p>
              📧 <a href={`mailto:${propietario.email}?subject=Consulta sobre ${propiedad.titulo}`} style={styles.link}>
                {propietario.email}
              </a>
              {' '}(contacto manual desde tu correo)
            </p>
            {usuario && usuario.rol === 'inquilino' && (
              <Link to={`/mensajes/${id}/${propiedad.id_propietario}`} style={styles.botonChat}>
                💬 Enviar mensaje por el chat interno
              </Link>
            )}
          </div>
        )}

        {/* Calendario de disponibilidad */}
        <div style={styles.seccionReserva}>
          <h3>Disponibilidad</h3>
          <CalendarioDisponibilidad reservas={reservasPropiedad} />
        </div>

        {/* Formulario de reserva — solo para inquilinos logueados */}
        <div style={styles.seccionReserva}>
          <h3>Reservar esta propiedad</h3>

          {!usuario && (
            <p style={styles.avisoLogin}>
              <Link to="/login" style={styles.link}>Inicia sesión</Link> como inquilino para poder reservar.
            </p>
          )}

          {usuario && usuario.rol === 'anfitrion' && (
            <p style={styles.avisoLogin}>Estás logueado como anfitrión. Solo los inquilinos pueden reservar.</p>
          )}

          {usuario && usuario.rol === 'inquilino' && (
            <div style={styles.formReserva}>
              {errorReserva && <p style={styles.error}>{errorReserva}</p>}
              {exitoReserva && (
                <p style={styles.exito}>
                  ✅ Solicitud enviada. El propietario debe aprobarla antes de confirmarse.
                </p>
              )}

              <div style={styles.filaFechas}>
                <div style={styles.campo}>
                  <label style={styles.label}>Fecha de inicio</label>
                  <input
                    type="date"
                    name="fecha_inicio"
                    value={formReserva.fecha_inicio}
                    onChange={handleChangeReserva}
                    style={styles.input}
                  />
                </div>
                <div style={styles.campo}>
                  <label style={styles.label}>Fecha de fin</label>
                  <input
                    type="date"
                    name="fecha_fin"
                    value={formReserva.fecha_fin}
                    onChange={handleChangeReserva}
                    style={styles.input}
                  />
                </div>
              </div>

              <button onClick={handleSubmitReserva} style={styles.botonReservar} disabled={enviandoReserva}>
                {enviandoReserva ? 'Enviando solicitud...' : 'Solicitar reserva'}
              </button>
            </div>
          )}
        </div>
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
    color: '#555',
    marginBottom: '1.5rem'
  },
  link: {
    color: '#e94560',
    textDecoration: 'none',
    fontWeight: 'bold'
  },
  botonChat: {
    display: 'inline-block',
    marginTop: '0.6rem',
    padding: '0.6rem 1.2rem',
    backgroundColor: '#1a1a2e',
    color: 'white',
    textDecoration: 'none',
    borderRadius: '4px',
    fontSize: '0.9rem',
    fontWeight: 'bold'
  },
  seccionReserva: {
    marginTop: '1.5rem',
    paddingTop: '1.5rem',
    borderTop: '1px solid #eee'
  },
  avisoLogin: {
    color: '#888',
    fontSize: '0.9rem'
  },
  formReserva: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem'
  },
  filaFechas: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '1rem'
  },
  campo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.4rem'
  },
  input: {
    padding: '0.6rem 0.8rem',
    borderRadius: '4px',
    border: '1px solid #ddd',
    fontSize: '0.95rem',
    outline: 'none'
  },
  botonReservar: {
    padding: '0.8rem',
    backgroundColor: '#e94560',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '1rem',
    fontWeight: 'bold',
    cursor: 'pointer'
  },
  error: {
    backgroundColor: '#ffe0e0',
    color: '#e94560',
    padding: '0.8rem',
    borderRadius: '4px',
    textAlign: 'center',
    fontSize: '0.9rem'
  },
  exito: {
    backgroundColor: '#e0ffe0',
    color: '#28a745',
    padding: '0.8rem',
    borderRadius: '4px',
    textAlign: 'center',
    fontSize: '0.9rem'
  },
  mensaje: {
    padding: '2rem',
    textAlign: 'center',
    color: '#888'
  }
}

export default DetallePropiedades