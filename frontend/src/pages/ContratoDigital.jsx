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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
  const propietarioInfo = propiedad?.PROPIETARIOS
  const ubicacion = propiedad?.UBICACIONES
  const numeroContrato = `RF-${String(contrato.id_contrato).padStart(6, '0')}`
  const fechaGeneracion = new Date(contrato.created_at || Date.now()).toLocaleDateString('es-HN', {
    day: 'numeric', month: 'long', year: 'numeric'
  })

  return (
    <div style={styles.container}>
      <style>{`
        @media print {
          .no-imprimir { display: none !important; }
          .documento-contrato {
            box-shadow: none !important;
            border: none !important;
            padding: 0 !important;
          }
          body { background: white !important; }
        }
      `}</style>

      <div className="no-imprimir" style={styles.accionesNoImprimir}>
        <Link to={usuario?.rol === 'anfitrion' ? '/admin' : '/mis-reservas'} style={styles.volver}>
          ← Volver
        </Link>
        <button onClick={() => window.print()} style={styles.botonImprimir}>
          🖨️ Descargar / Imprimir contrato (PDF)
        </button>
      </div>

      <div className="documento-contrato" style={styles.documento}>
        <div style={styles.encabezado}>
          <h1 style={styles.tituloDoc}>CONTRATO DE ARRENDAMIENTO DE BIEN INMUEBLE</h1>
          <p style={styles.numeroContrato}>Contrato N.° {numeroContrato}</p>
          <p style={styles.subtituloDoc}>Generado a través de la plataforma RentaFácil HN el {fechaGeneracion}</p>
        </div>

        <div style={styles.introduccion}>
          <p>
            Conste por el presente documento el <strong>Contrato de Arrendamiento</strong> que celebran, por una parte,
            quien en adelante se denominará <strong>EL ARRENDADOR</strong>, y por otra parte, quien en adelante se
            denominará <strong>EL ARRENDATARIO</strong>, cuyos datos de identificación se detallan a continuación,
            y quienes convienen en sujetarse a las cláusulas siguientes:
          </p>
        </div>

        <div style={styles.seccionDoc}>
          <h3 style={styles.tituloSeccion}>I. IDENTIFICACIÓN DE LAS PARTES</h3>

          <div style={styles.bloqueParte}>
            <p style={styles.etiquetaParte}>EL ARRENDADOR</p>
            <table style={styles.tablaDatos}>
              <tbody>
                <tr><td style={styles.tdLabel}>Nombre completo</td><td>{propietarioInfo?.nombre} {propietarioInfo?.apellido}</td></tr>
                <tr><td style={styles.tdLabel}>DNI</td><td>{propietarioInfo?.dni || 'No registrado'}</td></tr>
                <tr><td style={styles.tdLabel}>Correo electrónico</td><td>{propietarioInfo?.email}</td></tr>
                <tr><td style={styles.tdLabel}>Teléfono</td><td>{propietarioInfo?.telefono || 'No registrado'}</td></tr>
              </tbody>
            </table>
          </div>

          <div style={styles.bloqueParte}>
            <p style={styles.etiquetaParte}>EL ARRENDATARIO</p>
            <table style={styles.tablaDatos}>
              <tbody>
                <tr><td style={styles.tdLabel}>Nombre completo</td><td>{inquilino?.nombre} {inquilino?.apellido}</td></tr>
                <tr><td style={styles.tdLabel}>DNI</td><td>{inquilino?.dni || 'No registrado'}</td></tr>
                <tr><td style={styles.tdLabel}>Correo electrónico</td><td>{inquilino?.email}</td></tr>
                <tr><td style={styles.tdLabel}>Teléfono</td><td>{inquilino?.telefono || 'No registrado'}</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        <div style={styles.seccionDoc}>
          <h3 style={styles.tituloSeccion}>II. OBJETO DEL CONTRATO</h3>
          <p style={styles.parrafoClausula}>
            EL ARRENDADOR es propietario del inmueble identificado como <strong>"{propiedad?.titulo}"</strong>,
            ubicado en {ubicacion?.direccion}, {ubicacion?.municipio}, {ubicacion?.departamento}, Honduras,
            el cual da en arrendamiento a EL ARRENDATARIO bajo los términos y condiciones que se describen en
            el presente contrato.
          </p>
          {propiedad?.descripcion && (
            <p style={styles.parrafoClausula}><strong>Descripción del inmueble:</strong> {propiedad.descripcion}</p>
          )}
          <table style={styles.tablaDatos}>
            <tbody>
              <tr><td style={styles.tdLabel}>Tipo de propiedad</td><td style={{ textTransform: 'capitalize' }}>{propiedad?.tipo}</td></tr>
              <tr><td style={styles.tdLabel}>Habitaciones</td><td>{propiedad?.habitaciones}</td></tr>
              <tr><td style={styles.tdLabel}>Baños</td><td>{propiedad?.banos}</td></tr>
              <tr><td style={styles.tdLabel}>Metros cuadrados</td><td>{propiedad?.metros_cuadrados} m²</td></tr>
            </tbody>
          </table>
        </div>

        <div style={styles.seccionDoc}>
          <h3 style={styles.tituloSeccion}>III. PLAZO DEL ARRENDAMIENTO</h3>
          <p style={styles.parrafoClausula}>
            El presente contrato tendrá vigencia desde el <strong>{contrato.fecha_inicio}</strong> hasta el{' '}
            <strong>{contrato.fecha_fin}</strong>, fechas dentro de las cuales EL ARRENDATARIO gozará del uso
            pacífico del inmueble descrito en la cláusula anterior.
          </p>
        </div>

        <div style={styles.seccionDoc}>
          <h3 style={styles.tituloSeccion}>IV. CONTRAPRESTACIÓN ECONÓMICA</h3>
          <table style={styles.tablaDatos}>
            <tbody>
              <tr><td style={styles.tdLabel}>Monto de arrendamiento mensual</td><td>L. {contrato.monto_mensual}</td></tr>
              <tr><td style={styles.tdLabel}>Depósito en garantía</td><td>L. {contrato.deposito}</td></tr>
            </tbody>
          </table>
          <p style={styles.parrafoClausula}>
            EL ARRENDATARIO se obliga a cancelar el monto mensual señalado dentro de los primeros cinco (5) días
            de cada periodo, a través de los medios de pago habilitados en la plataforma RentaFácil HN
            (transferencia bancaria, efectivo o tarjeta). El depósito en garantía responde por daños al inmueble
            o incumplimientos del presente contrato, y será reembolsado al finalizar el arrendamiento, previa
            inspección de la propiedad, siempre que no existan daños ni obligaciones pendientes.
          </p>
        </div>

        {contrato.instrucciones_checkin && (
          <div style={styles.seccionDoc}>
            <h3 style={styles.tituloSeccion}>V. INSTRUCCIONES DE ENTREGA (CHECK-IN)</h3>
            <p style={styles.textoInstrucciones}>{contrato.instrucciones_checkin}</p>
          </div>
        )}

        <div style={styles.seccionDoc}>
          <h3 style={styles.tituloSeccion}>{contrato.instrucciones_checkin ? 'VI' : 'V'}. CLÁUSULAS GENERALES</h3>
          <ol style={styles.listaClausulas}>
            <li><strong>Primera — Del pago.</strong> EL ARRENDATARIO se compromete a cancelar puntualmente el monto mensual acordado durante toda la vigencia del contrato.</li>
            <li><strong>Segunda — Del depósito.</strong> El depósito de garantía cubre daños ocasionados al inmueble y será reembolsado al finalizar el contrato, salvo que existan daños comprobados o pagos pendientes.</li>
            <li><strong>Tercera — Del uso del inmueble.</strong> EL ARRENDATARIO se obliga a dar al inmueble un uso adecuado, absteniéndose de subarrendarlo total o parcialmente sin autorización expresa de EL ARRENDADOR.</li>
            <li><strong>Cuarta — De las reparaciones.</strong> EL ARRENDATARIO deberá reportar cualquier daño o desperfecto del inmueble a través del canal de mensajería interno de la plataforma, a la brevedad posible.</li>
            <li><strong>Quinta — De la cancelación anticipada.</strong> Cualquiera de las partes podrá solicitar la cancelación anticipada del presente contrato a través de la plataforma, pudiendo dicha cancelación implicar la pérdida parcial o total del depósito en garantía, según las circunstancias del caso.</li>
            <li><strong>Sexta — De las obligaciones de EL ARRENDADOR.</strong> EL ARRENDADOR se obliga a entregar el inmueble en las condiciones descritas en este contrato y a respetar el plazo de arrendamiento pactado, salvo incumplimiento comprobado por parte de EL ARRENDATARIO.</li>
            <li><strong>Séptima — De la aceptación digital.</strong> Ambas partes reconocen y aceptan que la firma digital realizada dentro de la plataforma RentaFácil HN —consistente en la identificación por nombre completo y aceptación expresa de los términos aquí descritos— constituye manifestación válida de voluntad y consentimiento respecto del contenido íntegro de este contrato.</li>
          </ol>
        </div>

        <div style={styles.seccionFirma}>
          <h3 style={styles.tituloSeccion}>FIRMAS</h3>

          <div style={styles.bloquesFirma}>
            <div style={styles.bloqueFirmaParte}>
              <p style={styles.etiquetaParte}>EL ARRENDADOR</p>
              <p style={styles.lineaFirma}>{propietarioInfo?.nombre} {propietarioInfo?.apellido}</p>
              <p style={styles.notaFirma}>
                Manifiesta su consentimiento mediante la aprobación de la solicitud de reserva dentro de la plataforma.
              </p>
            </div>

            <div style={styles.bloqueFirmaParte}>
              <p style={styles.etiquetaParte}>EL ARRENDATARIO</p>
              {contrato.terminos_aceptados ? (
                <>
                  <p style={styles.lineaFirma}>{contrato.nombre_firma}</p>
                  <p style={styles.notaFirma}>
                    Firmado digitalmente el {new Date(contrato.fecha_aceptacion).toLocaleString('es-HN')}
                  </p>
                </>
              ) : (
                <p style={styles.pendienteFirma}>⏳ Pendiente de firma</p>
              )}
            </div>
          </div>

          {!contrato.terminos_aceptados && puedeFirmar && (
            <div className="no-imprimir" style={styles.formFirma}>
              {error && <p style={styles.error}>{error}</p>}
              <p style={styles.avisoFirma}>
                Al firmar, EL ARRENDATARIO confirma que ha leído y acepta la totalidad de los términos y
                condiciones descritos en este contrato.
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
          )}
        </div>
      </div>
    </div>
  )
}

