import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { createPropietario, createInquilino } from '../services/api'

function Registro() {
  const [form, setForm] = useState({
    nombre: '',
    apellido: '',
    email: '',
    telefono: '',
    dni: '',
    password: '',
    confirmarPassword: '',
    rol: 'inquilino'
  })
  const [error, setError] = useState(null)
  const [exito, setExito] = useState(false)
  const [cargando, setCargando] = useState(false)
  const { registrar } = useAuth()
  const navigate = useNavigate()

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    if (!form.nombre || !form.apellido || !form.email || !form.dni || !form.password || !form.confirmarPassword) {
      setError('Por favor completa todos los campos obligatorios')
      return
    }

    if (form.password !== form.confirmarPassword) {
      setError('Las contraseñas no coinciden')
      return
    }

    if (form.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      return
    }

    setCargando(true)

    // Paso 1: crear el usuario en Supabase Auth
    const { error: errorRegistro, data } = await registrar({
      email: form.email,
      password: form.password,
      nombre: form.nombre,
      apellido: form.apellido,
      telefono: form.telefono,
      rol: form.rol
    })

    if (errorRegistro) {
      setCargando(false)
      setError(errorRegistro.includes('already registered')
        ? 'Ya existe una cuenta con este correo'
        : 'Error al crear la cuenta: ' + errorRegistro)
      return
    }

    // Paso 2: crear el registro real en propietarios o inquilinos, ligado al usuario recién creado
    try {
      const datosPerfil = {
        nombre: form.nombre,
        apellido: form.apellido,
        email: form.email,
        telefono: form.telefono,
        dni: form.dni,
        auth_user_id: data.user.id
      }

      if (form.rol === 'anfitrion') {
        await createPropietario(datosPerfil)
      } else {
        await createInquilino(datosPerfil)
      }
    } catch (err) {
      setCargando(false)
      setError('Tu cuenta se creó, pero hubo un error al guardar tu perfil. Contacta soporte o intenta iniciar sesión.')
      return
    }

    setCargando(false)
    setExito(true)
    setTimeout(() => navigate('/login'), 2000)
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.titulo}>Crear cuenta</h2>
        <p style={styles.subtitulo}>Únete a RentaFácil HN</p>

        {error && <p style={styles.error}>{error}</p>}
        {exito && (
          <p style={styles.exito}>
            ✅ Cuenta creada exitosamente. Redirigiendo al login...
          </p>
        )}

        <div style={styles.form}>
          <div style={styles.fila}>
            <div style={styles.campo}>
              <label style={styles.label}>Nombre *</label>
              <input
                type="text"
                name="nombre"
                value={form.nombre}
                onChange={handleChange}
                placeholder="Abraham"
                style={styles.input}
              />
            </div>
            <div style={styles.campo}>
              <label style={styles.label}>Apellido *</label>
              <input
                type="text"
                name="apellido"
                value={form.apellido}
                onChange={handleChange}
                placeholder="García"
                style={styles.input}
              />
            </div>
          </div>

          <div style={styles.campo}>
            <label style={styles.label}>Correo electrónico *</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="tucorreo@gmail.com"
              style={styles.input}
            />
          </div>

          <div style={styles.fila}>
            <div style={styles.campo}>
              <label style={styles.label}>Teléfono</label>
              <input
                type="text"
                name="telefono"
                value={form.telefono}
                onChange={handleChange}
                placeholder="9999-9999"
                style={styles.input}
              />
            </div>
            <div style={styles.campo}>
              <label style={styles.label}>DNI *</label>
              <input
                type="text"
                name="dni"
                value={form.dni}
                onChange={handleChange}
                placeholder="0801-1990-12345"
                style={styles.input}
              />
            </div>
          </div>

          <div style={styles.campo}>
            <label style={styles.label}>Tipo de cuenta *</label>
            <select
              name="rol"
              value={form.rol}
              onChange={handleChange}
              style={styles.input}
            >
              <option value="inquilino">Inquilino — Busco propiedades</option>
              <option value="anfitrion">Anfitrión — Tengo propiedades</option>
            </select>
          </div>

          <div style={styles.campo}>
            <label style={styles.label}>Contraseña *</label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Mínimo 6 caracteres"
              style={styles.input}
            />
          </div>

          <div style={styles.campo}>
            <label style={styles.label}>Confirmar contraseña *</label>
            <input
              type="password"
              name="confirmarPassword"
              value={form.confirmarPassword}
              onChange={handleChange}
              placeholder="Repite tu contraseña"
              style={styles.input}
            />
          </div>

          <button onClick={handleSubmit} style={styles.boton} disabled={cargando}>
            {cargando ? 'Creando cuenta...' : 'Crear cuenta'}
          </button>

          <p style={styles.loginLink}>
            ¿Ya tienes cuenta?{' '}
            <Link to="/login" style={styles.link}>Inicia sesión aquí</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
    fontFamily: 'sans-serif',
    padding: '2rem'
  },
  card: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '2.5rem',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    width: '100%',
    maxWidth: '500px'
  },
  titulo: {
    fontSize: '1.8rem',
    color: '#1a1a2e',
    marginBottom: '0.3rem',
    textAlign: 'center'
  },
  subtitulo: {
    color: '#888',
    textAlign: 'center',
    marginBottom: '2rem'
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
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.2rem'
  },
  fila: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '1rem'
  },
  campo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.4rem'
  },
  label: {
    fontSize: '0.9rem',
    color: '#555',
    fontWeight: 'bold'
  },
  input: {
    padding: '0.7rem 1rem',
    borderRadius: '4px',
    border: '1px solid #ddd',
    fontSize: '1rem',
    outline: 'none'
  },
  boton: {
    padding: '0.8rem',
    backgroundColor: '#e94560',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '1rem',
    fontWeight: 'bold',
    cursor: 'pointer',
    marginTop: '0.5rem'
  },
  loginLink: {
    textAlign: 'center',
    fontSize: '0.9rem',
    color: '#888'
  },
  link: {
    color: '#e94560',
    textDecoration: 'none',
    fontWeight: 'bold'
  }
}

export default Registro