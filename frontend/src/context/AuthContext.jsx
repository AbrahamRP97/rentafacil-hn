import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../services/supabaseClient'

const AuthContext = createContext()

// Convierte el usuario de Supabase Auth al formato que ya usa el resto de la app
function mapUsuario(supabaseUser) {
  if (!supabaseUser) return null
  return {
    id: supabaseUser.id,
    email: supabaseUser.email,
    nombre: supabaseUser.user_metadata?.nombre || '',
    apellido: supabaseUser.user_metadata?.apellido || '',
    rol: supabaseUser.user_metadata?.rol || 'inquilino'
  }
}

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null)
  const [cargandoSesion, setCargandoSesion] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUsuario(mapUsuario(data.session?.user))
      setCargandoSesion(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUsuario(mapUsuario(session?.user))
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { error: error.message }
    setUsuario(mapUsuario(data.user))
    return { error: null }
  }

  const registrar = async ({ email, password, nombre, apellido, telefono, rol }) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { nombre, apellido, telefono, rol }
      }
    })
    if (error) return { error: error.message }
    return { error: null, data }
  }

  const logout = async () => {
    await supabase.auth.signOut()
    setUsuario(null)
  }

  return (
    <AuthContext.Provider value={{ usuario, login, registrar, logout, cargandoSesion }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}