const styles = {
  container: {
    padding: '2rem',
    fontFamily: "'Georgia', 'Times New Roman', serif",
    maxWidth: '800px',
    margin: '0 auto'
  },
  accionesNoImprimir: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1.5rem',
    fontFamily: 'sans-serif'
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
    borderRadius: '4px',
    padding: '3rem',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    border: '1px solid #ddd'
  },
  encabezado: {
    textAlign: 'center',
    borderBottom: '2px solid #1a1a2e',
    paddingBottom: '1.2rem',
    marginBottom: '1.8rem'
  },
  tituloDoc: {
    fontSize: '1.4rem',
    color: '#1a1a2e',
    marginBottom: '0.5rem',
    letterSpacing: '0.5px'
  },
  numeroContrato: {
    fontSize: '0.9rem',
    color: '#555',
    fontWeight: 'bold',
    margin: '0.3rem 0'
  },
  subtituloDoc: {
    color: '#888',
    fontSize: '0.8rem',
    margin: 0
  },
  introduccion: {
    marginBottom: '1.8rem',
    color: '#222',
    fontSize: '0.95rem',
    lineHeight: 1.8,
    textAlign: 'justify'
  },
  seccionDoc: {
    marginBottom: '1.8rem',
    color: '#222',
    fontSize: '0.95rem',
    lineHeight: 1.7
  },
  tituloSeccion: {
    fontSize: '1rem',
    color: '#1a1a2e',
    borderBottom: '1px solid #ccc',
    paddingBottom: '0.4rem',
    marginBottom: '0.8rem',
    letterSpacing: '0.3px'
  },
  bloqueParte: {
    marginBottom: '1.2rem'
  },
  etiquetaParte: {
    fontWeight: 'bold',
    fontSize: '0.85rem',
    color: '#e94560',
    letterSpacing: '0.5px',
    marginBottom: '0.4rem'
  },
  tablaDatos: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '0.9rem'
  },
  tdLabel: {
    fontWeight: 'bold',
    padding: '0.35rem 0',
    width: '45%',
    color: '#555',
    verticalAlign: 'top'
  },
  parrafoClausula: {
    textAlign: 'justify',
    marginBottom: '0.8rem'
  },
  textoInstrucciones: {
    backgroundColor: '#f9f9f9',
    padding: '1rem',
    borderRadius: '4px',
    whiteSpace: 'pre-wrap',
    fontSize: '0.9rem',
    border: '1px solid #eee'
  },
  listaClausulas: {
    paddingLeft: '1.2rem',
    lineHeight: 1.8,
    textAlign: 'justify',
    fontSize: '0.9rem'
  },
  seccionFirma: {
    borderTop: '2px solid #1a1a2e',
    paddingTop: '1.5rem',
    marginTop: '2rem'
  },
  bloquesFirma: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '2rem',
    marginTop: '1rem',
    marginBottom: '1.5rem'
  },
  bloqueFirmaParte: {
    textAlign: 'center',
    borderTop: '1px solid #999',
    paddingTop: '0.6rem'
  },
  lineaFirma: {
    fontWeight: 'bold',
    margin: '0.3rem 0',
    fontFamily: "'Brush Script MT', cursive",
    fontStyle: 'italic',
    fontSize: '1.3rem'
  },
  notaFirma: {
    fontSize: '0.75rem',
    color: '#888',
    margin: 0
  },
  pendienteFirma: {
    color: '#ffc107',
    fontWeight: 'bold',
    fontSize: '0.9rem'
  },
  formFirma: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.8rem',
    fontFamily: 'sans-serif'
  },
  avisoFirma: {
    fontSize: '0.85rem',
    color: '#888'
  },
  inputFirma: {
    padding: '0.7rem 1rem',
    borderRadius: '4px',
    border: '1px solid #ddd',
    fontSize: '1rem',
    fontFamily: 'sans-serif'
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