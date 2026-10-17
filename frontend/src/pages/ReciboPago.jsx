import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getPagos, getContrato, getPropiedad, getInquilino } from '../services/api'
import { montoALetras } from '../utils/numeroAletras'

const formatoFecha = (valor) =>
  new Date(valor).toLocaleDateString('es-HN', { day: 'numeric', month: 'long', year: 'numeric' })

const formatoLempiras = (n) =>
  Number(n).toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const NOMBRE_METODO = {
  efectivo: 'Efectivo',
  transferencia: 'Transferencia bancaria',
  tarjeta: 'Tarjeta (pago en línea)'
}

function ReciboPago() {
  const { id_pago } = useParams()
  const { usuario } = useAuth()

  const [pago, setPago] = useState(null)
  const [contrato, setContrato] = useState(null)
  const [propiedad, setPropiedad] = useState(null)
  const [inquilino, setInquilino] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelado = false
    const cargar = async () => {
      try {
        const resPagos = await getPagos()
        const encontrado = resPagos.data.find(p => String(p.id_pago) === String(id_pago))
        if (!encontrado) throw new Error('no-encontrado')

        const resContrato = await getContrato(encontrado.id_contrato)
        const [resPropiedad, resInquilino] = await Promise.all([
          getPropiedad(resContrato.data.RESERVAS?.id_propiedad),
          getInquilino(resContrato.data.RESERVAS?.id_inquilino)
        ])
        if (cancelado) return
        setPago(encontrado)
        setContrato(resContrato.data)
        setPropiedad(resPropiedad.data)
        setInquilino(resInquilino.data)
      } catch {
        if (!cancelado) setError('No se pudo cargar el recibo')
      } finally {
        if (!cancelado) setLoading(false)
      }
    }
    cargar()
    return () => { cancelado = true }
  }, [id_pago])

  if (loading) return <p style={styles.mensaje}>Cargando recibo...</p>
  if (error || !pago) return <p style={styles.mensaje}>{error || 'Recibo no encontrado'}</p>

  const propietario = propiedad?.PROPIETARIOS
  const esElPropietario = propietario?.auth_user_id && propietario.auth_user_id === usuario?.id
  const esElInquilino = inquilino?.auth_user_id && inquilino.auth_user_id === usuario?.id

  if (!esElPropietario && !esElInquilino) {
    return <p style={styles.mensaje}>Solo el propietario y el inquilino de este pago pueden ver el recibo.</p>
  }

  if (pago.estado !== 'completado') {
    return (
      <p style={styles.mensaje}>
        {pago.estado === 'pendiente'
          ? 'Este pago está pendiente de confirmación del propietario. El recibo se genera cuando lo confirme.'
          : 'Este pago no fue confirmado, por eso no tiene recibo.'}
      </p>
    )
  }

  const numeroRecibo = `REC-${String(pago.id_pago).padStart(6, '0')}`
  const numeroContrato = `RF-${String(contrato.id_contrato).padStart(6, '0')}`
  const fechaRecibo = formatoFecha(pago.fecha_confirmacion || pago.fecha_pago)
  const esEfectivo = pago.metodo_pago === 'efectivo'
  const nombreInquilino = `${inquilino?.nombre || ''} ${inquilino?.apellido || ''}`.trim()
  const nombrePropietario = `${propietario?.nombre || ''} ${propietario?.apellido || ''}`.trim()

  return (
    <div style={styles.container}>
      <style>{`
        @media print {
          .no-imprimir { display: none !important; }
          .documento-recibo { box-shadow: none !important; border: 1px solid #999 !important; }
          body { background: white !important; }
        }
      `}</style>

      <div className="no-imprimir" style={styles.acciones}>
        <Link to={usuario?.rol === 'anfitrion' ? '/admin' : '/mis-reservas'} style={styles.volver}>← Volver</Link>
        <button onClick={() => window.print()} className="btn btn-secundario">
          🖨️ Descargar / Imprimir recibo (PDF)
        </button>
      </div>

      <div className="documento-recibo" style={styles.documento}>
        <div style={styles.encabezado}>
          <h1 style={styles.titulo}>RECIBO DE PAGO</h1>
          <p style={styles.numero}>N.° {numeroRecibo}</p>
          <p style={styles.subtitulo}>Emitido a través de la plataforma RentaFácil HN</p>
        </div>

        <div style={styles.montoCaja}>
          <span style={styles.montoEtiqueta}>Monto recibido</span>
          <span style={styles.monto}>L. {formatoLempiras(pago.monto)}</span>
          <span style={styles.montoLetras}>{montoALetras(pago.monto)}</span>
        </div>

        <table style={styles.tabla}>
          <tbody>
            <tr><td style={styles.etiqueta}>Fecha</td><td style={styles.valor}>{fechaRecibo}</td></tr>
            <tr>
              <td style={styles.etiqueta}>Recibido de</td>
              <td style={styles.valor}>{nombreInquilino} — DNI {inquilino?.dni || 'no registrado'}</td>
            </tr>
            <tr>
              <td style={styles.etiqueta}>Recibido por</td>
              <td style={styles.valor}>{nombrePropietario} — DNI {propietario?.dni || 'no registrado'}</td>
            </tr>
            <tr>
              <td style={styles.etiqueta}>Concepto</td>
              <td style={styles.valor}>
                Pago de arrendamiento de la propiedad «{propiedad?.titulo}», contrato N.° {numeroContrato}
                {' '}(del {formatoFecha(contrato.fecha_inicio)} al {formatoFecha(contrato.fecha_fin)})
              </td>
            </tr>
            <tr><td style={styles.etiqueta}>Método de pago</td><td style={styles.valor}>{NOMBRE_METODO[pago.metodo_pago] || pago.metodo_pago}</td></tr>
          </tbody>
        </table>

        <p style={styles.nota}>
          {esEfectivo
            ? `El propietario confirmó electrónicamente la recepción de este pago en efectivo el ${fechaRecibo}, a través de RentaFácil HN.`
            : 'Este pago fue registrado electrónicamente en RentaFácil HN.'}
        </p>

        <div style={styles.firmas}>
          <div style={styles.firma}>
            <div style={styles.lineaFirma} />
            <span>Firma de quien recibe</span>
          </div>
          <div style={styles.firma}>
            <div style={styles.lineaFirma} />
            <span>Firma de quien paga</span>
          </div>
        </div>
      </div>
    </div>
  )
}

