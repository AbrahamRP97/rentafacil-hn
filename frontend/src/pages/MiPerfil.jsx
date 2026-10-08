import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../services/supabaseClient'
import { getMiPerfil, updateMiPerfil, subirFotoPerfil, quitarFotoPerfil } from '../services/api'

const MAX_FOTO_MB = 3
const TIPOS_FOTO = ['image/jpeg', 'image/png', 'image/webp']

function MiPerfil() {
  const { usuario } = useAuth()
  const inputFoto = useRef(null)

  const [perfil, setPerfil] = useState(null)
  const [rol, setRol] = useState(null)
  const [form, setForm] = useState({ nombre: '', apellido: '', telefono: '', ciudad: '', biografia: '' })
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [subiendoFoto, setSubiendoFoto] = useState(false)
  const [mensaje, setMensaje] = useState(null) // { tipo: 'ok' | 'error', texto }

  const [nuevoEmail, setNuevoEmail] = useState('')
  const [msgEmail, setMsgEmail] = useState(null)
  const [cambiandoEmail, setCambiandoEmail] = useState(false)

  const [passwords, setPasswords] = useState({ nueva: '', confirmar: '' })
  const [msgPassword, setMsgPassword] = useState(null)
  const [cambiandoPassword, setCambiandoPassword] = useState(false)

  const aplicarPerfil = (p) => {
    setPerfil(p)
    setForm({
      nombre: p.nombre || '',
      apellido: p.apellido || '',
      telefono: p.telefono || '',
      ciudad: p.ciudad || '',
      biografia: p.biografia || ''
    })
  }

  useEffect(() => {
    let cancelado = false
    getMiPerfil()
      .then(res => {
        if (cancelado) return
        setRol(res.data.rol)
        aplicarPerfil(res.data.perfil)
      })
      .catch(e => {
        if (!cancelado) setMensaje({ tipo: 'error', texto: e.response?.data?.error || 'No se pudo cargar tu perfil' })
      })
      .finally(() => { if (!cancelado) setCargando(false) })
    return () => { cancelado = true }
  }, [])

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleGuardar = async () => {
    setMensaje(null)
    if (!form.nombre.trim() || !form.apellido.trim()) {
      setMensaje({ tipo: 'error', texto: 'Nombre y apellido son obligatorios' })
      return
    }
    setGuardando(true)
    try {
      const res = await updateMiPerfil(form)
      aplicarPerfil(res.data.perfil)
      // Mantiene sincronizados los datos de la sesión (se usan en la barra superior)
      await supabase.auth.updateUser({
        data: { nombre: form.nombre.trim(), apellido: form.apellido.trim(), telefono: form.telefono.trim() }
      })
      setMensaje({ tipo: 'ok', texto: 'Perfil actualizado correctamente' })
    } catch (e) {
      setMensaje({ tipo: 'error', texto: e.response?.data?.error || 'No se pudo guardar el perfil' })
    } finally {
      setGuardando(false)
    }
  }

  const handleElegirFoto = async (e) => {
    const archivo = e.target.files?.[0]
    e.target.value = ''
    if (!archivo) return
    setMensaje(null)

    if (!TIPOS_FOTO.includes(archivo.type)) {
      setMensaje({ tipo: 'error', texto: 'La foto debe ser JPG, PNG o WEBP' })
      return
    }
    if (archivo.size > MAX_FOTO_MB * 1024 * 1024) {
      setMensaje({ tipo: 'error', texto: `La foto no puede pesar más de ${MAX_FOTO_MB} MB` })
      return
    }

    setSubiendoFoto(true)
    try {
      const res = await subirFotoPerfil(archivo)
      setPerfil(res.data.perfil)
      await supabase.auth.updateUser({ data: { foto_url: res.data.perfil.foto_url } })
      setMensaje({ tipo: 'ok', texto: 'Foto actualizada' })
    } catch (err) {
      setMensaje({ tipo: 'error', texto: err.response?.data?.error || 'No se pudo subir la foto' })
    } finally {
      setSubiendoFoto(false)
    }
  }

  const handleQuitarFoto = async () => {
    setMensaje(null)
    setSubiendoFoto(true)
    try {
      const res = await quitarFotoPerfil()
      setPerfil(res.data.perfil)
      await supabase.auth.updateUser({ data: { foto_url: '' } })
      setMensaje({ tipo: 'ok', texto: 'Foto eliminada' })
    } catch (err) {
      setMensaje({ tipo: 'error', texto: err.response?.data?.error || 'No se pudo quitar la foto' })
    } finally {
      setSubiendoFoto(false)
    }
  }

  const handleCambiarEmail = async () => {
    setMsgEmail(null)
    const correo = nuevoEmail.trim()
    if (!/^\S+@\S+\.\S+$/.test(correo)) {
      setMsgEmail({ tipo: 'error', texto: 'Escribe un correo válido' })
      return
    }
    if (correo.toLowerCase() === (usuario?.email || '').toLowerCase()) {
      setMsgEmail({ tipo: 'error', texto: 'Ese ya es tu correo actual' })
      return
    }
    setCambiandoEmail(true)
    const { error } = await supabase.auth.updateUser({ email: correo })
    setCambiandoEmail(false)
    if (error) {
      setMsgEmail({ tipo: 'error', texto: 'No se pudo cambiar el correo: ' + error.message })
      return
    }
    setNuevoEmail('')
    setMsgEmail({
      tipo: 'ok',
      texto: 'Te enviamos un enlace de confirmación. Tu correo cambiará cuando lo confirmes (revisa también tu correo anterior).'
    })
  }

  const handleCambiarPassword = async () => {
    setMsgPassword(null)
    if (passwords.nueva.length < 6) {
      setMsgPassword({ tipo: 'error', texto: 'La contraseña debe tener al menos 6 caracteres' })
      return
    }
    if (passwords.nueva !== passwords.confirmar) {
      setMsgPassword({ tipo: 'error', texto: 'Las contraseñas no coinciden' })
      return
    }
    setCambiandoPassword(true)
    const { error } = await supabase.auth.updateUser({ password: passwords.nueva })
    setCambiandoPassword(false)
    if (error) {
      setMsgPassword({ tipo: 'error', texto: 'No se pudo cambiar la contraseña: ' + error.message })
      return
    }
    setPasswords({ nueva: '', confirmar: '' })
    setMsgPassword({ tipo: 'ok', texto: 'Contraseña actualizada' })
  }

  if (cargando) return <p style={styles.estado}>Cargando tu perfil...</p>
  if (!perfil) return <p style={styles.estado}>{mensaje?.texto || 'No se encontró tu perfil'}</p>

  const iniciales = `${(perfil.nombre || '?')[0]}${(perfil.apellido || '')[0] || ''}`.toUpperCase()

  return (
    <div style={styles.container}>
      <h2 style={styles.titulo}>Mi perfil</h2>

      {mensaje && (
        <p style={mensaje.tipo === 'ok' ? styles.exito : styles.error}>{mensaje.texto}</p>
      )}

      <div style={styles.card}>
        <div style={styles.cabecera}>
          {perfil.foto_url
            ? <img src={perfil.foto_url} alt="Foto de perfil" style={styles.foto} />
            : <div style={styles.fotoIniciales}>{iniciales}</div>}

          <div>
            <h3 style={styles.nombre}>{perfil.nombre} {perfil.apellido}</h3>
            <span style={styles.rol}>{rol === 'anfitrion' ? 'Propietario / Anfitrión' : 'Inquilino'}</span>
            <div style={styles.filaBotones}>
              <button
                type="button"
                className="btn btn-secundario btn-sm"
                onClick={() => inputFoto.current?.click()}
                disabled={subiendoFoto}
              >
                {subiendoFoto ? 'Subiendo...' : perfil.foto_url ? 'Cambiar foto' : 'Subir foto'}
              </button>
              {perfil.foto_url && (
                <button
                  type="button"
                  className="btn btn-peligro btn-sm"
                  onClick={handleQuitarFoto}
                  disabled={subiendoFoto}
                >
                  Quitar foto
                </button>
              )}
              <input
                ref={inputFoto}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleElegirFoto}
                style={{ display: 'none' }}
                data-testid="input-foto"
              />
            </div>
            <p style={styles.ayuda}>JPG, PNG o WEBP. Máximo {MAX_FOTO_MB} MB.</p>
          </div>
        </div>
      </div>

      <div style={styles.card}>
        <h3 style={styles.seccion}>Datos personales</h3>
        <div style={styles.grid}>
          <div style={styles.campo}>
            <label style={styles.label}>Nombre *</label>
            <input name="nombre" value={form.nombre} onChange={handleChange} style={styles.input} />
          </div>
          <div style={styles.campo}>
            <label style={styles.label}>Apellido *</label>
            <input name="apellido" value={form.apellido} onChange={handleChange} style={styles.input} />
          </div>
          <div style={styles.campo}>
            <label style={styles.label}>Teléfono / Celular</label>
            <input name="telefono" value={form.telefono} onChange={handleChange} placeholder="+504 9999-9999" style={styles.input} />
          </div>
          <div style={styles.campo}>
            <label style={styles.label}>Ciudad</label>
            <input name="ciudad" value={form.ciudad} onChange={handleChange} placeholder="Ej. Tegucigalpa" style={styles.input} />
          </div>
          <div style={styles.campo}>
            <label style={styles.label}>DNI</label>
            <input value={perfil.dni || ''} disabled style={{ ...styles.input, ...styles.inputBloqueado }} />
          </div>
          <div style={styles.campo}>
            <label style={styles.label}>Correo electrónico</label>
            <input value={usuario?.email || perfil.email || ''} disabled style={{ ...styles.input, ...styles.inputBloqueado }} />
          </div>
        </div>

        <div style={{ ...styles.campo, marginTop: '1rem' }}>
          <label style={styles.label}>Sobre mí</label>
          <textarea
            name="biografia"
            value={form.biografia}
            onChange={handleChange}
            maxLength={500}
            rows={4}
            placeholder={rol === 'anfitrion'
              ? 'Cuéntales a los inquilinos quién eres y cómo cuidas tus propiedades'
              : 'Cuéntale a los anfitriones quién eres'}
            style={{ ...styles.input, resize: 'vertical' }}
          />
          <span style={styles.ayuda}>{form.biografia.length}/500</span>
        </div>

        <div style={styles.acciones}>
          <button type="button" className="btn btn-primario" onClick={handleGuardar} disabled={guardando}>
            {guardando ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </div>

      <div style={styles.card}>
        <h3 style={styles.seccion}>Cambiar correo electrónico</h3>
        {msgEmail && <p style={msgEmail.tipo === 'ok' ? styles.exito : styles.error}>{msgEmail.texto}</p>}
        <div style={styles.campo}>
          <label style={styles.label}>Nuevo correo</label>
          <input
            type="email"
            value={nuevoEmail}
            onChange={(e) => setNuevoEmail(e.target.value)}
            placeholder="nuevo@correo.com"
            style={styles.input}
          />
        </div>
        <div style={styles.acciones}>
          <button type="button" className="btn btn-secundario" onClick={handleCambiarEmail} disabled={cambiandoEmail}>
            {cambiandoEmail ? 'Enviando...' : 'Cambiar correo'}
          </button>
        </div>
      </div>

      <div style={styles.card}>
        <h3 style={styles.seccion}>Cambiar contraseña</h3>
        {msgPassword && <p style={msgPassword.tipo === 'ok' ? styles.exito : styles.error}>{msgPassword.texto}</p>}
        <div style={styles.grid}>
          <div style={styles.campo}>
            <label style={styles.label}>Nueva contraseña</label>
            <input
              type="password"
              value={passwords.nueva}
              onChange={(e) => setPasswords({ ...passwords, nueva: e.target.value })}
              style={styles.input}
            />
          </div>
          <div style={styles.campo}>
            <label style={styles.label}>Confirmar contraseña</label>
            <input
              type="password"
              value={passwords.confirmar}
              onChange={(e) => setPasswords({ ...passwords, confirmar: e.target.value })}
              style={styles.input}
            />
          </div>
        </div>
        <div style={styles.acciones}>
          <button type="button" className="btn btn-secundario" onClick={handleCambiarPassword} disabled={cambiandoPassword}>
            {cambiandoPassword ? 'Guardando...' : 'Cambiar contraseña'}
          </button>
        </div>
      </div>
    </div>
  )
}

