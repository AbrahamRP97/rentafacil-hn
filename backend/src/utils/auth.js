import supabase from '../db.js'

export async function usuarioDelToken(req) {
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '')
  if (!token) return null

  const { data, error } = await supabase.auth.getUser(token)
  if (error || !data?.user) return null
  return data.user
}

export async function soloAdmin(req, res, next) {
  const user = await usuarioDelToken(req)
  if (!user) return res.status(401).json({ error: 'Inicia sesión como administrador' })
  if (user.app_metadata?.es_admin !== true) {
    return res.status(403).json({ error: 'Solo el administrador de la plataforma puede ver esto' })
  }
  req.admin = user
  next()
}