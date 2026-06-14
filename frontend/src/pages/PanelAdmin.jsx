import { useEffect, useState } from 'react'
import { getPropiedades, getPropietarios, getInquilinos, getContratos, getPagos } from '../services/api'

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

  useEffect(() => {
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
  }, [])

  if (loading) return <p style={styles.mensaje}>Cargando panel...</p>

  return (
    <div style={styles.container}>
      <h2 style={styles.titulo}>Panel de Administración</h2>
      <p style={styles.subtitulo}>Bienvenido, anfitrión. Aquí puedes gestionar todo tu sistema.</p>

      {/* Tarjetas de estadísticas */}
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

      {/* Tabla de propiedades */}
      <div style={styles.seccion}>
        <h3 style={styles.seccionTitulo}>Propiedades registradas</h3>
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
  statIcono: {
    fontSize: '2rem'
  },
  statNumero: {
    fontSize: '2rem',
    fontWeight: 'bold',
    color: '#1a1a2e'
  },
  statLabel: {
    fontSize: '0.85rem',
    color: '#888',
    textAlign: 'center'
  },
  seccion: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '1.5rem',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
  },
  seccionTitulo: {
    fontSize: '1.2rem',
    color: '#1a1a2e',
    marginBottom: '1rem'
  },
  tabla: {
    width: '100%',
    borderCollapse: 'collapse'
  },
  th: {
    textAlign: 'left',
    padding: '0.75rem 1rem',
    backgroundColor: '#1a1a2e',
    color: 'white',
    fontSize: '0.85rem'
  },
  tr: {
    borderBottom: '1px solid #eee'
  },
  td: {
    padding: '0.75rem 1rem',
    fontSize: '0.9rem',
    color: '#333',
    textTransform: 'capitalize'
  },
  badge: {
    padding: '0.3rem 0.7rem',
    borderRadius: '20px',
    color: 'white',
    fontSize: '0.75rem',
    fontWeight: 'bold'
  },
  mensaje: {
    textAlign: 'center',
    color: '#888',
    padding: '2rem'
  }
}

export default PanelAdmin