const styles = {
  container: { maxWidth: '760px', margin: '0 auto', padding: '2rem 1rem', fontFamily: 'sans-serif' },
  titulo: { fontSize: '1.8rem', color: '#1a1a2e', marginBottom: '1.2rem' },
  estado: { textAlign: 'center', padding: '3rem 1rem', color: '#888' },
  card: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '1.5rem',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    marginBottom: '1.2rem'
  },
  cabecera: { display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' },
  foto: { width: '110px', height: '110px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #e94560' },
  fotoIniciales: {
    width: '110px', height: '110px', borderRadius: '50%', backgroundColor: '#e94560', color: 'white',
    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.2rem', fontWeight: 'bold'
  },
  nombre: { margin: '0 0 0.3rem', color: '#1a1a2e', fontSize: '1.3rem' },
  rol: {
    display: 'inline-block', backgroundColor: '#f0f0f5', color: '#1a1a2e', borderRadius: '12px',
    padding: '0.15rem 0.7rem', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '0.8rem'
  },
  filaBotones: { display: 'flex', gap: '0.5rem', flexWrap: 'wrap' },
  ayuda: { fontSize: '0.8rem', color: '#888', margin: '0.5rem 0 0' },
  seccion: { margin: '0 0 1rem', color: '#1a1a2e', fontSize: '1.1rem' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' },
  campo: { display: 'flex', flexDirection: 'column', gap: '0.4rem' },
  label: { fontSize: '0.9rem', color: '#555', fontWeight: 'bold' },
  input: {
    padding: '0.7rem 1rem', borderRadius: '4px', border: '1px solid #ddd', fontSize: '1rem',
    outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', width: '100%'
  },
  inputBloqueado: { backgroundColor: '#f5f5f5', color: '#888', cursor: 'not-allowed' },
  acciones: { display: 'flex', justifyContent: 'flex-end', marginTop: '1.2rem' },
  exito: { backgroundColor: '#e6f6ea', color: '#1f7a35', padding: '0.8rem', borderRadius: '4px', fontSize: '0.9rem', margin: '0 0 1rem' },
  error: { backgroundColor: '#ffe0e0', color: '#c0392b', padding: '0.8rem', borderRadius: '4px', fontSize: '0.9rem', margin: '0 0 1rem' }
}

export default MiPerfil