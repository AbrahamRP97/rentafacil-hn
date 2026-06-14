import { useEffect, useState } from 'react'
import { getPropiedades, getPropietarios, getInquilinos, getContratos, getPagos, createPropiedad } from '../services/api'

function PanelAdmin() {
  const [stats, setStats] = useState({
    propiedades: 0,
    propietarios: 0,
    inquilinos: 0,
    contratos: 0,
    pagos: 0
  })
  const [propiedades, setPropiedades] = useState([])
  const [loading, setLoading] = useState(true)
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [exito, setExito] = useState(false)
  const [error, setError] = useState(null)
  const [form, setForm] = useState({
    titulo: '',
    descripcion: '',
    precio_mensual: '',
    habitaciones: '',
    banos: '',
    metros_cuadrados: '',
    tipo: 'apartamento',
    estado: 'disponible',
    id_propietario: '',
    id_ubicacion: ''
  })

  const cargarDatos = () => {
    Promise.all([
      getPropiedades(),
      getPropietarios(),
      getInquilinos(),
      getContratos(),
      getPagos()
    ]).then(([p, pr, i, c, pa]) => {
      setStats({
        propiedades: p.data.length,
        propietarios: pr.data.length,
        inquilinos: i.data.length,
        contratos: c.data.length,
        pagos: pa.data.length
      })
      setPropiedades(p.data)
      setLoading(false)
    }).catch(() => setLoading(false))
  }

  useEffect(() => {
    cargarDatos()
  }, [])

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    if (!form.titulo || !form.precio_mensual || !form.id_propietario || !form.id_ubicacion) {
      setError('Por favor completa todos los campos obligatorios')
      return
    }

    try {
      await createPropiedad({
        ...form,
        precio_mensual:   parseFloat(form.precio_mensual),
        habitaciones:     parseInt(form.habitaciones),
        banos:            parseInt(form.banos),
        metros_cuadrados: parseFloat(form.metros_cuadrados),
        id_propietario:   parseInt(form.id_propietario),
        id_ubicacion:     parseInt(form.id_ubicacion)
      })
      setExito(true)
      setMostrarFormulario(false)
      setForm({
        titulo: '', descripcion: '', precio_mensual: '',
        habitaciones: '', banos: '', metros_cuadrados: '',
        tipo: 'apartamento', estado: 'disponible',
        id_propietario: '', id_ubicacion: ''
      })
      cargarDatos()
      setTimeout(() => setExito(false), 3000)
    } catch (err) {
      setError('Error al crear la propiedad. Verifica los datos e intenta de nuevo.')
    }
  }

  if (loading) return <p style={styles.mensaje}>Cargando panel...</p>

  return (
    <div style={styles.container}>
      <h2 style={styles.titulo}>Panel de Administración</h2>
      <p style={styles.subtitulo}>Bienvenido, anfitrión. Aquí puedes gestionar todo tu sistema.</p>

      {/* Estadísticas */}
      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <span style={styles.statIcono}>🏠</span>
          <span style={styles.statNumero}>{stats.propiedades}</span>
          <span style={styles.statLabel}>Propiedades</span>
        </div>
        <div style={styles.statCard}>
          <span style={styles.statIcono}>👤</span>
          <span style={styles.statNumero}>{stats.propietarios}</span>
          <span style={styles.statLabel}>Propietarios</span>
        </div>
        <div style={styles.statCard}>
          <span style={styles.statIcono}>🧑‍🤝‍🧑</span>
          <span style={styles.statNumero}>{stats.inquilinos}</span>
          <span style={styles.statLabel}>Inquilinos</span>
        </div>
        <div style={styles.statCard}>
          <span style={styles.statIcono}>📄</span>
          <span style={styles.statNumero}>{stats.contratos}</span>
          <span style={styles.statLabel}>Contratos</span>
        </div>
        <div style={styles.statCard}>
          <span style={styles.statIcono}>💰</span>
          <span style={styles.statNumero}>{stats.pagos}</span>
          <span style={styles.statLabel}>Pagos</span>
        </div>
      </div>

      {/* Mensajes */}
      {exito && <p style={styles.exito}>✅ Propiedad creada exitosamente</p>}
      {error && <p style={styles.error}>{error}</p>}

      {/* Botón agregar propiedad */}
      <div style={styles.seccion}>
        <div style={styles.seccionHeader}>
          <h3 style={styles.seccionTitulo}>Propiedades registradas</h3>
          <button
            onClick={() => { setMostrarFormulario(!mostrarFormulario); setError(null) }}
            style={styles.botonAgregar}
          >
            {mostrarFormulario ? '✕ Cancelar' : '+ Agregar propiedad'}
          </button>
        </div>

        {/* Formulario */}
        {mostrarFormulario && (
          <div style={styles.formulario}>
            <h4 style={styles.formTitulo}>Nueva propiedad</h4>

            <div style={styles.fila}>
              <div style={styles.campo}>
                <label style={styles.label}>Título *</label>
                <input name="titulo" value={form.titulo} onChange={handleChange} placeholder="Apartamento en Tegucigalpa" style={styles.input} />
              </div>
              <div style={styles.campo}>
                <label style={styles.label}>Tipo *</label>
                <select name="tipo" value={form.tipo} onChange={handleChange} style={styles.input}>
                  <option value="apartamento">Apartamento</option>
                  <option value="casa">Casa</option>
                  <option value="local">Local comercial</option>
                  <option value="cuarto">Cuarto</option>
                </select>
              </div>
            </div>

            <div style={styles.campo}>
              <label style={styles.label}>Descripción</label>
              <textarea name="descripcion" value={form.descripcion} onChange={handleChange} placeholder="Descripción de la propiedad..." style={styles.textarea} />
            </div>

            <div style={styles.fila}>
              <div style={styles.campo}>
                <label style={styles.label}>Precio mensual (L.) *</label>
                <input type="number" name="precio_mensual" value={form.precio_mensual} onChange={handleChange} placeholder="5000" style={styles.input} />
              </div>
              <div style={styles.campo}>
                <label style={styles.label}>Estado *</label>
                <select name="estado" value={form.estado} onChange={handleChange} style={styles.input}>
                  <option value="disponible">Disponible</option>
                  <option value="alquilado">Alquilado</option>
                  <option value="reservado">Reservado</option>
                </select>
              </div>
            </div>

            <div style={styles.fila}>
              <div style={styles.campo}>
                <label style={styles.label}>Habitaciones</label>
                <input type="number" name="habitaciones" value={form.habitaciones} onChange={handleChange} placeholder="2" style={styles.input} />
              </div>
              <div style={styles.campo}>
                <label style={styles.label}>Baños</label>
                <input type="number" name="banos" value={form.banos} onChange={handleChange} placeholder="1" style={styles.input} />
              </div>
              <div style={styles.campo}>
                <label style={styles.label}>Metros cuadrados</label>
                <input type="number" name="metros_cuadrados" value={form.metros_cuadrados} onChange={handleChange} placeholder="75" style={styles.input} />
              </div>
            </div>

            <div style={styles.fila}>
              <div style={styles.campo}>
                <label style={styles.label}>ID Propietario *</label>
                <input type="number" name="id_propietario" value={form.id_propietario} onChange={handleChange} placeholder="1" style={styles.input} />
              </div>
              <div style={styles.campo}>
                <label style={styles.label}>ID Ubicación *</label>
                <input type="number" name="id_ubicacion" value={form.id_ubicacion} onChange={handleChange} placeholder="1" style={styles.input} />
              </div>
            </div>

            <button onClick={handleSubmit} style={styles.botonGuardar}>
              Guardar propiedad
            </button>
          </div>
        )}

        {/* Tabla */}
        {propiedades.length === 0 ? (
          <p style={styles.mensaje}>No hay propiedades registradas aún.</p>
        ) : (
          <table style={styles.tabla}>
            <thead>
              <tr>
                <th style={styles.th}>ID</th>
                <th style={styles.th}>Título</th>
                <th style={styles.th}>Tipo</th>
                <th style={styles.th}>Precio/mes</th>
                <th style={styles.th}>Estado</th>
                <th style={styles.th}>Habitaciones</th>
                <th style={styles.th}>Baños</th>
              </tr>
            </thead>
            <tbody>
              {propiedades.map(p => (
                <tr key={p.id_propiedad} style={styles.tr}>
                  <td style={styles.td}>{p.id_propiedad}</td>
                  <td style={styles.td}>{p.titulo}</td>
                  <td style={styles.td}>{p.tipo}</td>
                  <td style={styles.td}>L. {p.precio_mensual}</td>
                  <td style={styles.td}>
                    <span style={{
                      ...styles.badge,
                      backgroundColor:
                        p.estado === 'disponible' ? '#28a745' :
                        p.estado === 'alquilado'  ? '#e94560' : '#ffc107'
                    }}>
                      {p.estado}
                    </span>
                  </td>
                  <td style={styles.td}>{p.habitaciones}</td>
                  <td style={styles.td}>{p.banos}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
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
  titulo: {
    fontSize: '2rem',
    color: '#1a1a2e',
    marginBottom: '0.3rem'
  },
  subtitulo: {
    color: '#888',
    marginBottom: '2rem'
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
    gap: '1rem',
    marginBottom: '2.5rem'
  },
  statCard: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '1.5rem',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.5rem',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
  },
  statIcono: { fontSize: '2rem' },
  statNumero: { fontSize: '2rem', fontWeight: 'bold', color: '#1a1a2e' },
  statLabel: { fontSize: '0.85rem', color: '#888', textAlign: 'center' },
  seccion: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '1.5rem',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
  },
  seccionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1rem'
  },
  seccionTitulo: { fontSize: '1.2rem', color: '#1a1a2e', margin: 0 },
  botonAgregar: {
    padding: '0.5rem 1.2rem',
    backgroundColor: '#1a1a2e',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '0.9rem'
  },
  formulario: {
    backgroundColor: '#f9f9f9',
    borderRadius: '8px',
    padding: '1.5rem',
    marginBottom: '1.5rem',
    border: '1px solid #eee'
  },
  formTitulo: { color: '#1a1a2e', marginBottom: '1rem', marginTop: 0 },
  fila: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '1rem',
    marginBottom: '1rem'
  },
  campo: { display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '1rem' },
  label: { fontSize: '0.85rem', color: '#555', fontWeight: 'bold' },
  input: {
    padding: '0.6rem 0.8rem',
    borderRadius: '4px',
    border: '1px solid #ddd',
    fontSize: '0.95rem',
    outline: 'none'
  },
  textarea: {
    padding: '0.6rem 0.8rem',
    borderRadius: '4px',
    border: '1px solid #ddd',
    fontSize: '0.95rem',
    outline: 'none',
    minHeight: '80px',
    resize: 'vertical'
  },
  botonGuardar: {
    padding: '0.7rem 1.5rem',
    backgroundColor: '#e94560',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '0.95rem',
    marginTop: '0.5rem'
  },
  tabla: { width: '100%', borderCollapse: 'collapse' },
  th: {
    textAlign: 'left',
    padding: '0.75rem 1rem',
    backgroundColor: '#1a1a2e',
    color: 'white',
    fontSize: '0.85rem'
  },
  tr: { borderBottom: '1px solid #eee' },
  td: { padding: '0.75rem 1rem', fontSize: '0.9rem', color: '#333', textTransform: 'capitalize' },
  badge: {
    padding: '0.3rem 0.7rem',
    borderRadius: '20px',
    color: 'white',
    fontSize: '0.75rem',
    fontWeight: 'bold'
  },
  exito: {
    backgroundColor: '#e0ffe0',
    color: '#28a745',
    padding: '0.8rem',
    borderRadius: '4px',
    textAlign: 'center',
    marginBottom: '1rem',
    fontSize: '0.9rem'
  },
  error: {
    backgroundColor: '#ffe0e0',
    color: '#e94560',
    padding: '0.8rem',
    borderRadius: '4px',
    textAlign: 'center',
    marginBottom: '1rem',
    fontSize: '0.9rem'
  },
  mensaje: { textAlign: 'center', color: '#888', padding: '2rem' }
}

export default PanelAdmin