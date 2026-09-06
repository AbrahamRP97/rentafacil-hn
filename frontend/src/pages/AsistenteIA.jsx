import { useRef, useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { consultarAsistente } from '../services/api'

const PREGUNTAS_FRECUENTES = [
  '¿Qué es la metodología Scrum?',
  '¿Cómo elaboro un cronograma de proyecto?',
  '¿Cómo identifico riesgos en un proyecto de software?',
  '¿Qué diferencia hay entre Scrum y Kanban?',
  '¿Cómo estimo el esfuerzo de las tareas?',
  '¿Qué es una retrospectiva de sprint?'
]

function AsistenteIA() {
  const [mensajes, setMensajes] = useState([
    {
      autor: 'asistente',
      texto: '¡Hola! Soy tu asistente de administración de proyectos de software. Pregúntame sobre Scrum, planificación, gestión de riesgos, cronogramas o buenas prácticas de gestión de proyectos.'
    }
  ])
  const [pregunta, setPregunta] = useState('')
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState(null)

  const finRef = useRef(null)

  useEffect(() => {
    finRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [mensajes])

  const enviarPregunta = async (texto) => {
    const preguntaFinal = texto.trim()
    if (!preguntaFinal) return

    setMensajes(prev => [...prev, { autor: 'usuario', texto: preguntaFinal }])
    setPregunta('')
    setCargando(true)
    setError(null)

    try {
      const res = await consultarAsistente(preguntaFinal)
      setMensajes(prev => [...prev, { autor: 'asistente', texto: res.data.respuesta }])
    } catch (err) {
      setError('No se pudo obtener respuesta del asistente. Intenta de nuevo.')
    } finally {
      setCargando(false)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    enviarPregunta(pregunta)
  }

  return (
    <div style={styles.container}>
      <Link to="/admin" style={styles.volver}>← Volver al Panel Admin</Link>

      <div style={styles.card}>
        <div style={styles.header}>
          <h2 style={styles.titulo}>🤖 Asistente de Administración de Proyectos</h2>
          <p style={styles.subtitulo}>Impulsado por Google Gemini</p>
        </div>

        <div style={styles.faqContainer}>
          {PREGUNTAS_FRECUENTES.map((p, i) => (
            <button key={i} onClick={() => enviarPregunta(p)} style={styles.botonFaq} disabled={cargando}>
              {p}
            </button>
          ))}
        </div>

        <div style={styles.hilo}>
          {mensajes.map((m, i) => (
            <div
              key={i}
              style={{
                ...styles.burbuja,
                ...(m.autor === 'usuario' ? styles.burbujaUsuario : styles.burbujaAsistente)
              }}
            >
              <p style={styles.textoBurbuja}>{m.texto}</p>
            </div>
          ))}
          {cargando && (
            <div style={{ ...styles.burbuja, ...styles.burbujaAsistente }}>
              <p style={styles.textoBurbuja}>Pensando...</p>
            </div>
          )}
          <div ref={finRef} />
        </div>

        {error && <p style={styles.error}>{error}</p>}

        <form onSubmit={handleSubmit} style={styles.formEnvio}>
          <input
            type="text"
            value={pregunta}
            onChange={(e) => setPregunta(e.target.value)}
            placeholder="Escribe tu pregunta sobre gestión de proyectos..."
            style={styles.inputPregunta}
            disabled={cargando}
          />
          <button type="submit" style={styles.botonEnviar} disabled={cargando || !pregunta.trim()}>
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
    maxWidth: '750px',
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
    height: '75vh',
    overflow: 'hidden'
  },
  header: {
    padding: '1rem 1.2rem',
    borderBottom: '1px solid #eee'
  },
  titulo: {
    margin: 0,
    color: '#1a1a2e',
    fontSize: '1.1rem'
  },
  subtitulo: {
    margin: '0.2rem 0 0 0',
    color: '#888',
    fontSize: '0.8rem'
  },
  faqContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.5rem',
    padding: '0.8rem 1.2rem',
    borderBottom: '1px solid #eee'
  },
  botonFaq: {
    padding: '0.4rem 0.8rem',
    backgroundColor: '#f0f0f0',
    border: 'none',
    borderRadius: '20px',
    fontSize: '0.78rem',
    color: '#333',
    cursor: 'pointer'
  },
  hilo: {
    flex: 1,
    overflowY: 'auto',
    padding: '1rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.6rem'
  },
  burbuja: {
    maxWidth: '80%',
    padding: '0.7rem 1rem',
    borderRadius: '12px'
  },
  burbujaUsuario: {
    backgroundColor: '#e94560',
    color: 'white',
    alignSelf: 'flex-end',
    borderBottomRightRadius: '2px'
  },
  burbujaAsistente: {
    backgroundColor: '#f0f0f0',
    color: '#1a1a2e',
    alignSelf: 'flex-start',
    borderBottomLeftRadius: '2px'
  },
  textoBurbuja: {
    margin: 0,
    fontSize: '0.9rem',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    lineHeight: 1.5
  },
  error: {
    backgroundColor: '#ffe0e0',
    color: '#e94560',
    padding: '0.6rem 1.2rem',
    fontSize: '0.85rem',
    margin: 0
  },
  formEnvio: {
    display: 'flex',
    gap: '0.6rem',
    padding: '1rem',
    borderTop: '1px solid #eee'
  },
  inputPregunta: {
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
  }
}

export default AsistenteIA