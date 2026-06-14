import { useState } from 'react'

function Login() {
  const [form, setForm] = useState({ email: '', password: '' })

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    alert(`Iniciando sesión con: ${form.email}`)
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.titulo}>Iniciar Sesión</h2>
        <p style={styles.subtitulo}>Bienvenido a RentaFácil HN</p>

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
  }
}

export default Login