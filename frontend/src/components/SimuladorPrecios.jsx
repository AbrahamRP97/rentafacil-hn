import { useEffect, useState } from 'react'
import { simularPrecios } from '../services/api'

const ETIQUETAS = {
  1: '1 noche',
  2: '2 noches',
  3: '3 noches',
  7: '1 semana (7 noches)',
  14: '2 semanas (14 noches)',
  30: '1 mes (30 noches)'
}

const formatear = (n) =>
  Number(n).toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

// Muestra una tabla con lo que cobraría el propietario según la duración de la estadía.
function SimuladorPrecios({ precioMensual }) {
  const [filas, setFilas] = useState([])
  const [error, setError] = useState(null)
  const [cargando, setCargando] = useState(false)

  useEffect(() => {
    const precio = parseFloat(precioMensual)

    if (!precio || precio <= 0) {
      setFilas([])
      setError(null)
      setCargando(false)
      return
    }

    let cancelado = false
    setCargando(true)

    // Pequeña espera para no consultar en cada tecla mientras escribe
    const temporizador = setTimeout(() => {
      simularPrecios({ precio_mensual: precio })
        .then(res => {
          if (!cancelado) {
            setFilas(res.data)
            setError(null)
          }
        })
        .catch(() => {
          if (!cancelado) setError('No se pudo calcular la vista previa de precios')
        })
        .finally(() => {
          if (!cancelado) setCargando(false)
        })
    }, 400)

    return () => {
      cancelado = true
      clearTimeout(temporizador)
    }
  }, [precioMensual])

  if (!parseFloat(precioMensual) || parseFloat(precioMensual) <= 0) {
    return (
      <p style={styles.vacio}>
        Escribe la renta mensual para ver cuánto cobrarías por cada duración de estadía.
      </p>
    )
  }

  if (error) return <p style={styles.error}>{error}</p>

  return (
    <div style={styles.contenedor}>
      <table style={styles.tabla}>
        <thead>
          <tr>
            <th style={styles.th}>Duración</th>
            <th style={{ ...styles.th, textAlign: 'right' }}>Total</th>
            <th style={{ ...styles.th, textAlign: 'right' }}>Por noche</th>
          </tr>
        </thead>
        <tbody>
          {filas.map(f => (
            <tr key={f.noches} style={{ opacity: cargando ? 0.5 : 1 }}>
              <td style={styles.td}>{ETIQUETAS[f.noches] || `${f.noches} noches`}</td>
              <td style={{ ...styles.td, textAlign: 'right', fontWeight: 'bold' }}>L. {formatear(f.total)}</td>
              <td style={{ ...styles.td, textAlign: 'right', color: '#666' }}>L. {formatear(f.promedio_noche)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p style={styles.nota}>
        Estos son los precios que verá el inquilino. Las estadías cortas llevan un recargo; desde 28 noches
        se prorratea tu renta mensual.
      </p>
    </div>
  )
}

const styles = {
  contenedor: {
    marginBottom: '0.8rem'
  },
  tabla: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '0.85rem'
  },
  th: {
    textAlign: 'left',
    padding: '0.4rem 0.6rem',
    backgroundColor: '#f5f5f5',
    color: '#555',
    fontSize: '0.78rem'
  },
  td: {
    padding: '0.4rem 0.6rem',
    borderBottom: '1px solid #eee',
    color: '#333',
    textTransform: 'none'
  },
  nota: {
    margin: '0.5rem 0 0 0',
    fontSize: '0.75rem',
    color: '#888'
  },
  vacio: {
    margin: '0 0 0.8rem 0',
    fontSize: '0.82rem',
    color: '#888'
  },
  error: {
    margin: '0 0 0.8rem 0',
    fontSize: '0.82rem',
    color: '#e94560'
  }
}

export default SimuladorPrecios