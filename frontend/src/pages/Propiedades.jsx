import { useEffect, useMemo, useState } from 'react'
import { getPropiedades } from '../services/api'
import PropiedadCard from '../components/PropiedadCard'
import MapaPropiedades from '../components/MapaPropiedades'

function Propiedades() {
  const [propiedades, setPropiedades] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [vista, setVista] = useState('lista') // 'lista' | 'mapa'

  const [busqueda, setBusqueda] = useState('')
  const [filtroTipo, setFiltroTipo] = useState('todos')
  const [filtroDepartamento, setFiltroDepartamento] = useState('todos')
  const [precioMax, setPrecioMax] = useState('')
  const [habitacionesMin, setHabitacionesMin] = useState('todos')

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

  const departamentosDisponibles = useMemo(() => {
    const unicos = new Set(
      propiedades.map(p => p.UBICACIONES?.departamento).filter(Boolean)
    )
    return Array.from(unicos).sort()
  }, [propiedades])

  const propiedadesFiltradas = useMemo(() => {
    const texto = busqueda.trim().toLowerCase()

    return propiedades.filter(p => {
      if (texto) {
        const campoBusqueda = [
          p.titulo,
          p.descripcion,
          p.UBICACIONES?.direccion,
          p.UBICACIONES?.municipio,
          p.UBICACIONES?.departamento
        ].filter(Boolean).join(' ').toLowerCase()

        if (!campoBusqueda.includes(texto)) return false
      }

      if (filtroTipo !== 'todos' && p.tipo !== filtroTipo) return false

      if (filtroDepartamento !== 'todos' && p.UBICACIONES?.departamento !== filtroDepartamento) return false

      if (precioMax && parseFloat(p.precio_mensual) > parseFloat(precioMax)) return false

      if (habitacionesMin !== 'todos' && p.habitaciones < parseInt(habitacionesMin)) return false

      return true
    })
  }, [propiedades, busqueda, filtroTipo, filtroDepartamento, precioMax, habitacionesMin])

  const handleLimpiarFiltros = () => {
    setBusqueda('')
    setFiltroTipo('todos')
    setFiltroDepartamento('todos')
    setPrecioMax('')
    setHabitacionesMin('todos')
  }

  const hayFiltrosActivos = busqueda || filtroTipo !== 'todos' || filtroDepartamento !== 'todos' || precioMax || habitacionesMin !== 'todos'

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

      {/* Búsqueda y filtros */}
      <div style={styles.panelFiltros}>
        <input
          type="text"
          placeholder="🔍 Buscar por título, dirección, municipio..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          style={styles.inputBusqueda}
        />

        <div style={styles.filaFiltros}>
          <select value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)} style={styles.selectFiltro}>
            <option value="todos">Todos los tipos</option>
            <option value="apartamento">Apartamento</option>
            <option value="casa">Casa</option>
            <option value="local">Local comercial</option>
            <option value="cuarto">Cuarto</option>
          </select>

          <select value={filtroDepartamento} onChange={(e) => setFiltroDepartamento(e.target.value)} style={styles.selectFiltro}>
            <option value="todos">Todos los departamentos</option>
            {departamentosDisponibles.map(dep => (
              <option key={dep} value={dep}>{dep}</option>
            ))}
          </select>

          <select value={habitacionesMin} onChange={(e) => setHabitacionesMin(e.target.value)} style={styles.selectFiltro}>
            <option value="todos">Cualquier # de habitaciones</option>
            <option value="1">1+ habitación</option>
            <option value="2">2+ habitaciones</option>
            <option value="3">3+ habitaciones</option>
            <option value="4">4+ habitaciones</option>
          </select>

          <input
            type="number"
            placeholder="Precio máx. (L.)"
            value={precioMax}
            onChange={(e) => setPrecioMax(e.target.value)}
            style={styles.selectFiltro}
          />

          {hayFiltrosActivos && (
            <button onClick={handleLimpiarFiltros} style={styles.botonLimpiar}>
              ✕ Limpiar filtros
            </button>
          )}
        </div>

        <p style={styles.contadorResultados}>
          {propiedadesFiltradas.length} de {propiedades.length} propiedades
        </p>
      </div>

      {propiedadesFiltradas.length === 0 ? (
        <p style={styles.mensaje}>
          {propiedades.length === 0
            ? 'No hay propiedades registradas aún.'
            : 'Ninguna propiedad coincide con tu búsqueda. Intenta ajustar los filtros.'}
        </p>
      ) : vista === 'lista' ? (
        <div style={styles.grid}>
          {propiedadesFiltradas.map(p => (
            <PropiedadCard key={p.id_propiedad} propiedad={p} />
          ))}
        </div>
      ) : (
        <MapaPropiedades propiedades={propiedadesFiltradas} />
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
  panelFiltros: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '1.2rem',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    marginBottom: '1.5rem'
  },
  inputBusqueda: {
    width: '100%',
    padding: '0.7rem 1rem',
    borderRadius: '6px',
    border: '1px solid #ddd',
    fontSize: '0.95rem',
    marginBottom: '0.8rem',
    boxSizing: 'border-box'
  },
  filaFiltros: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.6rem',
    alignItems: 'center'
  },
  selectFiltro: {
    padding: '0.5rem 0.7rem',
    borderRadius: '6px',
    border: '1px solid #ddd',
    fontSize: '0.85rem',
    flex: '1 1 160px'
  },
  botonLimpiar: {
    padding: '0.5rem 0.8rem',
    backgroundColor: 'transparent',
    color: '#e94560',
    border: '1px solid #e94560',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.85rem',
    fontWeight: 'bold'
  },
  contadorResultados: {
    marginTop: '0.8rem',
    marginBottom: 0,
    fontSize: '0.8rem',
    color: '#888'
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