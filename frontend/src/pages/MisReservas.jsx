import { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getInquilinoPorAuth, getReservas, getContratos, getPagos,
  registrarPago, cancelarContrato, enviarMensaje,
  subirComprobante, crearSesionPago, verificarSesionPago } from '../services/api'

function MisReservas() {
  const { usuario } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()

  const [inquilinoActual, setInquilinoActual] = useState(null)
  const [reservas, setReservas] = useState([])
  const [contratos, setContratos] = useState([])
  const [pagos, setPagos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [exito, setExito] = useState(null)
  const [procesando, setProcesando] = useState(null)

  const [formPago, setFormPago] = useState({})
  const [archivoComprobante, setArchivoComprobante] = useState({})

  useEffect(() => {
    if (!usuario) return
    getInquilinoPorAuth(usuario.id)
      .then(res => setInquilinoActual(res.data))
      .catch(() => setInquilinoActual(null))
  }, [usuario])

  const cargarDatos = () => {
    Promise.all([getReservas(), getContratos(), getPagos()])
      .then(([r, c, p]) => {
        setReservas(r.data)
        setContratos(c.data)
        setPagos(p.data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }

  useEffect(() => {
    cargarDatos()
  }, [])

  // Si venimos de un pago con tarjeta exitoso (redirigido desde Stripe), lo confirmamos y registramos
  useEffect(() => {
    const pago = searchParams.get('pago')
    const sessionId = searchParams.get('session_id')
    const idContrato = searchParams.get('id_contrato')

    if (pago === 'exito' && sessionId && idContrato) {
      verificarSesionPago({ session_id: sessionId })
        .then(async (res) => {
          if (res.data.confirmado) {
            await registrarPago({
              id_contrato: idContrato,
              monto: res.data.monto,
              metodo_pago: 'tarjeta',
              referencia: sessionId
            })
            setExito('Pago con tarjeta registrado correctamente')
            cargarDatos()
            setTimeout(() => setExito(null), 4000)
          }
        })
        .catch(() => setError('No se pudo confirmar el pago con Stripe.'))
        .finally(() => setSearchParams({}))
    } else if (pago === 'cancelado') {
      setError('El pago con tarjeta fue cancelado.')
      setSearchParams({})
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!usuario || loading) return <p style={styles.mensaje}>Cargando tus reservas...</p>

  if (!inquilinoActual) {
    return (
      <p style={styles.mensaje}>
        No encontramos un perfil de inquilino asociado a tu cuenta. Intenta cerrar sesión y volver a entrar.
      </p>
    )
  }

  const misReservas = reservas.filter(r => r.id_inquilino === inquilinoActual.id_inquilino)

  const reservasConDetalle = misReservas.map(r => {
    const contrato = contratos.find(c => c.id_reserva === r.id_reserva)
    const pagosDelContrato = contrato ? pagos.filter(p => p.id_contrato === contrato.id_contrato) : []
    const totalPagado = pagosDelContrato.reduce((suma, p) => suma + parseFloat(p.monto), 0)
    return { ...r, contrato, pagosDelContrato, totalPagado }
  })

  const handleChangePago = (id_contrato, campo, valor) => {
    setFormPago({
      ...formPago,
      [id_contrato]: { ...formPago[id_contrato], [campo]: valor }
    })
  }

  const handleSeleccionarComprobante = (id_contrato, file) => {
    setArchivoComprobante({ ...archivoComprobante, [id_contrato]: file })
  }

  const handleRegistrarPago = async (reserva) => {
    const id_contrato = reserva.contrato.id_contrato
    const datos = formPago[id_contrato] || {}

    if (!datos.monto || !datos.metodo_pago) {
      setError('Completa el monto y el método de pago')
      return
    }

    setError(null)
    setProcesando(id_contrato)

    try {
      if (datos.metodo_pago === 'tarjeta') {
        // Pago real con Stripe: se crea la sesión y se redirige a la página de pago de Stripe.
        // El pago se registra en nuestra BD solo después de confirmarse (ver useEffect de arriba).
        const res = await crearSesionPago({
          id_contrato,
          monto: parseFloat(datos.monto),
          titulo_propiedad: reserva.PROPIEDADES?.titulo
        })
        window.location.href = res.data.url
        return
      }

      let referencia = datos.referencia || null

      if (datos.metodo_pago === 'transferencia') {
        const archivo = archivoComprobante[id_contrato]
        if (!archivo) {
          setError('Adjunta una captura de la transferencia antes de continuar')
          setProcesando(null)
          return
        }
        const formData = new FormData()
        formData.append('comprobante', archivo)
        formData.append('id_contrato', id_contrato)
        const resSubida = await subirComprobante(formData)
        referencia = resSubida.data.url
      }

      await registrarPago({
        id_contrato,
        monto: parseFloat(datos.monto),
        metodo_pago: datos.metodo_pago,
        referencia
      })

      setFormPago({ ...formPago, [id_contrato]: {} })
      setArchivoComprobante({ ...archivoComprobante, [id_contrato]: null })
      setExito('Pago registrado correctamente')
      cargarDatos()
      setTimeout(() => setExito(null), 3000)
    } catch (err) {
      setError('Error al registrar el pago. Intenta de nuevo.')
    } finally {
      setProcesando(null)
    }
  }

  const handleCancelar = async (reserva) => {
    if (!reserva.contrato) return
    setProcesando(reserva.contrato.id_contrato)
    setError(null)
    try {
      await cancelarContrato({ id_contrato: reserva.contrato.id_contrato })
      await enviarMensaje({
        id_propiedad: reserva.id_propiedad,
        id_propietario: reserva.PROPIEDADES?.id_propietario,
        id_inquilino: reserva.id_inquilino,
        remitente: 'inquilino',
        contenido: `⚠️ El inquilino canceló el contrato de "${reserva.PROPIEDADES?.titulo}".`
      }).catch(() => {})
      setExito('Contrato cancelado')
      cargarDatos()
      setTimeout(() => setExito(null), 3000)
    } catch (err) {
      setError('Error al cancelar el contrato. Intenta de nuevo.')
    } finally {
      setProcesando(null)
    }
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.titulo}>Mis reservas</h2>

      {error && <p style={styles.error}>{error}</p>}
      {exito && <p style={styles.exito}>✅ {exito}</p>}

      {reservasConDetalle.length === 0 ? (
        <p style={styles.mensaje}>Todavía no has solicitado ninguna reserva.</p>
      ) : (
        <div style={styles.lista}>
          {reservasConDetalle.map(r => {
            const metodoSeleccionado = formPago[r.contrato?.id_contrato]?.metodo_pago

            return (
              <div key={r.id_reserva} style={styles.card}>
                <div style={styles.cardHeader}>
                  <h3 style={styles.propiedadTitulo}>{r.PROPIEDADES?.titulo}</h3>
                  <span style={{
                    ...styles.badge,
                    backgroundColor:
                      r.estado === 'aprobada' ? '#28a745' :
                      r.estado === 'pendiente' ? '#ffc107' :
                      '#e94560'
                  }}>
                    {r.estado}
                  </span>
                </div>
                <p style={styles.fechas}>{r.fecha_inicio} al {r.fecha_fin}</p>

                {r.contrato && r.contrato.estado === 'activo' && (
                  <div style={styles.detalleContrato}>
                    <p style={styles.lineaDetalle}>Monto mensual: L. {r.contrato.monto_mensual}</p>
                    <p style={styles.lineaDetalle}>Depósito requerido: L. {r.contrato.deposito}</p>
                    <p style={styles.lineaDetalle}>Total pagado: L. {r.totalPagado.toFixed(2)}</p>

                    {r.pagosDelContrato.length > 0 && (
                      <div style={styles.historialPagos}>
                        {r.pagosDelContrato.map(p => (
                          <p key={p.id_pago} style={styles.itemPago}>
                            L. {p.monto} — {p.metodo_pago} — {p.fecha_pago}
                            {p.referencia && p.referencia.startsWith('http') && (
                              <> — <a href={p.referencia} target="_blank" rel="noreferrer" style={styles.linkComprobante}>Ver comprobante</a></>
                            )}
                          </p>
                        ))}
                      </div>
                    )}

                    <div style={styles.formPago}>
                      <input
                        type="number"
                        placeholder="Monto a pagar"
                        value={formPago[r.contrato.id_contrato]?.monto || ''}
                        onChange={(e) => handleChangePago(r.contrato.id_contrato, 'monto', e.target.value)}
                        style={styles.inputPago}
                      />
                      <select
                        value={formPago[r.contrato.id_contrato]?.metodo_pago || ''}
                        onChange={(e) => handleChangePago(r.contrato.id_contrato, 'metodo_pago', e.target.value)}
                        style={styles.inputPago}
                      >
                        <option value="">Método de pago</option>
                        <option value="efectivo">Efectivo</option>
                        <option value="transferencia">Transferencia bancaria</option>
                        <option value="tarjeta">Tarjeta (pago en línea)</option>
                      </select>

                      {metodoSeleccionado === 'transferencia' && (
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleSeleccionarComprobante(r.contrato.id_contrato, e.target.files[0])}
                          style={styles.inputPago}
                        />
                      )}

                      {metodoSeleccionado !== 'tarjeta' && metodoSeleccionado !== 'transferencia' && (
                        <input
                          type="text"
                          placeholder="Referencia (opcional)"
                          value={formPago[r.contrato.id_contrato]?.referencia || ''}
                          onChange={(e) => handleChangePago(r.contrato.id_contrato, 'referencia', e.target.value)}
                          style={styles.inputPago}
                        />
                      )}

                      <button
                        onClick={() => handleRegistrarPago(r)}
                        style={styles.botonPagar}
                        disabled={procesando === r.contrato.id_contrato}
                      >
                        {procesando === r.contrato.id_contrato
                          ? 'Procesando...'
                          : metodoSeleccionado === 'tarjeta' ? 'Pagar con tarjeta' : 'Registrar pago'}
                      </button>
                    </div>

                    <div style={{ display: 'flex', gap: '0.6rem', marginTop: '0.8rem' }}>
                      <Link to={`/contrato/${r.contrato.id_contrato}`} style={styles.botonVerContrato}>
                        Ver / firmar contrato
                      </Link>
                      <button
                        onClick={() => handleCancelar(r)}
                        style={styles.botonCancelar}
                        disabled={procesando === r.contrato.id_contrato}
                      >
                        Cancelar este contrato
                      </button>
                    </div>
                  </div>
                )}

                {r.contrato && r.contrato.estado === 'cancelado' && (
                  <p style={styles.avisoCancelado}>Este contrato fue cancelado.</p>
                )}
              </div>
            )
          })}
        </div>
      )}
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
  titulo: {
    fontSize: '1.8rem',
    color: '#1a1a2e',
    marginBottom: '1.5rem'
  },
  lista: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem'
  },
  card: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '1.2rem 1.5rem',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  propiedadTitulo: {
    margin: 0,
    color: '#1a1a2e',
    fontSize: '1.1rem'
  },
  badge: {
    padding: '0.3rem 0.7rem',
    borderRadius: '20px',
    color: 'white',
    fontSize: '0.75rem',
    fontWeight: 'bold',
    textTransform: 'capitalize'
  },
  fechas: {
    color: '#888',
    fontSize: '0.9rem',
    margin: '0.4rem 0 0.8rem 0'
  },
  detalleContrato: {
    borderTop: '1px solid #eee',
    paddingTop: '0.8rem',
    marginTop: '0.5rem'
  },
  lineaDetalle: {
    fontSize: '0.9rem',
    color: '#555',
    margin: '0.2rem 0'
  },
  historialPagos: {
    backgroundColor: '#f9f9f9',
    borderRadius: '6px',
    padding: '0.6rem 0.8rem',
    margin: '0.6rem 0'
  },
  itemPago: {
    fontSize: '0.8rem',
    color: '#555',
    margin: '0.2rem 0'
  },
  linkComprobante: {
    color: '#e94560',
    fontWeight: 'bold',
    textDecoration: 'none'
  },
  formPago: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.5rem',
    marginTop: '0.8rem'
  },
  inputPago: {
    padding: '0.5rem 0.7rem',
    borderRadius: '4px',
    border: '1px solid #ddd',
    fontSize: '0.85rem',
    flex: '1 1 140px'
  },
  botonPagar: {
    padding: '0.5rem 1rem',
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontWeight: 'bold',
    cursor: 'pointer',
    fontSize: '0.85rem'
  },
  botonCancelar: {
    padding: '0.5rem 1rem',
    backgroundColor: '#e94560',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontWeight: 'bold',
    cursor: 'pointer',
    fontSize: '0.85rem'
  },
  botonVerContrato: {
    padding: '0.5rem 1rem',
    backgroundColor: '#1a1a2e',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontWeight: 'bold',
    cursor: 'pointer',
    fontSize: '0.85rem',
    textDecoration: 'none'
  },
  avisoCancelado: {
    color: '#e94560',
    fontSize: '0.85rem',
    fontWeight: 'bold',
    marginTop: '0.5rem'
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
  exito: {
    backgroundColor: '#e0ffe0',
    color: '#28a745',
    padding: '0.8rem',
    borderRadius: '4px',
    textAlign: 'center',
    marginBottom: '1rem',
    fontSize: '0.9rem'
  },
  mensaje: {
    padding: '2rem',
    textAlign: 'center',
    color: '#888'
  }
}

export default MisReservas