const styles = {
  container: { padding: '2rem', fontFamily: "'Georgia', 'Times New Roman', serif", maxWidth: '760px', margin: '0 auto' },
  mensaje: { textAlign: 'center', padding: '3rem 1rem', color: '#888', fontFamily: 'sans-serif' },
  acciones: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', fontFamily: 'sans-serif' },
  volver: { color: '#1a1a2e', textDecoration: 'none', fontWeight: 'bold' },
  documento: { backgroundColor: 'white', borderRadius: '4px', padding: '2.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', border: '1px solid #ddd' },
  encabezado: { textAlign: 'center', borderBottom: '2px solid #1a1a2e', paddingBottom: '1rem', marginBottom: '1.5rem' },
  titulo: { fontSize: '1.5rem', color: '#1a1a2e', margin: '0 0 0.4rem', letterSpacing: '1px' },
  numero: { fontSize: '1rem', color: '#e94560', fontWeight: 'bold', margin: '0 0 0.2rem' },
  subtitulo: { fontSize: '0.85rem', color: '#777', margin: 0 },
  montoCaja: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.3rem',
    backgroundColor: '#f7f7fa', border: '1px solid #e2e2ea', borderRadius: '6px', padding: '1rem', marginBottom: '1.5rem'
  },
  montoEtiqueta: { fontSize: '0.8rem', color: '#777', textTransform: 'uppercase', letterSpacing: '1px' },
  monto: { fontSize: '2rem', fontWeight: 'bold', color: '#1a1a2e' },
  montoLetras: { fontSize: '0.95rem', color: '#444', fontStyle: 'italic', textAlign: 'center' },
  tabla: { width: '100%', borderCollapse: 'collapse', marginBottom: '1.2rem' },
  etiqueta: { padding: '0.6rem 0.8rem 0.6rem 0', width: '150px', color: '#555', fontWeight: 'bold', verticalAlign: 'top', fontSize: '0.95rem', borderBottom: '1px solid #eee' },
  valor: { padding: '0.6rem 0', color: '#222', fontSize: '0.95rem', borderBottom: '1px solid #eee' },
  nota: { fontSize: '0.85rem', color: '#555', lineHeight: 1.5, margin: '0 0 2.5rem' },
  firmas: { display: 'flex', justifyContent: 'space-between', gap: '3rem', marginTop: '1rem' },
  firma: { flex: 1, textAlign: 'center', fontSize: '0.85rem', color: '#555' },
  lineaFirma: { borderTop: '1px solid #333', marginBottom: '0.4rem' }
}

export default ReciboPago