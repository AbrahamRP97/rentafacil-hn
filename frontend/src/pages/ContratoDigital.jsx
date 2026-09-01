import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getContrato, updateContrato, getPropiedad, getInquilino } from '../services/api'

function ContratoDigital() {
  const { id_contrato } = useParams()
  const { usuario } = useAuth()

  const [contrato, setContrato] = useState(null)
  const [propiedad, setPropiedad] = useState(null)
  const [inquilino, setInquilino] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [nombreFirma, setNombreFirma] = useState('')
  const [aceptaTerminos, setAceptaTerminos] = useState(false)
  const [firmando, setFirmando] = useState(false)

  const cargarTodo = async () => {
    try {
      const resContrato = await getContrato(id_contrato)
      setContrato(resContrato.data)

      const idPropiedad = resContrato.data.RESERVAS?.id_propiedad
      const idInquilino = resContrato.data.RESERVAS?.id_inquilino

      const [resPropiedad, resInquilino] = await Promise.all([
        getPropiedad(idPropiedad),
        getInquilino(idInquilino)
      ])
      setPropiedad(resPropiedad.data)
      setInquilino(resInquilino.data)

      setLoading(false)
    } catch (err) {
      setError('No se pudo cargar el contrato')
      setLoading(false)
    }
  }

  useEffect(() => {
    cargarTodo()
  }, [id_contrato])

  const handleFirmar = async () => {
    if (!nombreFirma.trim()) {
      setError('Escribe tu nombre completo para firmar')
      return
    }
    if (!aceptaTerminos) {
      setError('Debes aceptar los términos y condiciones para firmar')
      return
    }

    setError(null)
    setFirmando(true)
    try {
      await updateContrato(id_contrato, {
        terminos_aceptados: true,
        fecha_aceptacion: new Date().toISOString(),
        nombre_firma: nombreFirma.trim()
      })
      cargarTodo()
    } catch (err) {
      setError('Error al firmar el contrato. Intenta de nuevo.')
    } finally {
      setFirmando(false)
    }
  }

  if (loading) return <p style={styles.mensaje}>Cargando contrato...</p>
  if (error && !contrato) return <p style={styles.mensaje}>{error}</p>

  const puedeFirmar = usuario?.rol === 'inquilino' && !contrato.terminos_aceptados

  return (
    <div style={styles.container}>
      <div style={styles.accionesNoImprimir}>
        <Link to={usuario?.rol === 'anfitrion' ? '/admin' : '/mis-reservas'} style={styles.volver}>
          ← Volver
        </Link>
        <button onClick={() => window.print()} style={styles.botonImprimir}>
          🖨️ Imprimir / Guardar como PDF
        </button>
      </div>

      <div style={styles.documento}>
        <h1 style={styles.tituloDoc}>Contrato de Arrendamiento</h1>
        <p style={styles.subtituloDoc}>RentaFácil HN — Contrato #{contrato.id_contrato}</p>

        <div style={styles.seccionDoc}>
          <h3>Partes del contrato</h3>
          <p><strong>Propietario (Arrendador):</strong> {propiedad?.PROPIETARIOS?.nombre} {propiedad?.PROPIETARIOS?.apellido} — {propiedad?.PROPIETARIOS?.email}</p>
          <p><strong>Inquilino (Arrendatario):</strong> {inquilino?.nombre} {inquilino?.apellido} — {inquilino?.email}</p>
        </div>

        <div style={styles.seccionDoc}>
          <h3>Propiedad arrendada</h3>
          <p><strong>{propiedad?.titulo}</strong></p>
          <p>{propiedad?.descripcion}</p>
        </div>

        <div style={styles.seccionDoc}>
          <h3>Términos económicos</h3>
          <table style={styles.tablaTerminos}>
            <tbody>
              <tr>
                <td style={styles.tdLabel}>Periodo de arrendamiento</td>
                <td>{contrato.fecha_inicio} al {contrato.fecha_fin}</td>
              </tr>
              <tr>
                <td style={styles.tdLabel}>Monto mensual</td>
                <td>L. {contrato.monto_mensual}</td>
              </tr>
              <tr>
                <td style={styles.tdLabel}>Depósito de garantía</td>
                <td>L. {contrato.deposito}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {contrato.instrucciones_checkin && (
          <div style={styles.seccionDoc}>
            <h3>Instrucciones de check-in</h3>
            <p style={styles.textoInstrucciones}>{contrato.instrucciones_checkin}</p>
          </div>
        )}

        <div style={styles.seccionDoc}>
          <h3>Términos y condiciones</h3>
          <ol style={styles.listaTerminos}>
            <li>El inquilino se compromete a pagar el monto mensual acordado en la fecha correspondiente durante todo el periodo del contrato.</li>
            <li>El depósito de garantía cubre posibles daños a la propiedad y será reembolsado al finalizar el contrato, sujeto a inspección, salvo que existan daños o pagos pendientes.</li>
            <li>El propietario se compromete a entregar la propiedad en las condiciones descritas y a respetar el periodo de arrendamiento acordado, salvo incumplimiento del inquilino.</li>
            <li>Cualquier cancelación anticipada del contrato debe notificarse a través de la plataforma, y puede estar sujeta a la pérdida parcial o total del depósito, según lo acordado entre las partes.</li>
            <li>El inquilino se compromete a dar buen uso a la propiedad y a reportar cualquier daño o desperfecto al propietario a través del chat interno de la plataforma.</li>
            <li>Ambas partes aceptan que este documento, firmado digitalmente dentro de la plataforma RentaFácil HN, constituye un acuerdo de buena fe entre ambas partes.</li>
          </ol>
        </div>

        <div style={styles.seccionFirma}>
          <h3>Firma digital</h3>

          {contrato.terminos_aceptados ? (
            <div style={styles.firmaConfirmada}>
              <p>✅ <strong>Firmado por:</strong> {contrato.nombre_firma}</p>
              <p><strong>Fecha de aceptación:</strong> {new Date(contrato.fecha_aceptacion).toLocaleString('es-HN')}</p>
            </div>
          ) : puedeFirmar ? (
            <div style={styles.formFirma}>
              {error && <p style={styles.error}>{error}</p>}
              <p style={styles.avisoFirma}>
                Al firmar, confirmas que has leído y aceptas los términos y condiciones de este contrato.
              </p>
              <input
                type="text"
                placeholder="Escribe tu nombre completo"
                value={nombreFirma}
                onChange={(e) => setNombreFirma(e.target.value)}
                style={styles.inputFirma}
              />
              <div style={styles.checkboxFirma}>
                <input
                  type="checkbox"
                  id="aceptaTerminos"
                  checked={aceptaTerminos}
                  onChange={(e) => setAceptaTerminos(e.target.checked)}
                />
                <label htmlFor="aceptaTerminos">He leído y acepto los términos y condiciones</label>
              </div>
              <button onClick={handleFirmar} style={styles.botonFirmar} disabled={firmando}>
                {firmando ? 'Firmando...' : 'Firmar contrato'}
              </button>
            </div>
          ) : (
            <p style={styles.pendienteFirma}>⏳ Este contrato aún no ha sido firmado por el inquilino.</p>
          )}
        </div>
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
  accionesNoImprimir: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1.5rem'
  },
  volver: {
    color: '#1a1a2e',
    textDecoration: 'none',
    fontWeight: 'bold'
  },
  botonImprimir: {
    padding: '0.5rem 1rem',
    backgroundColor: '#1a1a2e',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.9rem'
  },
  documento: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '2.5rem',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
  },
  tituloDoc: {
    fontSize: '1.6rem',
    color: '#1a1a2e',
    marginBottom: '0.2rem',
    textAlign: 'center'
  },
  subtituloDoc: {
    textAlign: 'center',
    color: '#888',
    marginBottom: '2rem',
    fontSize: '0.9rem'
  },
  seccionDoc: {
    marginBottom: '1.5rem',
    color: '#333',
    fontSize: '0.95rem',
    lineHeight: 1.6
  },
  tablaTerminos: {
    width: '100%',
    borderCollapse: 'collapse',
    marginTop: '0.5rem'
  },
  tdLabel: {
    fontWeight: 'bold',
    padding: '0.4rem 0',
    width: '45%',
    color: '#555'
  },
  textoInstrucciones: {
    backgroundColor: '#f9f9f9',
    padding: '1rem',
    borderRadius: '6px',
    whiteSpace: 'pre-wrap'
  },
  listaTerminos: {
    paddingLeft: '1.2rem',
    lineHeight: 1.7
  },
  seccionFirma: {
    borderTop: '2px solid #eee',
    paddingTop: '1.5rem',
    marginTop: '1.5rem'
  },
  firmaConfirmada: {
    backgroundColor: '#e0ffe0',
    padding: '1rem',
    borderRadius: '6px',
    color: '#28a745'
  },
  formFirma: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.8rem'
  },
  avisoFirma: {
    fontSize: '0.85rem',
    color: '#888'
  },
  inputFirma: {
    padding: '0.7rem 1rem',
    borderRadius: '4px',
    border: '1px solid #ddd',
    fontSize: '1rem'
  },
  checkboxFirma: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '0.9rem'
  },
  botonFirmar: {
    padding: '0.8rem',
    backgroundColor: '#e94560',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontWeight: 'bold',
    cursor: 'pointer',
    fontSize: '1rem'
  },
  pendienteFirma: {
    color: '#ffc107',
    fontWeight: 'bold'
  },
  error: {
    backgroundColor: '#ffe0e0',
    color: '#e94560',
    padding: '0.6rem',
    borderRadius: '4px',
    fontSize: '0.85rem'
  },
  mensaje: {
    padding: '2rem',
    textAlign: 'center',
    color: '#888'
  }
}

export default ContratoDigital