import { Router } from 'express'
import supabase from '../db.js'

const router = Router()

const SELECT = '*, UBICACIONES:ubicaciones(*), PROPIETARIOS:propietarios(*), IMAGENES_PROPIEDAD:imagenes_propiedad(*)'
const BUCKET = 'imagenes-propiedades'

router.get('/', async (req, res) => {
  const { data, error } = await supabase
    .from('propiedades')
    .select(SELECT)
    .eq('archivada', false)
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

router.get('/:id', async (req, res) => {
  const { data, error } = await supabase
    .from('propiedades')
    .select(SELECT)
    .eq('id_propiedad', req.params.id)
    .single()
  if (error) return res.status(404).json({ error: 'Propiedad no encontrada' })
  res.json(data)
})

router.post('/', async (req, res) => {
  const { data, error } = await supabase
    .from('propiedades')
    .insert([req.body])
    .select()
  if (error) return res.status(500).json({ error: error.message })
  res.status(201).json(data[0])
})

router.put('/:id', async (req, res) => {
  const { archivada, ...cambios } = req.body // archivar solo se hace vía DELETE
  const { data, error } = await supabase
    .from('propiedades')
    .update(cambios)
    .eq('id_propiedad', req.params.id)
    .select()
  if (error) return res.status(500).json({ error: error.message })
  res.json(data[0])
})

async function usuarioDelToken(req) {
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '')
  if (!token) return null
  const { data, error } = await supabase.auth.getUser(token)
  if (error || !data?.user) return null
  return data.user
}

// DELETE /:id — elimina la propiedad del listado.
router.delete('/:id', async (req, res) => {
  try {
    const id = req.params.id

    const user = await usuarioDelToken(req)
    if (!user) return res.status(401).json({ error: 'Inicia sesión para eliminar propiedades' })

    const { data: prop, error: errProp } = await supabase
      .from('propiedades')
      .select('id_propiedad, id_propietario, id_ubicacion, archivada')
      .eq('id_propiedad', id)
      .maybeSingle()
    if (errProp) return res.status(500).json({ error: errProp.message })
    if (!prop) return res.status(404).json({ error: 'Propiedad no encontrada' })

    const { data: dueno } = await supabase
      .from('propietarios')
      .select('id_propietario')
      .eq('auth_user_id', user.id)
      .maybeSingle()
    if (!dueno || dueno.id_propietario !== prop.id_propietario) {
      return res.status(403).json({ error: 'Solo el propietario puede eliminar esta propiedad' })
    }

    const { data: reservas, error: errRes } = await supabase
      .from('reservas')
      .select('id_reserva, estado')
      .eq('id_propiedad', id)
    if (errRes) return res.status(500).json({ error: errRes.message })

    const idsReservas = (reservas || []).map(r => r.id_reserva)
    const pendientes = (reservas || []).some(r => ['pendiente', 'aprobada'].includes(r.estado))

    let contratoActivo = false
    if (idsReservas.length > 0) {
      const { data: contratos, error: errCon } = await supabase
        .from('contratos')
        .select('id_contrato, estado')
        .in('id_reserva', idsReservas)
      if (errCon) return res.status(500).json({ error: errCon.message })
      contratoActivo = (contratos || []).some(c => c.estado === 'activo')
    }

    if (pendientes || contratoActivo) {
      return res.status(409).json({
        error: 'Esta propiedad tiene reservas pendientes o contratos activos. Resuélvelos o cancélalos antes de eliminarla.'
      })
    }

    if (idsReservas.length > 0) {
      const { error } = await supabase
        .from('propiedades')
        .update({ archivada: true })
        .eq('id_propiedad', id)
      if (error) return res.status(500).json({ error: error.message })
      return res.json({ message: 'Propiedad archivada. Ya no aparece en el sitio y su historial se conserva.', accion: 'archivada' })
    }

    const { data: imagenes } = await supabase
      .from('imagenes_propiedad')
      .select('url_imagen')
      .eq('id_propiedad', id)
    const rutas = (imagenes || [])
      .map(i => (i.url_imagen || '').split(`/${BUCKET}/`)[1])
      .filter(Boolean)
      .map(r => decodeURIComponent(r.split('?')[0]))
    if (rutas.length > 0) await supabase.storage.from(BUCKET).remove(rutas)

    const { error: errDel } = await supabase
      .from('propiedades')
      .delete()
      .eq('id_propiedad', id)
    if (errDel) return res.status(500).json({ error: errDel.message })

    // La ubicación se borra solo si ninguna otra propiedad la usa
    if (prop.id_ubicacion) {
      const { count } = await supabase
        .from('propiedades')
        .select('id_propiedad', { count: 'exact', head: true })
        .eq('id_ubicacion', prop.id_ubicacion)
      if (!count) await supabase.from('ubicaciones').delete().eq('id_ubicacion', prop.id_ubicacion)
    }

    res.json({ message: 'Propiedad eliminada correctamente', accion: 'eliminada' })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

export default router