import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { adminResumen, adminLiquidar, adminActualizarConfig } from '../services/api'
import { formatoL } from '../utils/comisiones'

function AdminPlataforma() {
  const { usuario } = useAuth()

  const [datos, setDatos] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  const [mensaje, setMensaje] = useState(null)

  const [pctProp, setPctProp] = useState('')
  const [pctInq, setPctInq] = useState('')
  const [guardandoConfig, setGuardandoConfig] = useState(false)

  const [aLiquidar, setALiquidar] = useState(null)
  const [liquidando, setLiquidando] = useState(false)

  const cargar = async () => {
    try {
      const res = await adminResumen()
      setDatos(res.data)
      setPctProp(String(res.data.config?.pct_propietario ?? ''))
      setPctInq(String(res.data.config?.pct_inquilino ?? ''))
      setError(null)
    } catch (e) {
      setError(e.response?.data?.error || 'No se pudo cargar el panel de la plataforma')
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    if (usuario?.es_admin) cargar()
    else setCargando(false)
  }, [usuario])

  const avisar = (texto) => {
    setMensaje(texto)
    setTimeout(() => setMensaje(null), 4000)
  }

  const handleGuardarConfig = async () => {
    setError(null)
    setGuardandoConfig(true)
    try {
      await adminActualizarConfig({
        pct_propietario: Number(pctProp),
        pct_inquilino: Number(pctInq)
      })
      avisar('Porcentajes actualizados. Se aplican a los pagos nuevos.')
      cargar()
    } catch (e) {
      setError(e.response?.data?.error || 'No se pudieron guardar los porcentajes')
    } finally {
      setGuardandoConfig(false)
    }
  }

  const handleLiquidar = async () => {
    setLiquidando(true)
    setError(null)
    try {
      const res = await adminLiquidar(aLiquidar.id_propietario)
      setALiquidar(null)
      avisar(`${res.data.liquidados} pago(s) marcados como liquidados`)
      cargar()
    } catch (e) {
      setError(e.response?.data?.error || 'No se pudo liquidar')
    } finally {
      setLiquidando(false)
    }
  }

  if (!usuario?.es_admin) {
    return <p style={styles.estado}>Esta sección es solo para el administrador de la plataforma.</p>
  }
  if (cargando) return <p style={styles.estado}>Cargando panel de la plataforma...</p>
  if (!datos) return <p style={styles.estado}>{error || 'Sin datos'}</p>

  const { resumen, propietarios, pagos_recientes } = datos

  return (
    <div style={styles.container}>
      <h2 style={styles.titulo}>Administración de la plataforma</h2>

      {mensaje && <p style={styles.exito}>✅ {mensaje}</p>}
      {error && <p style={styles.error}>{error}</p>}

      <div style={styles.stats}>
        <div style={styles.statCard}>
          <span style={styles.statLabel}>Comisiones generadas</span>
          <span style={styles.statNumero}>L. {formatoL(resumen.comisiones_generadas)}</span>
          <span style={styles.statDetalle}>
            Inquilinos L. {formatoL(resumen.comisiones_inquilinos)} · Propietarios L. {formatoL(resumen.comisiones_propietarios)}
          </span>
        </div>
        <div style={styles.statCard}>
          <span style={styles.statLabel}>Por cobrar a propietarios</span>
          <span style={styles.statNumero}>L. {formatoL(resumen.por_cobrar_a_propietarios)}</span>
          <span style={styles.statDetalle}>Comisiones de pagos en transferencia y efectivo</span>
        </div>
        <div style={styles.statCard}>
          <span style={styles.statLabel}>Por pagar a propietarios</span>
          <span style={styles.statNumero}>L. {formatoL(resumen.por_pagar_a_propietarios)}</span>
          <span style={styles.statDetalle}>Pagos con tarjeta que la plataforma recibió</span>
        </div>
      </div>

      <div style={styles.card}>
        <h3 style={styles.seccion}>Porcentajes de comisión</h3>
        <div style={styles.filaConfig}>
          <div style={styles.campo}>
            <label style={styles.label}>Al propietario (%)</label>
            <input type="number" min="0" max="30" step="0.5" value={pctProp}
              onChange={(e) => setPctProp(e.target.value)} style={styles.input} />
          </div>
          <div style={styles.campo}>
            <label style={styles.label}>Cargo de servicio al inquilino (%)</label>
            <input type="number" min="0" max="30" step="0.5" value={pctInq}
              onChange={(e) => setPctInq(e.target.value)} style={styles.input} />
          </div>
          <button className="btn btn-primario" onClick={handleGuardarConfig} disabled={guardandoConfig}>
            {guardandoConfig ? 'Guardando...' : 'Guardar porcentajes'}
          </button>
        </div>
        <p style={styles.ayuda}>
          Solo afecta a los pagos que se registren desde ahora; los pagos anteriores conservan la comisión con la que se hicieron.
        </p>
      </div>

      <div style={styles.card}>
        <h3 style={styles.seccion}>Saldos por propietario</h3>
        {propietarios.length === 0 ? (
          <p style={styles.ayuda}>No hay saldos pendientes de liquidar.</p>
        ) : (
          <div style={styles.scroll}>
            <table style={styles.tabla}>
              <thead>
                <tr>
                  <th style={styles.th}>Propietario</th>
                  <th style={styles.th}>Debe a RentaFácil</th>
                  <th style={styles.th}>RentaFácil le debe</th>
                  <th style={styles.th}>Saldo</th>
                  <th style={styles.th}>Pagos</th>
                  <th style={styles.th}></th>
                </tr>
              </thead>
              <tbody>
                {propietarios.map(o => (
                  <tr key={o.id_propietario}>
                    <td style={styles.td}>
                      <strong>{o.propietario}</strong><br />
                      <span style={styles.pequeno}>{o.email} {o.telefono && `· ${o.telefono}`}</span>
                    </td>
                    <td style={styles.td}>L. {formatoL(o.por_cobrar)}</td>
                    <td style={styles.td}>L. {formatoL(o.por_pagar)}</td>
                    <td style={styles.td}>
                      {o.balance > 0 && <span style={styles.saldoPaga}>Pagarle L. {formatoL(o.balance)}</span>}
                      {o.balance < 0 && <span style={styles.saldoCobra}>Cobrarle L. {formatoL(Math.abs(o.balance))}</span>}
                      {o.balance === 0 && <span>Compensado</span>}
                    </td>
                    <td style={styles.td}>{o.pagos}</td>
                    <td style={styles.td}>
                      <button className="btn btn-exito btn-sm" onClick={() => setALiquidar(o)}>
                        Marcar liquidado
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div style={styles.card}>
        <h3 style={styles.seccion}>Pagos recientes con comisión</h3>
        {pagos_recientes.length === 0 ? (
          <p style={styles.ayuda}>Todavía no hay pagos con comisión.</p>
        ) : (
          <div style={styles.scroll}>
            <table style={styles.tabla}>
              <thead>
                <tr>
                  <th style={styles.th}>Pago</th>
                  <th style={styles.th}>Fecha</th>
                  <th style={styles.th}>Propiedad</th>
                  <th style={styles.th}>Propietario</th>
                  <th style={styles.th}>Inquilino</th>
                  <th style={styles.th}>Método</th>
                  <th style={styles.th}>Monto</th>
                  <th style={styles.th}>Com. inquilino</th>
                  <th style={styles.th}>Com. propietario</th>
                  <th style={styles.th}>Liquidación</th>
                </tr>
              </thead>
              <tbody>
                {pagos_recientes.map(p => (
                  <tr key={p.id_pago}>
                    <td style={styles.td}>#{p.id_pago}</td>
                    <td style={styles.td}>{p.fecha_pago}</td>
                    <td style={styles.td}>{p.propiedad}</td>
                    <td style={styles.td}>{p.propietario}</td>
                    <td style={styles.td}>{p.inquilino}</td>
                    <td style={styles.td}>{p.metodo_pago}</td>
                    <td style={styles.td}>L. {formatoL(p.monto)}</td>
                    <td style={styles.td}>L. {formatoL(p.comision_inquilino)}</td>
                    <td style={styles.td}>L. {formatoL(p.comision_propietario)}</td>
                    <td style={styles.td}>
                      <span style={{ ...styles.badge, backgroundColor: p.liquidado ? '#28a745' : '#ffc107', color: p.liquidado ? 'white' : '#4a3a00' }}>
                        {p.liquidado ? 'liquidado' : 'pendiente'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {aLiquidar && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <h3 style={{ marginTop: 0, color: '#1a1a2e' }}>Marcar como liquidado</h3>
            <p style={{ color: '#555', lineHeight: 1.5 }}>
              Se marcarán como liquidados los <strong>{aLiquidar.pagos}</strong> pago(s) pendientes de <strong>{aLiquidar.propietario}</strong>.
            </p>
            <p style={{ ...styles.recuadro }}>
              {aLiquidar.balance > 0 && <>Confirma que <strong>ya le pagaste L. {formatoL(aLiquidar.balance)}</strong> (pagos con tarjeta menos las comisiones que debía).</>}
              {aLiquidar.balance < 0 && <>Confirma que <strong>ya recibiste L. {formatoL(Math.abs(aLiquidar.balance))}</strong> en comisiones de este propietario.</>}
              {aLiquidar.balance === 0 && <>Los montos que se deben mutuamente se compensan; no hay dinero que mover.</>}
            </p>
            <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'flex-end', marginTop: '1.2rem' }}>
              <button className="btn btn-suave" onClick={() => setALiquidar(null)} disabled={liquidando}>Cancelar</button>
              <button className="btn btn-exito" onClick={handleLiquidar} disabled={liquidando}>
                {liquidando ? 'Guardando...' : 'Sí, ya está liquidado'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const styles = {
  container: { maxWidth: '1100px', margin: '0 auto', padding: '2rem 1rem', fontFamily: 'sans-serif' },
  titulo: { fontSize: '1.8rem', color: '#1a1a2e', marginBottom: '1.2rem' },
  estado: { textAlign: 'center', padding: '3rem 1rem', color: '#888' },
  stats: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '1.2rem' },
  statCard: { backgroundColor: 'white', borderRadius: '8px', padding: '1.2rem', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', gap: '0.3rem' },
  statLabel: { fontSize: '0.85rem', color: '#777', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' },
  statNumero: { fontSize: '1.6rem', fontWeight: 'bold', color: '#1a1a2e' },
  statDetalle: { fontSize: '0.8rem', color: '#888' },
  card: { backgroundColor: 'white', borderRadius: '8px', padding: '1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', marginBottom: '1.2rem' },
  seccion: { margin: '0 0 1rem', color: '#1a1a2e', fontSize: '1.1rem' },
  filaConfig: { display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' },
  campo: { display: 'flex', flexDirection: 'column', gap: '0.4rem' },
  label: { fontSize: '0.9rem', color: '#555', fontWeight: 'bold' },
  input: { padding: '0.6rem 0.8rem', borderRadius: '4px', border: '1px solid #ddd', fontSize: '1rem', width: '190px' },
  ayuda: { fontSize: '0.85rem', color: '#888', margin: '0.8rem 0 0' },
  scroll: { overflowX: 'auto' },
  tabla: { width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' },
  th: { textAlign: 'left', padding: '0.6rem', borderBottom: '2px solid #eee', color: '#555', whiteSpace: 'nowrap' },
  td: { padding: '0.6rem', borderBottom: '1px solid #f0f0f0', verticalAlign: 'top' },
  pequeno: { fontSize: '0.8rem', color: '#888' },
  saldoPaga: { color: '#1f7a35', fontWeight: 'bold' },
  saldoCobra: { color: '#c0392b', fontWeight: 'bold' },
  badge: { padding: '0.15rem 0.6rem', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 'bold' },
  exito: { backgroundColor: '#e6f6ea', color: '#1f7a35', padding: '0.8rem', borderRadius: '4px', fontSize: '0.9rem', margin: '0 0 1rem' },
  error: { backgroundColor: '#ffe0e0', color: '#c0392b', padding: '0.8rem', borderRadius: '4px', fontSize: '0.9rem', margin: '0 0 1rem' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modal: { backgroundColor: 'white', borderRadius: '8px', padding: '2rem', width: '90%', maxWidth: '480px', boxShadow: '0 4px 20px rgba(0,0,0,0.3)' },
  recuadro: { backgroundColor: '#f7f7fa', border: '1px solid #e2e2ea', borderRadius: '4px', padding: '0.8rem', color: '#333', lineHeight: 1.5, fontSize: '0.9rem' }
}

export default AdminPlataforma