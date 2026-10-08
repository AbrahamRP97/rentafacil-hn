import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getPropiedades, getReservas, getContratos, getPagos, createPropiedad,
  getImagenes, uploadImagen, deleteImagen, setImagenPortada, getPropietarioPorAuth,
  aprobarReserva, updateReserva, enviarMensaje, cancelarContrato, createUbicacion,
  createCalificacion, updatePropiedad, updateUbicacion } from '../services/api'
import SimuladorPrecios from '../components/SimuladorPrecios'
import SelectorUbicacion from '../components/SelectorUbicacion'

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
  const [checkinPorReserva, setCheckinPorReserva] = useState({})
  const [procesandoReserva, setProcesandoReserva] = useState(null)
  const [mostrarHistorialPagos, setMostrarHistorialPagos] = useState(false)
  const [mostrarContratos, setMostrarContratos] = useState(false)
  const [contratoACalificar, setContratoACalificar] = useState(null)
  const [puntuacionCalificar, setPuntuacionCalificar] = useState(0)
  const [comentarioCalificar, setComentarioCalificar] = useState('')
  const [enviandoCalificacion, setEnviandoCalificacion] = useState(false)

  const [loading, setLoading] = useState(true)
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [imagenes, setImagenes] = useState([])
  const [propiedadSeleccionada, setPropiedadSeleccionada] = useState(null)
  const [archivosImagen, setArchivosImagen] = useState([])
  const [esPortada, setEsPortada] = useState(false)
  const [mostrarImagenes, setMostrarImagenes] = useState(false)
  const [subiendoImagen, setSubiendoImagen] = useState(false)
  const [exito, setExito] = useState(false)

  // Edición de una propiedad ya publicada
  const [propiedadEditando, setPropiedadEditando] = useState(null)
  const [formEdicion, setFormEdicion] = useState({})
  const [guardandoEdicion, setGuardandoEdicion] = useState(false)
  const [errorEdicion, setErrorEdicion] = useState(null)
  const [exitoEdicion, setExitoEdicion] = useState(null)
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
    acepta_estadias_cortas: true,
    estancia_minima_noches: '1',
    departamento: '',
    municipio: '',
    direccion: ''
  })

  // Pin de ubicación que el propietario coloca en el mapa al crear una propiedad
  const [coordenadas, setCoordenadas] = useState({ latitud: null, longitud: null })

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

  const contratosConDetalle = contratosPropios.map(c => {
    const reservaRelacionada = reservas.find(r => r.id_reserva === c.id_reserva)
    return { ...c, reserva: reservaRelacionada }
  })

  const pagosConDetalle = pagosPropios.map(p => {
    const contratoRelacionado = contratosConDetalle.find(c => c.id_contrato === p.id_contrato)
    return { ...p, contrato: contratoRelacionado }
  }).sort((a, b) => new Date(b.fecha_pago) - new Date(a.fecha_pago))

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
      const instrucciones = checkinPorReserva[id_reserva]
      await aprobarReserva({
        id_reserva,
        deposito: deposito ? parseFloat(deposito) : null,
        instrucciones_checkin: instrucciones || null
      })

      const reserva = reservasPendientes.find(r => r.id_reserva === id_reserva)
      if (reserva) {
        let contenido = `✅ Tu solicitud de reserva para "${reserva.PROPIEDADES?.titulo}" (${reserva.fecha_inicio} al ${reserva.fecha_fin}) fue aprobada. Ya puedes revisar y firmar tu contrato digital en "Mis reservas".`
        if (instrucciones) {
          contenido += `\n\n📋 Instrucciones de check-in:\n${instrucciones}`
        }
        await enviarMensaje({
          id_propiedad: reserva.id_propiedad,
          id_propietario: reserva.PROPIEDADES?.id_propietario,
          id_inquilino: reserva.id_inquilino,
          remitente: 'propietario',
          contenido
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

  const handleCancelarContrato = async (id_contrato) => {
    setProcesandoReserva(id_contrato)
    setError(null)
    try {
      await cancelarContrato({ id_contrato })

      const contrato = contratosConDetalle.find(c => c.id_contrato === id_contrato)
      if (contrato?.reserva) {
        await enviarMensaje({
          id_propiedad: contrato.reserva.id_propiedad,
          id_propietario: contrato.reserva.PROPIEDADES?.id_propietario,
          id_inquilino: contrato.reserva.id_inquilino,
          remitente: 'propietario',
          contenido: `⚠️ El contrato de "${contrato.reserva.PROPIEDADES?.titulo}" fue cancelado por el propietario.`
        }).catch(() => {})
      }

      cargarDatos()
    } catch (err) {
      setError('Error al cancelar el contrato. Intenta de nuevo.')
    } finally {
      setProcesandoReserva(null)
    }
  }

  const handleAbrirCalificar = (id_contrato) => {
    setContratoACalificar(id_contrato)
    setPuntuacionCalificar(0)
    setComentarioCalificar('')
  }

  const handleEnviarCalificacion = async () => {
    if (!puntuacionCalificar) {
      setError('Selecciona una puntuación antes de enviar')
      return
    }
    setEnviandoCalificacion(true)
    setError(null)
    try {
      await createCalificacion({
        id_contrato: contratoACalificar,
        tipo_autor: 'propietario',
        puntuacion: puntuacionCalificar,
        comentario: comentarioCalificar || null
      })
      setContratoACalificar(null)
      cargarDatos()
    } catch (err) {
      setError('Error al enviar la calificación. Intenta de nuevo.')
    } finally {
      setEnviandoCalificacion(false)
    }
  }

  const handleAbrirEditar = (p) => {
    setErrorEdicion(null)
    setPropiedadEditando(p)
    setFormEdicion({
      titulo: p.titulo || '',
      descripcion: p.descripcion || '',
      tipo: p.tipo || 'apartamento',
      precio_mensual: String(p.precio_mensual ?? ''),
      habitaciones: String(p.habitaciones ?? ''),
      banos: String(p.banos ?? ''),
      metros_cuadrados: p.metros_cuadrados != null ? String(p.metros_cuadrados) : '',
      acepta_estadias_cortas: p.acepta_estadias_cortas !== false,
      estancia_minima_noches: String(p.estancia_minima_noches ?? 1),
      departamento: p.UBICACIONES?.departamento || '',
      municipio: p.UBICACIONES?.municipio || '',
      direccion: p.UBICACIONES?.direccion || '',
      latitud: p.UBICACIONES?.latitud ?? null,
      longitud: p.UBICACIONES?.longitud ?? null
    })
  }

  const handleCambioEdicion = (e) => {
    setFormEdicion({ ...formEdicion, [e.target.name]: e.target.value })
  }

  const handleGuardarEdicion = async () => {
    setErrorEdicion(null)

    const precio = parseFloat(formEdicion.precio_mensual)
    const estanciaMinima = parseInt(formEdicion.estancia_minima_noches)

    if (!formEdicion.titulo.trim()) {
      setErrorEdicion('El título es obligatorio')
      return
    }
    if (!precio || precio <= 0) {
      setErrorEdicion('La renta mensual debe ser mayor que cero')
      return
    }
    if (!estanciaMinima || estanciaMinima < 1) {
      setErrorEdicion('La estancia mínima debe ser de al menos 1 noche')
      return
    }
    if (!formEdicion.departamento.trim() || !formEdicion.municipio.trim() || !formEdicion.direccion.trim()) {
      setErrorEdicion('El departamento, el municipio y la dirección son obligatorios')
      return
    }

    setGuardandoEdicion(true)
    try {
      // Ubicación: solo se toca si el propietario cambió la dirección o el pin
      const u = propiedadEditando.UBICACIONES || {}
      const num = (v) => (v === null || v === undefined || v === '' ? null : Number(v))
      const datosUbicacion = {
        departamento: formEdicion.departamento.trim(),
        municipio: formEdicion.municipio.trim(),
        direccion: formEdicion.direccion.trim(),
        latitud: num(formEdicion.latitud),
        longitud: num(formEdicion.longitud)
      }
      const cambioUbicacion =
        datosUbicacion.departamento !== (u.departamento || '') ||
        datosUbicacion.municipio !== (u.municipio || '') ||
        datosUbicacion.direccion !== (u.direccion || '') ||
        datosUbicacion.latitud !== num(u.latitud) ||
        datosUbicacion.longitud !== num(u.longitud)

      let idUbicacion = propiedadEditando.id_ubicacion
      if (cambioUbicacion) {
        // Si otra propiedad comparte esta misma ubicación (datos antiguos), no se modifica:
        // se crea una ubicación nueva para esta propiedad y se vincula a ella.
        const compartida = propiedades.filter(x => x.id_ubicacion === idUbicacion).length > 1
        if (compartida || !idUbicacion) {
          const resNueva = await createUbicacion(datosUbicacion)
          idUbicacion = resNueva.data.id_ubicacion
        } else {
          await updateUbicacion(idUbicacion, datosUbicacion)
        }
      }

      await updatePropiedad(propiedadEditando.id_propiedad, {
        id_ubicacion: idUbicacion,
        titulo: formEdicion.titulo.trim(),
        descripcion: formEdicion.descripcion,
        tipo: formEdicion.tipo,
        precio_mensual: precio,
        habitaciones: parseInt(formEdicion.habitaciones) || 1,
        banos: parseInt(formEdicion.banos) || 1,
        metros_cuadrados: parseFloat(formEdicion.metros_cuadrados) || null,
        acepta_estadias_cortas: formEdicion.acepta_estadias_cortas,
        estancia_minima_noches: estanciaMinima
      })
      setPropiedadEditando(null)
      setExitoEdicion('Propiedad actualizada correctamente')
      cargarDatos()
      setTimeout(() => setExitoEdicion(null), 3000)
    } catch (err) {
      setErrorEdicion('Error al guardar los cambios. Intenta de nuevo.')
    } finally {
      setGuardandoEdicion(false)
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

    if (!form.titulo || !form.precio_mensual || !form.departamento || !form.municipio || !form.direccion) {
      setError('Por favor completa todos los campos obligatorios')
      return
    }

    const estanciaMinima = parseInt(form.estancia_minima_noches)
    if (!estanciaMinima || estanciaMinima < 1) {
      setError('La estancia mínima debe ser de al menos 1 noche')
      return
    }

    try {
      // Primero se crea la ubicación real que escribió el propietario
      const resUbicacion = await createUbicacion({
        departamento: form.departamento,
        municipio: form.municipio,
        direccion: form.direccion,
        latitud: coordenadas.latitud,
        longitud: coordenadas.longitud
      })
      const idNuevaUbicacion = resUbicacion.data.id_ubicacion

      const { departamento, municipio, direccion, ...datosPropiedad } = form

      const res = await createPropiedad({
        ...datosPropiedad,
        precio_mensual:   parseFloat(form.precio_mensual),
        habitaciones:     parseInt(form.habitaciones),
        banos:            parseInt(form.banos),
        metros_cuadrados: parseFloat(form.metros_cuadrados),
        acepta_estadias_cortas: form.acepta_estadias_cortas,
        estancia_minima_noches: estanciaMinima,
        id_propietario:   propietarioActual.id_propietario,
        id_ubicacion:     idNuevaUbicacion
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
        acepta_estadias_cortas: true, estancia_minima_noches: '1',
        departamento: '', municipio: '', direccion: ''
      })
      setCoordenadas({ latitud: null, longitud: null })
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
          <span style={styles.statNumero}>{contratosConDetalle.filter(c => c.estado === 'activo').length}</span>
          <span style={styles.statLabel}>Mis contratos activos</span>
        </div>
        <div style={styles.statCard}>
          <span style={styles.statIcono}>💰</span>
          <span style={styles.statNumero}>{pagosPropios.length}</span>
          <span style={styles.statLabel}>Mis pagos</span>
        </div>
      </div>

      {exito && <p style={styles.exito}>✅ Propiedad creada exitosamente</p>}
      {exitoEdicion && <p style={styles.exito}>✅ {exitoEdicion}</p>}
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
                <th style={styles.th}>Instrucciones check-in</th>
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
                    <textarea
                      placeholder="Ej: código de la puerta, hora de llegada, contacto..."
                      value={checkinPorReserva[r.id_reserva] || ''}
                      onChange={(e) => setCheckinPorReserva({
                        ...checkinPorReserva,
                        [r.id_reserva]: e.target.value
                      })}
                      style={styles.textareaCheckin}
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

      {contratosConDetalle.length > 0 && (
        <div style={styles.seccion}>
          <div
            style={styles.resumenPagosHeader}
            onClick={() => setMostrarContratos(!mostrarContratos)}
          >
            <div>
              <h3 style={{ ...styles.seccionTitulo, margin: 0 }}>Mis contratos</h3>
              <p style={styles.resumenPagosTexto}>
                {contratosConDetalle.filter(c => c.estado === 'activo').length} activo(s) de {contratosConDetalle.length} en total
              </p>
            </div>
            <span style={styles.flechaToggle}>{mostrarContratos ? '▲' : '▼'}</span>
          </div>

          {mostrarContratos && (
            <table style={{ ...styles.tabla, marginTop: '1rem' }}>
              <thead>
                <tr>
                  <th style={styles.th}>Propiedad</th>
                  <th style={styles.th}>Inquilino</th>
                  <th style={styles.th}>Del</th>
                  <th style={styles.th}>Al</th>
                  <th style={styles.th}>Monto</th>
                  <th style={styles.th}>Depósito</th>
                  <th style={styles.th}>Estado</th>
                  <th style={styles.th}>Acción</th>
                </tr>
              </thead>
              <tbody>
                {contratosConDetalle.map(c => (
                  <tr key={c.id_contrato} style={styles.tr}>
                    <td style={styles.td}>{c.reserva?.PROPIEDADES?.titulo}</td>
                    <td style={styles.td}>{c.reserva?.INQUILINOS?.nombre} {c.reserva?.INQUILINOS?.apellido}</td>
                    <td style={styles.td}>{c.fecha_inicio}</td>
                    <td style={styles.td}>{c.fecha_fin}</td>
                    <td style={styles.td}>
                      {c.monto_total != null ? `L. ${c.monto_total}` : `L. ${c.monto_mensual} / mes`}
                    </td>
                    <td style={styles.td}>L. {c.deposito}</td>
                    <td style={styles.td}>
                      <span style={{
                        ...styles.badge,
                        backgroundColor: c.estado === 'activo' ? '#28a745' : c.estado === 'cancelado' ? '#e94560' : '#ffc107'
                      }}>
                        {c.estado}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <Link to={`/contrato/${c.id_contrato}`} style={styles.botonImagenes}>
                          Ver contrato
                        </Link>
                        {c.estado === 'activo' && (
                          <button
                            onClick={() => handleCancelarContrato(c.id_contrato)}
                            style={styles.botonRechazar}
                            disabled={procesandoReserva === c.id_contrato}
                          >
                            {procesandoReserva === c.id_contrato ? '...' : 'Cancelar'}
                          </button>
                        )}
                        {c.estado === 'cancelado' && (
                          c.CALIFICACIONES?.find(cal => cal.tipo_autor === 'propietario') ? (
                            <span style={styles.calificacionYaEnviada}>
                              {'★'.repeat(c.CALIFICACIONES.find(cal => cal.tipo_autor === 'propietario').puntuacion)}
                              {'☆'.repeat(5 - c.CALIFICACIONES.find(cal => cal.tipo_autor === 'propietario').puntuacion)}
                            </span>
                          ) : (
                            <button
                              onClick={() => handleAbrirCalificar(c.id_contrato)}
                              style={styles.botonImagenes}
                            >
                              ⭐ Calificar inquilino
                            </button>
                          )
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {pagosConDetalle.length > 0 && (
        <div style={styles.seccion}>
          <div
            style={styles.resumenPagosHeader}
            onClick={() => setMostrarHistorialPagos(!mostrarHistorialPagos)}
          >
            <div>
              <h3 style={{ ...styles.seccionTitulo, margin: 0 }}>Historial de pagos</h3>
              <p style={styles.resumenPagosTexto}>
                {pagosConDetalle.length} pago(s) · Total: L. {pagosConDetalle.reduce((s, p) => s + parseFloat(p.monto), 0).toFixed(2)}
              </p>
            </div>
            <span style={styles.flechaToggle}>{mostrarHistorialPagos ? '▲' : '▼'}</span>
          </div>

          {mostrarHistorialPagos && (
            <table style={{ ...styles.tabla, marginTop: '1rem' }}>
              <thead>
                <tr>
                  <th style={styles.th}>Propiedad</th>
                  <th style={styles.th}>Inquilino</th>
                  <th style={styles.th}>Monto</th>
                  <th style={styles.th}>Método</th>
                  <th style={styles.th}>Fecha</th>
                  <th style={styles.th}>Comprobante</th>
                </tr>
              </thead>
              <tbody>
                {pagosConDetalle.map(p => (
                  <tr key={p.id_pago} style={styles.tr}>
                    <td style={styles.td}>{p.contrato?.reserva?.PROPIEDADES?.titulo}</td>
                    <td style={styles.td}>{p.contrato?.reserva?.INQUILINOS?.nombre} {p.contrato?.reserva?.INQUILINOS?.apellido}</td>
                    <td style={styles.td}>L. {p.monto}</td>
                    <td style={styles.td}>{p.metodo_pago}</td>
                    <td style={styles.td}>{p.fecha_pago}</td>
                    <td style={styles.td}>
                      {p.referencia && p.referencia.startsWith('http') ? (
                        <a href={p.referencia} target="_blank" rel="noreferrer" style={styles.botonImagenes}>
                          Ver comprobante
                        </a>
                      ) : (
                        p.referencia || '—'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      <div style={styles.seccion}>
        <div style={styles.seccionHeader}>
          <h3 style={styles.seccionTitulo}>Mis propiedades</h3>
          <Link to="/admin/consultas-avanzadas" style={styles.botonConsulta}>
            Consultas avanzadas
          </Link>
          <Link to="/admin/asistente-ia" style={styles.botonConsulta}>
            🤖 Asistente IA
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
                <label style={styles.label}>Renta mensual que deseas recibir (L.) *</label>
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

            <div style={styles.bloqueEstadias}>
              <p style={styles.tituloEstadias}>Estadías cortas</p>
              <p style={styles.textoEstadias}>
                A partir de tu renta mensual, el sistema calcula automáticamente cuánto se cobra por estadías
                más cortas o más largas.
              </p>
              <SimuladorPrecios precioMensual={form.precio_mensual} />
              <div style={styles.fila}>
                <div style={styles.checkEstadias}>
                  <input
                    type="checkbox"
                    id="aceptaCortas"
                    checked={form.acepta_estadias_cortas}
                    onChange={(e) => setForm({ ...form, acepta_estadias_cortas: e.target.checked })}
                  />
                  <label htmlFor="aceptaCortas" style={styles.label}>Acepto estadías de menos de 28 noches</label>
                </div>
                <div style={styles.campo}>
                  <label style={styles.label}>Estancia mínima (noches)</label>
                  <input type="number" min="1" name="estancia_minima_noches" value={form.estancia_minima_noches} onChange={handleChange} style={styles.input} />
                </div>
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
                <label style={styles.label}>Departamento *</label>
                <input type="text" name="departamento" value={form.departamento} onChange={handleChange} placeholder="Cortés" style={styles.input} />
              </div>
              <div style={styles.campo}>
                <label style={styles.label}>Municipio *</label>
                <input type="text" name="municipio" value={form.municipio} onChange={handleChange} placeholder="San Pedro Sula" style={styles.input} />
              </div>
            </div>
            <div style={styles.campo}>
              <label style={styles.label}>Dirección exacta *</label>
              <input type="text" name="direccion" value={form.direccion} onChange={handleChange} placeholder="Colonia Trejo, calle principal, casa #12" style={styles.input} />
            </div>

            <div style={styles.campo}>
              <label style={styles.label}>Ubicación exacta en el mapa</label>
              <SelectorUbicacion
                latitud={coordenadas.latitud}
                longitud={coordenadas.longitud}
                onChange={setCoordenadas}
                departamento={form.departamento}
                municipio={form.municipio}
                direccion={form.direccion}
              />
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
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <button
                        onClick={() => handleAbrirEditar(p)}
                        style={styles.botonEditar}
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleVerImagenes(p)}
                        style={styles.botonImagenes}
                      >
                        Gestionar Imagenes
                      </button>
                    </div>
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

        {/* Modal de edición de propiedad */}
        {propiedadEditando && (() => {
          const pendientes = reservasPendientes.filter(r => r.id_propiedad === propiedadEditando.id_propiedad).length
          const precioCambio = parseFloat(formEdicion.precio_mensual) !== parseFloat(propiedadEditando.precio_mensual)

          return (
            <div style={styles.modalOverlay}>
              <div style={{ ...styles.modal, maxWidth: '640px' }}>
                <div style={styles.modalHeader}>
                  <h3 style={styles.modalTitulo}>✏️ Editar — {propiedadEditando.titulo}</h3>
                  <button onClick={() => setPropiedadEditando(null)} style={styles.botonCerrar}>✕</button>
                </div>

                {errorEdicion && <p style={styles.error}>{errorEdicion}</p>}

                <div style={styles.fila}>
                  <div style={styles.campo}>
                    <label style={styles.label}>Título *</label>
                    <input name="titulo" value={formEdicion.titulo} onChange={handleCambioEdicion} style={styles.input} />
                  </div>
                  <div style={styles.campo}>
                    <label style={styles.label}>Tipo</label>
                    <select name="tipo" value={formEdicion.tipo} onChange={handleCambioEdicion} style={styles.input}>
                      <option value="apartamento">Apartamento</option>
                      <option value="casa">Casa</option>
                      <option value="local">Local comercial</option>
                      <option value="cuarto">Cuarto</option>
                    </select>
                  </div>
                </div>

                <div style={styles.campo}>
                  <label style={styles.label}>Descripción</label>
                  <textarea name="descripcion" value={formEdicion.descripcion} onChange={handleCambioEdicion} style={styles.textarea} />
                </div>

                <div style={styles.fila}>
                  <div style={styles.campo}>
                    <label style={styles.label}>Habitaciones</label>
                    <input type="number" name="habitaciones" value={formEdicion.habitaciones} onChange={handleCambioEdicion} style={styles.input} />
                  </div>
                  <div style={styles.campo}>
                    <label style={styles.label}>Baños</label>
                    <input type="number" name="banos" value={formEdicion.banos} onChange={handleCambioEdicion} style={styles.input} />
                  </div>
                  <div style={styles.campo}>
                    <label style={styles.label}>Metros cuadrados</label>
                    <input type="number" name="metros_cuadrados" value={formEdicion.metros_cuadrados} onChange={handleCambioEdicion} style={styles.input} />
                  </div>
                </div>

                <div style={styles.fila}>
                  <div style={styles.campo}>
                    <label style={styles.label}>Departamento *</label>
                    <input name="departamento" value={formEdicion.departamento} onChange={handleCambioEdicion} style={styles.input} />
                  </div>
                  <div style={styles.campo}>
                    <label style={styles.label}>Municipio *</label>
                    <input name="municipio" value={formEdicion.municipio} onChange={handleCambioEdicion} style={styles.input} />
                  </div>
                </div>
                <div style={styles.campo}>
                  <label style={styles.label}>Dirección exacta *</label>
                  <input name="direccion" value={formEdicion.direccion} onChange={handleCambioEdicion} style={styles.input} />
                </div>

                <div style={styles.campo}>
                  <label style={styles.label}>Ubicación exacta en el mapa</label>
                  <SelectorUbicacion
                    latitud={formEdicion.latitud}
                    longitud={formEdicion.longitud}
                    onChange={({ latitud, longitud }) => setFormEdicion(f => ({ ...f, latitud, longitud }))}
                    departamento={formEdicion.departamento}
                    municipio={formEdicion.municipio}
                    direccion={formEdicion.direccion}
                  />
                </div>

                <div style={styles.campo}>
                  <label style={styles.label}>Renta mensual que deseas recibir (L.) *</label>
                  <input type="number" name="precio_mensual" value={formEdicion.precio_mensual} onChange={handleCambioEdicion} style={styles.input} />
                </div>

                {precioCambio && (
                  <p style={styles.avisoEdicion}>
                    Los contratos ya aprobados no cambian: conservan el precio con el que se firmaron.
                    {pendientes > 0 && ` Esta propiedad tiene ${pendientes} solicitud(es) pendiente(s); se aprobarán con el nuevo precio, que puede ser distinto al que vio el inquilino al solicitar.`}
                  </p>
                )}

                <div style={styles.bloqueEstadias}>
                  <p style={styles.tituloEstadias}>Estadías cortas</p>
                  <SimuladorPrecios precioMensual={formEdicion.precio_mensual} />
                  <div style={styles.fila}>
                    <div style={styles.checkEstadias}>
                      <input
                        type="checkbox"
                        id="aceptaCortasEdicion"
                        checked={formEdicion.acepta_estadias_cortas}
                        onChange={(e) => setFormEdicion({ ...formEdicion, acepta_estadias_cortas: e.target.checked })}
                      />
                      <label htmlFor="aceptaCortasEdicion" style={styles.label}>Acepto estadías de menos de 28 noches</label>
                    </div>
                    <div style={styles.campo}>
                      <label style={styles.label}>Estancia mínima (noches)</label>
                      <input type="number" min="1" name="estancia_minima_noches" value={formEdicion.estancia_minima_noches} onChange={handleCambioEdicion} style={styles.input} />
                    </div>
                  </div>
                </div>

                <p style={styles.notaEdicion}>
                  El estado de la propiedad no se edita aquí: cambia solo con las
                  reservas y contratos.
                </p>

                <button onClick={handleGuardarEdicion} style={styles.botonGuardar} disabled={guardandoEdicion}>
                  {guardandoEdicion ? 'Guardando...' : 'Guardar cambios'}
                </button>
              </div>
            </div>
          )
        })()}

        {/* Modal de calificación */}
        {contratoACalificar && (
          <div style={styles.modalOverlay}>
            <div style={{ ...styles.modal, maxWidth: '400px' }}>
              <div style={styles.modalHeader}>
                <h3 style={styles.modalTitulo}>⭐ Calificar al inquilino</h3>
                <button onClick={() => setContratoACalificar(null)} style={styles.botonCerrar}>✕</button>
              </div>

              {error && <p style={styles.error}>{error}</p>}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'center' }}>
                  {[1, 2, 3, 4, 5].map(n => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setPuntuacionCalificar(n)}
                      style={{ background: 'none', border: 'none', fontSize: '2rem', color: '#ffc107', cursor: 'pointer', padding: 0 }}
                    >
                      {n <= puntuacionCalificar ? '★' : '☆'}
                    </button>
                  ))}
                </div>
                <textarea
                  placeholder="Comentario (opcional)"
                  value={comentarioCalificar}
                  onChange={(e) => setComentarioCalificar(e.target.value)}
                  style={styles.textarea}
                />
                <button
                  onClick={handleEnviarCalificacion}
                  style={styles.botonGuardar}
                  disabled={enviandoCalificacion}
                >
                  {enviandoCalificacion ? 'Enviando...' : 'Enviar calificación'}
                </button>
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
    resumenPagosHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      cursor: 'pointer'
    },
    resumenPagosTexto: {
      margin: '0.3rem 0 0 0',
      fontSize: '0.85rem',
      color: '#888'
    },
    flechaToggle: {
      color: '#888',
      fontSize: '0.9rem'
    },
    calificacionYaEnviada: {
      fontSize: '0.9rem',
      color: '#ffc107',
      alignSelf: 'center'
    },
    botonEditar: {
      padding: '0.4rem 0.8rem',
      backgroundColor: '#e94560',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '0.8rem',
      fontWeight: 'bold'
    },
    avisoEdicion: {
      backgroundColor: '#fff4e0',
      color: '#b26a00',
      padding: '0.7rem 0.9rem',
      borderRadius: '4px',
      fontSize: '0.82rem',
      margin: '0 0 1rem 0',
      lineHeight: 1.5
    },
    notaEdicion: {
      fontSize: '0.78rem',
      color: '#888',
      margin: '0 0 0.5rem 0'
    },
    bloqueEstadias: {
      backgroundColor: '#fff',
      border: '1px solid #eee',
      borderRadius: '8px',
      padding: '1rem 1.2rem',
      marginBottom: '1rem'
    },
    tituloEstadias: {
      margin: '0 0 0.3rem 0',
      fontWeight: 'bold',
      color: '#1a1a2e',
      fontSize: '0.95rem'
    },
    textoEstadias: {
      margin: '0 0 0.8rem 0',
      fontSize: '0.82rem',
      color: '#666',
      lineHeight: 1.5
    },
    checkEstadias: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem'
    },
    inputDeposito: {
      width: '100px',
      padding: '0.4rem 0.6rem',
      borderRadius: '4px',
      border: '1px solid #ddd',
      fontSize: '0.85rem'
    },
    textareaCheckin: {
      width: '160px',
      minHeight: '50px',
      padding: '0.4rem 0.6rem',
      borderRadius: '4px',
      border: '1px solid #ddd',
      fontSize: '0.8rem',
      resize: 'vertical'
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