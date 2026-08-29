import { useState } from 'react'

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
]
const DIAS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

// Estados de reserva que bloquean el calendario (ocupan fechas)
const ESTADOS_OCUPADOS = ['pendiente', 'aprobada']

function fechaEnRango(fecha, inicio, fin) {
  const f = new Date(fecha).setHours(0, 0, 0, 0)
  const i = new Date(inicio).setHours(0, 0, 0, 0)
  const fn = new Date(fin).setHours(0, 0, 0, 0)
  return f >= i && f <= fn
}

function CalendarioDisponibilidad({ reservas }) {
  const [mesActual, setMesActual] = useState(new Date())

  const reservasOcupadas = reservas.filter(r => ESTADOS_OCUPADOS.includes(r.estado))

  const year = mesActual.getFullYear()
  const month = mesActual.getMonth()
  const primerDiaSemana = new Date(year, month, 1).getDay()
  const diasEnMes = new Date(year, month + 1, 0).getDate()
  const hoy = new Date().setHours(0, 0, 0, 0)

  const celdas = []
  for (let i = 0; i < primerDiaSemana; i++) celdas.push(null)
  for (let dia = 1; dia <= diasEnMes; dia++) celdas.push(dia)

  const estadoDelDia = (dia) => {
    const fecha = new Date(year, month, dia)
    if (fecha.setHours(0, 0, 0, 0) < hoy) return 'pasado'
    const ocupado = reservasOcupadas.some(r => fechaEnRango(fecha, r.fecha_inicio, r.fecha_fin))
    return ocupado ? 'ocupado' : 'disponible'
  }

  const cambiarMes = (delta) => {
    setMesActual(new Date(year, month + delta, 1))
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button onClick={() => cambiarMes(-1)} style={styles.botonNav}>←</button>
        <span style={styles.tituloMes}>{MESES[month]} {year}</span>
        <button onClick={() => cambiarMes(1)} style={styles.botonNav}>→</button>
      </div>

      <div style={styles.gridDias}>
        {DIAS.map(d => (
          <div key={d} style={styles.diaSemana}>{d}</div>
        ))}
        {celdas.map((dia, index) => {
          if (dia === null) return <div key={`vacio-${index}`} style={styles.celdaVacia} />
          const estado = estadoDelDia(dia)
          return (
            <div
              key={dia}
              style={{
                ...styles.celda,
                ...(estado === 'ocupado' ? styles.ocupado : {}),
                ...(estado === 'pasado' ? styles.pasado : {}),
                ...(estado === 'disponible' ? styles.disponible : {})
              }}
            >
              {dia}
            </div>
          )
        })}
      </div>

      <div style={styles.leyenda}>
        <span style={styles.leyendaItem}><span style={{ ...styles.puntoLeyenda, backgroundColor: '#28a745' }} /> Disponible</span>
        <span style={styles.leyendaItem}><span style={{ ...styles.puntoLeyenda, backgroundColor: '#e94560' }} /> Ocupado / reservado</span>
      </div>
    </div>
  )
}

const styles = {
  container: {
    backgroundColor: '#f9f9f9',
    borderRadius: '8px',
    padding: '1.2rem',
    border: '1px solid #eee'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1rem'
  },
  tituloMes: {
    fontWeight: 'bold',
    color: '#1a1a2e',
    fontSize: '1rem'
  },
  botonNav: {
    backgroundColor: '#1a1a2e',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    padding: '0.3rem 0.7rem',
    cursor: 'pointer',
    fontSize: '0.9rem'
  },
  gridDias: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    gap: '0.3rem'
  },
  diaSemana: {
    textAlign: 'center',
    fontSize: '0.75rem',
    color: '#888',
    fontWeight: 'bold',
    paddingBottom: '0.3rem'
  },
  celdaVacia: {},
  celda: {
    textAlign: 'center',
    padding: '0.5rem 0',
    borderRadius: '4px',
    fontSize: '0.85rem'
  },
  disponible: {
    backgroundColor: '#e0ffe0',
    color: '#28a745'
  },
  ocupado: {
    backgroundColor: '#ffe0e0',
    color: '#e94560',
    fontWeight: 'bold'
  },
  pasado: {
    backgroundColor: 'transparent',
    color: '#ccc'
  },
  leyenda: {
    display: 'flex',
    gap: '1.2rem',
    marginTop: '1rem',
    flexWrap: 'wrap'
  },
  leyendaItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
    fontSize: '0.8rem',
    color: '#555'
  },
  puntoLeyenda: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    display: 'inline-block'
  }
}

export default CalendarioDisponibilidad