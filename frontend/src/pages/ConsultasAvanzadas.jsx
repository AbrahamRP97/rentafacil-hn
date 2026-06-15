import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { getConsultasAvanzadas, runConsultaAvanzada } from '../services/api'

function ConsultasAvanzadas() {
  const [consultas, setConsultas] = useState([])
  const [consultaSeleccionada, setConsultaSeleccionada] = useState('')
  const [resultado, setResultado] = useState(null)
  const [loading, setLoading] = useState(true)
  const [ejecutando, setEjecutando] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    getConsultasAvanzadas()
      .then((res) => {
        setConsultas(res.data)
        if (res.data.length > 0) setConsultaSeleccionada(res.data[0].id)
      })
      .catch(() => setError('No se pudieron cargar las consultas avanzadas.'))
      .finally(() => setLoading(false))
  }, [])

  const columnas = useMemo(() => {
    if (!resultado?.data?.length) return []
    return Object.keys(resultado.data[0])
  }, [resultado])

  const ejecutarConsulta = async () => {
    if (!consultaSeleccionada) return

    setEjecutando(true)
    setError(null)
    setResultado(null)

    try {
      const res = await runConsultaAvanzada(consultaSeleccionada)
      setResultado(res.data)
    } catch {
      setError('No se pudo ejecutar la consulta seleccionada.')
    } finally {
      setEjecutando(false)
    }
  }

  if (loading) return <p style={styles.mensaje}>Cargando consultas...</p>

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h2 style={styles.titulo}>Consultas avanzadas</h2>
          <p style={styles.subtitulo}>Ejecuta reportes de reservas, pagos, propiedades y calificaciones.</p>
        </div>
        <Link to="/admin" style={styles.botonSecundario}>Volver al panel</Link>
      </div>

      {error && <p style={styles.error}>{error}</p>}

      <section style={styles.seccion}>
        <div style={styles.controles}>
          <label style={styles.label}>Consulta</label>
          <select
            value={consultaSeleccionada}
            onChange={(e) => setConsultaSeleccionada(e.target.value)}
            style={styles.select}
          >
            {consultas.map((consulta) => (
              <option key={consulta.id} value={consulta.id} style={styles.option}>
                {consulta.title}
              </option>
            ))}
          </select>
          <button onClick={ejecutarConsulta} disabled={ejecutando} style={styles.botonPrincipal}>
            {ejecutando ? 'Ejecutando...' : 'Ejecutar consulta'}
          </button>
        </div>
      </section>

      {resultado && (
        <section style={styles.seccion}>
          <div style={styles.resultadoHeader}>
            <h3 style={styles.seccionTitulo}>{resultado.titulo}</h3>
            <span style={styles.contador}>{resultado.data.length} registros</span>
          </div>

          {resultado.data.length === 0 ? (
            <p style={styles.mensaje}>La consulta no devolvio registros.</p>
          ) : (
            <div style={styles.tablaWrapper}>
              <table style={styles.tabla}>
                <thead>
                  <tr>
                    {columnas.map((columna) => (
                      <th key={columna} style={styles.th}>{columna}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {resultado.data.map((fila, index) => (
                    <tr key={index} style={styles.tr}>
                      {columnas.map((columna) => (
                        <td key={columna} style={styles.td}>{String(fila[columna] ?? '')}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </div>
  )
}

const styles = {
  container: {
    padding: '2rem',
    fontFamily: 'sans-serif',
    backgroundColor: '#f5f5f5',
    minHeight: '100vh'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '1rem',
    alignItems: 'center',
    marginBottom: '1.5rem'
  },
  titulo: {
    fontSize: '2rem',
    color: '#1a1a2e',
    margin: 0
  },
  subtitulo: {
    color: '#777',
    margin: '0.35rem 0 0'
  },
  seccion: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '1.5rem',
    marginBottom: '1.5rem',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
  },
  controles: {
    display: 'grid',
    gridTemplateColumns: '1fr auto',
    gap: '0.75rem',
    alignItems: 'end'
  },
  label: {
    gridColumn: '1 / -1',
    fontSize: '0.85rem',
    color: '#555',
    fontWeight: 'bold'
  },
  select: {
    padding: '0.7rem 0.8rem',
    borderRadius: '4px',
    border: '1px solid #ddd',
    fontSize: '0.95rem',
    backgroundColor: 'white',
    color: '#1a1a2e'
  },
  option: {
    backgroundColor: 'white',
    color: '#1a1a2e'
  },
  botonPrincipal: {
    padding: '0.75rem 1.2rem',
    backgroundColor: '#e94560',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '0.95rem'
  },
  botonSecundario: {
    padding: '0.65rem 1rem',
    backgroundColor: '#1a1a2e',
    color: 'white',
    borderRadius: '4px',
    textDecoration: 'none',
    fontWeight: 'bold',
    fontSize: '0.9rem'
  },
  resultadoHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '1rem',
    marginBottom: '1rem'
  },
  seccionTitulo: {
    margin: 0,
    color: '#1a1a2e',
    fontSize: '1.2rem'
  },
  contador: {
    backgroundColor: '#f0f0f0',
    color: '#555',
    borderRadius: '20px',
    padding: '0.35rem 0.75rem',
    fontSize: '0.8rem',
    fontWeight: 'bold'
  },
  tablaWrapper: {
    overflowX: 'auto'
  },
  tabla: {
    width: '100%',
    borderCollapse: 'collapse',
    minWidth: '760px'
  },
  th: {
    textAlign: 'left',
    padding: '0.75rem 1rem',
    backgroundColor: '#1a1a2e',
    color: 'white',
    fontSize: '0.82rem',
    whiteSpace: 'nowrap'
  },
  tr: {
    borderBottom: '1px solid #eee'
  },
  td: {
    padding: '0.75rem 1rem',
    fontSize: '0.9rem',
    color: '#333',
    whiteSpace: 'nowrap'
  },
  mensaje: {
    textAlign: 'center',
    color: '#888',
    padding: '2rem'
  },
  error: {
    backgroundColor: '#ffe0e0',
    color: '#e94560',
    padding: '0.8rem',
    borderRadius: '4px',
    textAlign: 'center',
    marginBottom: '1rem',
    fontSize: '0.9rem'
  }
}

export default ConsultasAvanzadas
