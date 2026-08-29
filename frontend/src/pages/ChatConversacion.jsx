import { useEffect, useRef, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getPropietarioPorAuth, getInquilinoPorAuth, getPropietario, getInquilino, getPropiedad,
  getMensajesConversacion, enviarMensaje, marcarMensajesLeidos } from '../services/api'

const INTERVALO_ACTUALIZACION = 5000 // 5 segundos

function ChatConversacion() {
  const { id_propiedad, id_otro } = useParams()
  const { usuario } = useAuth()

  const [perfilActual, setPerfilActual] = useState(null)
  const [otraParte, setOtraParte] = useState(null)
  const [propiedad, setPropiedad] = useState(null)
  const [mensajes, setMensajes] = useState([])
  const [texto, setTexto] = useState('')
  const [loading, setLoading] = useState(true)
  const [enviando, setEnviando] = useState(false)

  const finMensajesRef = useRef(null)

  // ID de propietario e ID de inquilino de esta conversación, según el rol de quien mira
  const idPropietario = usuario?.rol === 'anfitrion' ? perfilActual?.id_propietario : id_otro
  const idInquilino = usuario?.rol === 'anfitrion' ? id_otro : perfilActual?.id_inquilino

  useEffect(() => {
    if (!usuario) return
    const cargarPerfil = usuario.rol === 'anfitrion' ? getPropietarioPorAuth : getInquilinoPorAuth
    cargarPerfil(usuario.id).then(res => setPerfilActual(res.data)).catch(() => setPerfilActual(null))

    const cargarOtraParte = usuario.rol === 'anfitrion' ? getInquilino : getPropietario
    cargarOtraParte(id_otro).then(res => setOtraParte(res.data)).catch(() => setOtraParte(null))

    getPropiedad(id_propiedad).then(res => setPropiedad(res.data)).catch(() => setPropiedad(null))
  }, [usuario, id_otro, id_propiedad])

  useEffect(() => {
    if (!idPropietario || !idInquilino) return

    const cargarMensajes = () => {
      getMensajesConversacion(id_propiedad, idPropietario, idInquilino)
        .then(res => {
          setMensajes(res.data)
          setLoading(false)
        })
        .catch(() => setLoading(false))

      // Marca como leídos los mensajes que envió la otra parte
      const remitenteOtraParte = usuario.rol === 'anfitrion' ? 'inquilino' : 'propietario'
      marcarMensajesLeidos({
        id_propiedad,
        id_propietario: idPropietario,
        id_inquilino: idInquilino,
        remitente_a_marcar: remitenteOtraParte
      }).catch(() => {})
    }

    cargarMensajes()
    const intervalo = setInterval(cargarMensajes, INTERVALO_ACTUALIZACION)
    return () => clearInterval(intervalo)
  }, [idPropietario, idInquilino, id_propiedad, usuario])

  useEffect(() => {
    finMensajesRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [mensajes])

  const handleEnviar = async (e) => {
    e.preventDefault()
    if (!texto.trim()) return

    setEnviando(true)
    try {
      await enviarMensaje({
        id_propiedad,
        id_propietario: idPropietario,
        id_inquilino: idInquilino,
        remitente: usuario.rol === 'anfitrion' ? 'propietario' : 'inquilino',
        contenido: texto.trim()
      })
      setTexto('')
      const res = await getMensajesConversacion(id_propiedad, idPropietario, idInquilino)
      setMensajes(res.data)
    } catch {
      // si falla, el mensaje simplemente no se agrega; el usuario puede reintentar
    } finally {
      setEnviando(false)
    }
  }

  const remitentePropio = usuario?.rol === 'anfitrion' ? 'propietario' : 'inquilino'
  const nombreOtraParte = otraParte ? `${otraParte.nombre} ${otraParte.apellido}` : 'Cargando...'

  if (loading) return <p style={styles.mensajeCarga}>Cargando conversación...</p>

  return (
    <div style={styles.container}>
      <Link to="/mensajes" style={styles.volver}>← Centro de mensajes</Link>

      <div style={styles.card}>
        <div style={styles.header}>
          <div>
            <h3 style={styles.nombreHeader}>{nombreOtraParte}</h3>
            {propiedad && <p style={styles.propiedadHeader}>{propiedad.titulo}</p>}
          </div>
        </div>

        <div style={styles.hilo}>
          {mensajes.length === 0 ? (
            <p style={styles.sinMensajes}>Todavía no hay mensajes. Envía el primero.</p>
          ) : (
            mensajes.map(m => (
              <div
                key={m.id_mensaje}
                style={{
                  ...styles.burbuja,
                  ...(m.remitente === remitentePropio ? styles.burbujaPropia : styles.burbujaAjena)
                }}
              >
                <p style={styles.textoBurbuja}>{m.contenido}</p>
                <span style={styles.horaBurbuja}>
                  {new Date(m.created_at).toLocaleString('es-HN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))
          )}
          <div ref={finMensajesRef} />
        </div>

        <form onSubmit={handleEnviar} style={styles.formEnvio}>
          <input
            type="text"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Escribe un mensaje..."
            style={styles.inputMensaje}
          />
          <button type="submit" style={styles.botonEnviar} disabled={enviando || !texto.trim()}>
            Enviar
          </button>
        </form>
      </div>
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
  volver: {
    display: 'inline-block',
    marginBottom: '1rem',
    color: '#1a1a2e',
    textDecoration: 'none',
    fontWeight: 'bold'
  },
  card: {
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    display: 'flex',
    flexDirection: 'column',
    height: '70vh',
    overflow: 'hidden'
  },
  header: {
    padding: '1rem 1.2rem',
    borderBottom: '1px solid #eee'
  },
  nombreHeader: {
    margin: 0,
    color: '#1a1a2e',
    fontSize: '1.1rem'
  },
  propiedadHeader: {
    margin: '0.2rem 0 0 0',
    color: '#e94560',
    fontSize: '0.8rem',
    fontWeight: 'bold'
  },
  hilo: {
    flex: 1,
    overflowY: 'auto',
    padding: '1rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.6rem'
  },
  sinMensajes: {
    textAlign: 'center',
    color: '#888',
    fontSize: '0.9rem',
    marginTop: '2rem'
  },
  burbuja: {
    maxWidth: '75%',
    padding: '0.6rem 0.9rem',
    borderRadius: '12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.2rem'
  },
  burbujaPropia: {
    backgroundColor: '#e94560',
    color: 'white',
    alignSelf: 'flex-end',
    borderBottomRightRadius: '2px'
  },
  burbujaAjena: {
    backgroundColor: '#f0f0f0',
    color: '#1a1a2e',
    alignSelf: 'flex-start',
    borderBottomLeftRadius: '2px'
  },
  textoBurbuja: {
    margin: 0,
    fontSize: '0.9rem',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word'
  },
  horaBurbuja: {
    fontSize: '0.7rem',
    opacity: 0.7,
    alignSelf: 'flex-end'
  },
  formEnvio: {
    display: 'flex',
    gap: '0.6rem',
    padding: '1rem',
    borderTop: '1px solid #eee'
  },
  inputMensaje: {
    flex: 1,
    padding: '0.7rem 1rem',
    borderRadius: '20px',
    border: '1px solid #ddd',
    fontSize: '0.95rem',
    outline: 'none'
  },
  botonEnviar: {
    padding: '0.7rem 1.4rem',
    backgroundColor: '#1a1a2e',
    color: 'white',
    border: 'none',
    borderRadius: '20px',
    fontWeight: 'bold',
    cursor: 'pointer',
    fontSize: '0.9rem'
  },
  mensajeCarga: {
    padding: '2rem',
    textAlign: 'center',
    color: '#888'
  }
}

export default ChatConversacion