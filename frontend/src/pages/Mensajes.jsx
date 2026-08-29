import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getPropietarioPorAuth, getInquilinoPorAuth, getConversacionesPropietario, getConversacionesInquilino } from '../services/api'

const INTERVALO_ACTUALIZACION = 8000 // 8 segundos

function Mensajes() {
  const { usuario } = useAuth()
  const [perfilActual, setPerfilActual] = useState(null)
  const [conversaciones, setConversaciones] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!usuario) return
    const cargarPerfil = usuario.rol === 'anfitrion' ? getPropietarioPorAuth : getInquilinoPorAuth
    cargarPerfil(usuario.id)
      .then(res => setPerfilActual(res.data))
      .catch(() => setPerfilActual(null))
  }, [usuario])

  useEffect(() => {
    if (!perfilActual) return

    const cargarConversaciones = () => {
      const promesa = usuario.rol === 'anfitrion'
        ? getConversacionesPropietario(perfilActual.id_propietario)
        : getConversacionesInquilino(perfilActual.id_inquilino)

      promesa
        .then(res => {
          setConversaciones(res.data)
          setLoading(false)
        })
        .catch(() => setLoading(false))
    }

    cargarConversaciones()
    const intervalo = setInterval(cargarConversaciones, INTERVALO_ACTUALIZACION)
    return () => clearInterval(intervalo)
  }, [perfilActual, usuario])

  if (loading) return <p style={styles.mensaje}>Cargando conversaciones...</p>

  return (
    <div style={styles.container}>
      <h2 style={styles.titulo}>Centro de mensajes</h2>

      {conversaciones.length === 0 ? (
        <p style={styles.mensaje}>Todavía no tienes conversaciones.</p>
      ) : (
        <div style={styles.lista}>
          {conversaciones.map(conv => {
            const otraParte = usuario.rol === 'anfitrion' ? conv.inquilino : conv.propietario
            const idOtraParte = usuario.rol === 'anfitrion' ? conv.id_inquilino : conv.id_propietario
            const nombreOtraParte = otraParte ? `${otraParte.nombre} ${otraParte.apellido}` : 'Usuario'

            return (
              <Link
                key={`${conv.id_propiedad}-${idOtraParte}`}
                to={`/mensajes/${conv.id_propiedad}/${idOtraParte}`}
                style={styles.itemLink}
              >
                <div style={styles.item}>
                  <div style={styles.itemInfo}>
                    <span style={styles.nombreOtraParte}>{nombreOtraParte}</span>
                    <span style={styles.propiedadTitulo}>{conv.propiedad?.titulo}</span>
                    <span style={styles.ultimoMensaje}>
                      {conv.ultimo_mensaje.remitente === usuario.rol ? 'Tú: ' : ''}
                      {conv.ultimo_mensaje.contenido.length > 60
                        ? conv.ultimo_mensaje.contenido.slice(0, 60) + '...'
                        : conv.ultimo_mensaje.contenido}
                    </span>
                  </div>
                  {conv.no_leidos > 0 && (
                    <span style={styles.badge}>{conv.no_leidos}</span>
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

const styles = {
  container: {
    padding: '2rem',
    fontFamily: 'sans-serif',
    maxWidth: '700px',
    margin: '0 auto'
  },
  titulo: {
    fontSize: '1.8rem',
    color: '#1a1a2e',
    marginBottom: '1.5rem'
  },
  lista: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.8rem'
  },
  itemLink: {
    textDecoration: 'none',
    color: 'inherit'
  },
  item: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '1rem 1.2rem',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  itemInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.2rem'
  },
  nombreOtraParte: {
    fontWeight: 'bold',
    color: '#1a1a2e',
    fontSize: '1rem'
  },
  propiedadTitulo: {
    fontSize: '0.8rem',
    color: '#e94560',
    fontWeight: 'bold'
  },
  ultimoMensaje: {
    fontSize: '0.85rem',
    color: '#888'
  },
  badge: {
    backgroundColor: '#e94560',
    color: 'white',
    borderRadius: '50%',
    minWidth: '24px',
    height: '24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.8rem',
    fontWeight: 'bold',
    padding: '0 0.4rem'
  },
  mensaje: {
    padding: '2rem',
    textAlign: 'center',
    color: '#888'
  }
}

export default Mensajes