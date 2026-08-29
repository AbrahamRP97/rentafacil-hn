import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getPropiedades, getReservas, getContratos, getPagos, createPropiedad,
  getImagenes, uploadImagen, deleteImagen, setImagenPortada, getPropietarioPorAuth,
  aprobarReserva, updateReserva, enviarMensaje } from '../services/api'

function PanelAdmin() {
  const { usuario } = useAuth()

  const [propietarioActual, setPropietarioActual] = useState(null)
  const [cargandoPropietario, setCargandoPropietario] = useState(true)

  const [propiedades, setPropiedades] = useState([])
  const [reservas, setReservas] = useState([])
  const [contratos, setContratos] = useState([])
  const [pagos, setPagos] = useState([])

  const [propiedadesPropias, setPropiedadesPropias] = useState([])
  const [reservasPendientes, setReservasPendientes] = useState([])
  const [contratosPropios, setContratosPropios] = useState([])
  const [pagosPropios, setPagosPropios] = useState([])
  const [depositoPorReserva, setDepositoPorReserva] = useState({})
  const [procesandoReserva, setProcesandoReserva] = useState(null)

  const [loading, setLoading] = useState(true)
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [imagenes, setImagenes] = useState([])
  const [propiedadSeleccionada, setPropiedadSeleccionada] = useState(null)
  const [archivosImagen, setArchivosImagen] = useState([])
  const [esPortada, setEsPortada] = useState(false)
  const [mostrarImagenes, setMostrarImagenes] = useState(false)
  const [subiendoImagen, setSubiendoImagen] = useState(false)
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
    id_ubicacion: ''
  })

  const [imagenesNuevas, setImagenesNuevas] = useState([])

  useEffect(() => {
    if (!usuario) return
    getPropietarioPorAuth(usuario.id)
      .then(res => {
        setPropietarioActual(res.data)
        setCargandoPropietario(false)
      })
      .catch(() => {
        setPropietarioActual(null)
        setCargandoPropietario(false)
      })
  }, [usuario])

  const cargarDatos = () => {
    Promise.all([
      getPropiedades(),
      getReservas(),
      getContratos(),
      getPagos()
    ]).then(([p, r, c, pa]) => {
      setPropiedades(p.data)
      setReservas(r.data)
      setContratos(c.data)
      setPagos(pa.data)
      setLoading(false)
    }).catch(() => setLoading(false))
  }

  // Cruza propiedades -> reservas -> contratos -> pagos, todo filtrado
  // al propietario que inició sesión
  useEffect(() => {
    if (!propietarioActual) {
      setPropiedadesPropias([])
      setContratosPropios([])
      setPagosPropios([])
      return
    }

    const propias = propiedades.filter(p => p.id_propietario === propietarioActual.id_propietario)
    setPropiedadesPropias(propias)

    const idsPropiedades = propias.map(p => p.id_propiedad)
    const reservasPropias = reservas.filter(r => idsPropiedades.includes(r.id_propiedad))

    setReservasPendientes(reservasPropias.filter(r => r.estado === 'pendiente'))

    const idsReservas = reservasPropias.map(r => r.id_reserva)
    const contratosDePropias = contratos.filter(c => idsReservas.includes(c.id_reserva))
    setContratosPropios(contratosDePropias)

    const idsContratos = contratosDePropias.map(c => c.id_contrato)
    setPagosPropios(pagos.filter(pg => idsContratos.includes(pg.id_contrato)))
  }, [propiedades, reservas, contratos, pagos, propietarioActual])

  const cargarImagenes = async (id_propiedad) => {
    try {
      const res = await getImagenes(id_propiedad)
      setImagenes(res.data)
    } catch {
      setImagenes([])
    }
  }

  const handleVerImagenes = (propiedad) => {
    setPropiedadSeleccionada(propiedad)
    setMostrarImagenes(true)
    cargarImagenes(propiedad.id_propiedad)
  }

  const handleAgregarImagenes = async () => {
    if (archivosImagen.length === 0) {
      setError('Selecciona al menos un archivo de imagen')
      return
    }
    setSubiendoImagen(true)
    setError(null)
    try {
      await Promise.all(
        archivosImagen.map((file, index) => {
          const formData = new FormData()
          formData.append('imagen', file)
          formData.append('id_propiedad', propiedadSeleccionada.id_propiedad)
          formData.append('es_portada', index === 0 ? esPortada : false)
          return uploadImagen(formData)
        })
      )
      setArchivosImagen([])
      setEsPortada(false)
      cargarImagenes(propiedadSeleccionada.id_propiedad)
    } catch {
      setError('Error al subir una o más imágenes')
    } finally {
      setSubiendoImagen(false)
    }
  }

  const handleEliminarImagen = async (id_imagen) => {
    try {
      await deleteImagen(id_imagen)
      cargarImagenes(propiedadSeleccionada.id_propiedad)
    } catch {
      setError('Error al eliminar la imagen')
    }
  }

  const handleMarcarPortada = async (id_imagen) => {
    try {
      await setImagenPortada(id_imagen)
      cargarImagenes(propiedadSeleccionada.id_propiedad)
    } catch {
      setError('Error al marcar la imagen como portada')
    }
  }

  const handleSeleccionarImagenesNuevas = (e) => {
    const files = Array.from(e.target.files)
    if (files.length === 0) return

    const nuevas = files.map((file, index) => ({
      file,
      previewUrl: URL.createObjectURL(file),
      es_portada: imagenesNuevas.length === 0 && index === 0
    }))

    setImagenesNuevas([...imagenesNuevas, ...nuevas])
    e.target.value = ''
  }

  const handleQuitarImagenNueva = (index) => {
    URL.revokeObjectURL(imagenesNuevas[index].previewUrl)
    setImagenesNuevas(imagenesNuevas.filter((_, i) => i !== index))
  }

  const handleMarcarPortadaNueva = (index) => {
    setImagenesNuevas(imagenesNuevas.map((img, i) => ({
      ...img,
      es_portada: i === index
    })))
  }

  useEffect(() => {
    cargarDatos()
  }, [])

  const handleAprobarReserva = async (id_reserva) => {
    setProcesandoReserva(id_reserva)
    setError(null)
    try {
      const deposito = depositoPorReserva[id_reserva]
      await aprobarReserva({
        id_reserva,
        deposito: deposito ? parseFloat(deposito) : null
      })

      const reserva = reservasPendientes.find(r => r.id_reserva === id_reserva)
      if (reserva) {
        await enviarMensaje({
          id_propiedad: reserva.id_propiedad,
          id_propietario: reserva.PROPIEDADES?.id_propietario,
          id_inquilino: reserva.id_inquilino,
          remitente: 'propietario',
          contenido: `✅ Tu solicitud de reserva para "${reserva.PROPIEDADES?.titulo}" (${reserva.fecha_inicio} al ${reserva.fecha_fin}) fue aprobada.`
        }).catch(() => {})
      }

      cargarDatos()
    } catch (err) {
      setError('Error al aprobar la reserva. Verifica el depósito o intenta de nuevo.')
    } finally {
      setProcesandoReserva(null)
    }
  }

  const handleRechazarReserva = async (id_reserva) => {
    setProcesandoReserva(id_reserva)
    setError(null)
    try {
      await updateReserva(id_reserva, { estado: 'rechazada' })

      const reserva = reservasPendientes.find(r => r.id_reserva === id_reserva)
      if (reserva) {
        await enviarMensaje({
          id_propiedad: reserva.id_propiedad,
          id_propietario: reserva.PROPIEDADES?.id_propietario,
          id_inquilino: reserva.id_inquilino,
          remitente: 'propietario',
          contenido: `❌ Tu solicitud de reserva para "${reserva.PROPIEDADES?.titulo}" (${reserva.fecha_inicio} al ${reserva.fecha_fin}) fue rechazada.`
        }).catch(() => {})
      }

      cargarDatos()
    } catch (err) {
      setError('Error al rechazar la reserva. Intenta de nuevo.')
    } finally {
      setProcesandoReserva(null)
    }
  }

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    if (!propietarioActual) {
      setError('No se pudo identificar tu perfil de propietario. Intenta cerrar sesión y volver a entrar.')
      return
    }

    if (!form.titulo || !form.precio_mensual || !form.id_ubicacion) {
      setError('Por favor completa todos los campos obligatorios')
      return
    }

    try {
      const res = await createPropiedad({
        ...form,
        precio_mensual:   parseFloat(form.precio_mensual),
        habitaciones:     parseInt(form.habitaciones),
        banos:            parseInt(form.banos),
        metros_cuadrados: parseFloat(form.metros_cuadrados),
        id_propietario:   propietarioActual.id_propietario,
        id_ubicacion:     parseInt(form.id_ubicacion)
      })

      const idNuevaPropiedad = res.data.id_propiedad

      if (imagenesNuevas.length > 0) {
        await Promise.all(
          imagenesNuevas.map(img => {
            const formData = new FormData()
            formData.append('imagen', img.file)
            formData.append('id_propiedad', idNuevaPropiedad)
            formData.append('es_portada', img.es_portada)
            return uploadImagen(formData)
          })
        )
      }

      setExito(true)
      setMostrarFormulario(false)
      setForm({
        titulo: '', descripcion: '', precio_mensual: '',
        habitaciones: '', banos: '', metros_cuadrados: '',
        tipo: 'apartamento', estado: 'disponible',
        id_ubicacion: ''
      })
      imagenesNuevas.forEach(img => URL.revokeObjectURL(img.previewUrl))
      setImagenesNuevas([])
      cargarDatos()
      setTimeout(() => setExito(false), 3000)
    } catch (err) {
      setError('Error al crear la propiedad. Verifica los datos e intenta de nuevo.')
    }
  }

  if (loading || cargandoPropietario) return <p style={styles.mensaje}>Cargando panel...</p>

  return (
    <div style={styles.container}>
      <h2 style={styles.titulo}>Panel de Administración</h2>
      <p style={styles.subtitulo}>
        Bienvenido, {propietarioActual ? `${propietarioActual.nombre} ${propietarioActual.apellido}` : 'anfitrión'}.
        Aquí puedes gestionar tus propiedades.
      </p>

      {!propietarioActual && (
        <p style={styles.error}>
          No encontramos un perfil de propietario asociado a tu cuenta. Si acabas de registrarte,
          intenta cerrar sesión y volver a entrar. Si el problema persiste, contacta soporte.
        </p>
      )}

      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <span style={styles.statIcono}>🏠</span>
          <span style={styles.statNumero}>{propiedadesPropias.length}</span>
          <span style={styles.statLabel}>Mis propiedades</span>
        </div>
        <div style={styles.statCard}>
          <span style={styles.statIcono}>📄</span>
          <span style={styles.statNumero}>{contratosPropios.length}</span>
          <span style={styles.statLabel}>Mis contratos</span>
        </div>
        <div style={styles.statCard}>
          <span style={styles.statIcono}>💰</span>
          <span style={styles.statNumero}>{pagosPropios.length}</span>
          <span style={styles.statLabel}>Mis pagos</span>
        </div>
      </div>

      {exito && <p style={styles.exito}>✅ Propiedad creada exitosamente</p>}
      {error && <p style={styles.error}>{error}</p>}

      {reservasPendientes.length > 0 && (
        <div style={styles.seccion}>
          <h3 style={styles.seccionTitulo}>Solicitudes de reserva pendientes</h3>
          <table style={styles.tabla}>
            <thead>
              <tr>
                <th style={styles.th}>Propiedad</th>
                <th style={styles.th}>Inquilino</th>
                <th style={styles.th}>Del</th>
                <th style={styles.th}>Al</th>
                <th style={styles.th}>Depósito (L.)</th>
                <th style={styles.th}>Acción</th>
              </tr>
            </thead>
            <tbody>
              {reservasPendientes.map(r => (
                <tr key={r.id_reserva} style={styles.tr}>
                  <td style={styles.td}>{r.PROPIEDADES?.titulo}</td>
                  <td style={styles.td}>{r.INQUILINOS?.nombre} {r.INQUILINOS?.apellido}</td>
                  <td style={styles.td}>{r.fecha_inicio}</td>
                  <td style={styles.td}>{r.fecha_fin}</td>
                  <td style={styles.td}>
                    <input
                      type="number"
                      placeholder="Opcional"
                      value={depositoPorReserva[r.id_reserva] || ''}
                      onChange={(e) => setDepositoPorReserva({
                        ...depositoPorReserva,
                        [r.id_reserva]: e.target.value
                      })}
                      style={styles.inputDeposito}
                    />
                  </td>
                  <td style={styles.td}>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={() => handleAprobarReserva(r.id_reserva)}
                        style={styles.botonAprobar}
                        disabled={procesandoReserva === r.id_reserva}
                      >
                        {procesandoReserva === r.id_reserva ? '...' : 'Aprobar'}
                      </button>
                      <button
                        onClick={() => handleRechazarReserva(r.id_reserva)}
                        style={styles.botonRechazar}
                        disabled={procesandoReserva === r.id_reserva}
                      >
                        Rechazar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div style={styles.seccion}>
        <div style={styles.seccionHeader}>
          <h3 style={styles.seccionTitulo}>Mis propiedades</h3>
          <Link to="/admin/consultas-avanzadas" style={styles.botonConsulta}>
            Consultas avanzadas
          </Link>
          <button
            onClick={() => { setMostrarFormulario(!mostrarFormulario); setError(null) }}
            style={styles.botonAgregar}
            disabled={!propietarioActual}
          >
            {mostrarFormulario ? '✕ Cancelar' : '+ Agregar propiedad'}
          </button>
        </div>

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

            <div style={styles.campo}>
              <label style={styles.label}>ID Ubicación *</label>
              <input type="number" name="id_ubicacion" value={form.id_ubicacion} onChange={handleChange} placeholder="1" style={styles.input} />
            </div>

            <div style={styles.agregarImagen}>
              <h4 style={{ margin: '0 0 1rem 0', color: '#1a1a2e' }}>Imágenes de la propiedad</h4>
              <div style={styles.campo}>
                <label style={styles.label}>Selecciona una o varias fotos (PC o móvil)</label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleSeleccionarImagenesNuevas}
                  style={styles.input}
                />
              </div>

              {imagenesNuevas.length > 0 && (
                <div style={styles.gridImagenes}>
                  {imagenesNuevas.map((img, index) => (
                    <div key={index} style={styles.imagenCard}>
                      <img src={img.previewUrl} alt="Nueva propiedad" style={styles.imagen} />
                      {img.es_portada ? (
                        <span style={styles.badgePortada}>⭐ Portada</span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleMarcarPortadaNueva(index)}
                          style={styles.botonImagenes}
                        >
                          Usar como portada
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleQuitarImagenNueva(index)}
                        style={styles.botonEliminar}
                      >
                        🗑️ Quitar
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button onClick={handleSubmit} style={styles.botonGuardar}>
              Guardar propiedad
            </button>
          </div>
        )}

        {propiedadesPropias.length === 0 ? (
          <p style={styles.mensaje}>Todavía no has registrado ninguna propiedad.</p>
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
                <th style={styles.th}>Imagenes</th>
              </tr>
            </thead>
            <tbody>
              {propiedadesPropias.map(p => (
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
                  <td style={styles.td}>
                  <button
                    onClick={() => handleVerImagenes(p)}
                    style={styles.botonImagenes}
                  >
                      Gestionar Imagenes
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
        {mostrarImagenes && propiedadSeleccionada && (
          <div style={styles.modalOverlay}>
            <div style={styles.modal}>
              <div style={styles.modalHeader}>
                <h3 style={styles.modalTitulo}>
                  🖼️ Imágenes — {propiedadSeleccionada.titulo}
                </h3>
                <button
                  onClick={() => { setMostrarImagenes(false); setPropiedadSeleccionada(null); setImagenes([]); setArchivosImagen([]) }}
                  style={styles.botonCerrar}
                >
                  ✕
                </button>
              </div>

              <div style={styles.agregarImagen}>
                <h4 style={{ margin: '0 0 1rem 0', color: '#1a1a2e' }}>Agregar imágenes</h4>
                <div style={styles.campo}>
                  <label style={styles.label}>Selecciona una o varias fotos (PC o móvil) *</label>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => setArchivosImagen(Array.from(e.target.files))}
                    style={styles.input}
                  />
                </div>
                {archivosImagen.length > 0 && (
                  <p style={{ fontSize: '0.85rem', color: '#555' }}>
                    {archivosImagen.length} archivo(s) seleccionado(s)
                  </p>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0.5rem 0' }}>
                  <input
                    type="checkbox"
                    id="esPortada"
                    checked={esPortada}
                    onChange={(e) => setEsPortada(e.target.checked)}
                  />
                  <label htmlFor="esPortada" style={styles.label}>
                    Usar la primera imagen del lote como portada
                  </label>
                </div>
                <button onClick={handleAgregarImagenes} style={styles.botonGuardar} disabled={subiendoImagen}>
                  {subiendoImagen ? 'Subiendo...' : 'Agregar imágenes'}
                </button>
              </div>

              <div style={styles.listaImagenes}>
                {imagenes.length === 0 ? (
                  <p style={styles.mensaje}>No hay imágenes registradas para esta propiedad.</p>
                ) : (
                  <div style={styles.gridImagenes}>
                    {imagenes.map(img => (
                      <div key={img.id_imagen} style={styles.imagenCard}>
                        <img
                          src={img.url_imagen}
                          alt="Propiedad"
                          style={styles.imagen}
                          onError={(e) => { e.target.src = 'https://via.placeholder.com/150?text=Sin+imagen' }}
                        />
                        {img.es_portada ? (
                          <span style={styles.badgePortada}>⭐ Portada</span>
                        ) : (
                          <button
                            onClick={() => handleMarcarPortada(img.id_imagen)}
                            style={styles.botonImagenes}
                          >
                            Usar como portada
                          </button>
                        )}
                        <button
                          onClick={() => handleEliminarImagen(img.id_imagen)}
                          style={styles.botonEliminar}
                        >
                          🗑️ Eliminar
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
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
    gap: '1rem',
    flexWrap: 'wrap',
    marginBottom: '1rem'
  },
  seccionTitulo: { fontSize: '1.2rem', color: '#1a1a2e', margin: 0 },
  botonConsulta: {
    padding: '0.5rem 1.2rem',
    backgroundColor: '#e94560',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '0.9rem',
    textDecoration: 'none',
    marginLeft: 'auto'
  },
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
  mensaje: { textAlign: 'center', color: '#888', padding: '2rem' },
    inputDeposito: {
      width: '100px',
      padding: '0.4rem 0.6rem',
      borderRadius: '4px',
      border: '1px solid #ddd',
      fontSize: '0.85rem'
    },
    botonAprobar: {
      padding: '0.4rem 0.8rem',
      backgroundColor: '#28a745',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '0.8rem',
      fontWeight: 'bold'
    },
    botonRechazar: {
      padding: '0.4rem 0.8rem',
      backgroundColor: '#e94560',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '0.8rem',
      fontWeight: 'bold'
    },
    botonImagenes: {
      padding: '0.4rem 0.8rem',
      backgroundColor: '#1a1a2e',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '0.8rem'
    },
    modalOverlay: {
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    },
    modal: {
      backgroundColor: 'white',
      borderRadius: '8px',
      padding: '2rem',
      width: '90%',
      maxWidth: '700px',
      maxHeight: '80vh',
      overflowY: 'auto',
      boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
    },
    modalHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '1.5rem'
    },
    modalTitulo: {
      fontSize: '1.2rem',
      color: '#1a1a2e',
      margin: 0
    },
    botonCerrar: {
      backgroundColor: 'transparent',
      border: 'none',
      fontSize: '1.2rem',
      cursor: 'pointer',
      color: '#888'
    },
    agregarImagen: {
      backgroundColor: '#f9f9f9',
      borderRadius: '8px',
      padding: '1.2rem',
      marginBottom: '1.5rem',
      border: '1px solid #eee'
    },
    listaImagenes: {
      marginTop: '1rem'
    },
    gridImagenes: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
      gap: '1rem'
    },
    imagenCard: {
      borderRadius: '8px',
      overflow: 'hidden',
      border: '1px solid #eee',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.3rem',
      padding: '0 0 0.3rem 0'
    },
    imagen: {
      width: '100%',
      height: '120px',
      objectFit: 'cover'
    },
    badgePortada: {
      backgroundColor: '#ffc107',
      color: '#1a1a2e',
      fontSize: '0.75rem',
      fontWeight: 'bold',
      padding: '0.3rem 0.5rem',
      textAlign: 'center'
    },
    botonEliminar: {
      padding: '0.4rem',
      backgroundColor: '#e94560',
      color: 'white',
      border: 'none',
      cursor: 'pointer',
      fontSize: '0.8rem',
      width: '100%'
    }
  }

export default PanelAdmin