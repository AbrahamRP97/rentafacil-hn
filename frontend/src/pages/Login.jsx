import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function Login() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState(null)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setError(null)

    // Validación básica
    if (!form.email || !form.password) {
      setError('Por favor completa todos los campos')
      return
    }

    // Simulación temporal hasta conectar Supabase
    // Aquí se reemplazará con la autenticación real de Supabase
    if (form.email === 'admin@rentafacil.com' && form.password === '1234') {
      login({ email: form.email, rol: 'anfitrion', nombre: 'Administrador' })
      navigate('/admin')
    } else if (form.email === 'usuario@rentafacil.com' && form.password === '1234') {
      login({ email: form.email, rol: 'inquilino', nombre: 'Usuario' })
      navigate('/')
    } else {
      setError('Correo o contraseña incorrectos')
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.titulo}>Iniciar Sesión</h2>
        <p style={styles.subtitulo}>Bienvenido a RentaFácil HN</p>

        {error && <p style={styles.error}>{error}</p>}

        <div style={styles.form}>
          <div style={styles.campo}>
            <label style={styles.label}>Correo electrónico</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="tucorreo@gmail.com"
              style={styles.input}
            />
          </div>

          <div style={styles.campo}>
            <label style={styles.label}>Contraseña</label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="••••••••"
              style={styles.input}
            />
          </div>

          <button onClick={handleSubmit} style={styles.boton}>
            Iniciar Sesión
          </button>
        </div>

        <p style={styles.registroLink}>
              ¿No tienes cuenta?{' '}
                <Link to="/registro" style={styles.link}>Regístrate aquí</Link>
        </p>

        <div style={styles.ayuda}>
            <p style={styles.ayudaTexto}>Credenciales de prueba:</p>
            <p style={styles.ayudaTexto}>Anfitrión: admin@rentafacil.com / 1234</p>
            <p style={styles.ayudaTexto}>Inquilino: usuario@rentafacil.com / 1234</p>
            </div>
        </div>
    </div>
  )
}

const styles = {
  container: {
    minHeight: '80vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
    fontFamily: 'sans-serif'
  },
  card: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '2.5rem',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    width: '100%',
    maxWidth: '400px'
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
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.2rem'
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
  ayuda: {
    marginTop: '1.5rem',
    padding: '1rem',
    backgroundColor: '#f5f5f5',
    borderRadius: '4px'
  },
  ayudaTexto: {
    fontSize: '0.8rem',
    color: '#888',
    margin: '0.2rem 0'
  },
  registroLink: {
  textAlign: 'center',
  fontSize: '0.9rem',
  color: '#888',
  marginTop: '1rem'
    },
  link: {
  color: '#e94560',
  textDecoration: 'none',
  fontWeight: 'bold'
    }
}

export default Login