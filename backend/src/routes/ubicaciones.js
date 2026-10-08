import { Router } from 'express'
import supabase from '../db.js'

const router = Router()

const USER_AGENT = 'RentaFacilHN-Proyecto-Academico/1.0'
const CAMPOS_EDITABLES = ['departamento', 'municipio', 'direccion', 'codigo_postal', 'latitud', 'longitud']

// Busca un texto en Nominatim (OpenStreetMap), limitado a Honduras.
// Devuelve { latitud, longitud } o null si no hay resultados.
async function buscarEnNominatim(consulta) {
  const url =
    'https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=hn&q=' +
    encodeURIComponent(consulta)
  const respuesta = await fetch(url, { headers: { 'User-Agent': USER_AGENT } })
  if (!respuesta.ok) throw new Error(`Nominatim respondió ${respuesta.status}`)
  const datos = await respuesta.json()
  if (!Array.isArray(datos) || datos.length === 0) return null
  return { latitud: parseFloat(datos[0].lat), longitud: parseFloat(datos[0].lon) }
}

const vacio = (v) => v === undefined || v === null || v === ''

// Valida un par de coordenadas. Devuelve { ok, latitud, longitud } o { ok:false, error }.
function validarCoordenadas(latitud, longitud) {
  if (vacio(latitud) && vacio(longitud)) return { ok: true, latitud: null, longitud: null }
  if (vacio(latitud) !== vacio(longitud)) {
    return { ok: false, error: 'latitud y longitud deben enviarse juntas' }
  }
  const lat = Number(latitud)
  const lng = Number(longitud)
  if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
    return { ok: false, error: 'latitud inválida (debe estar entre -90 y 90)' }
  }
  if (!Number.isFinite(lng) || lng < -180 || lng > 180) {
    return { ok: false, error: 'longitud inválida (debe estar entre -180 y 180)' }
  }
  return { ok: true, latitud: lat, longitud: lng }
}

router.get('/', async (req, res) => {
  const { data, error } = await supabase.from('ubicaciones').select('*')
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

// POST /geocodificar — ayuda para pre-colocar el pin a partir de la dirección escrita.
router.post('/geocodificar', async (req, res) => {
  const { departamento = '', municipio = '', direccion = '' } = req.body

  if (!municipio.trim() && !direccion.trim()) {
    return res.status(400).json({ error: 'Escribe al menos el municipio o la dirección' })
  }

  try {
    if (direccion.trim()) {
      const exacta = await buscarEnNominatim(
        `${direccion}, ${municipio}, ${departamento}, Honduras`
      )
      if (exacta) return res.json({ ...exacta, aproximada: false })
    }

    if (municipio.trim()) {
      const aproximada = await buscarEnNominatim(`${municipio}, ${departamento}, Honduras`)
      if (aproximada) return res.json({ ...aproximada, aproximada: true })
    }

    res.status(404).json({ error: 'No se encontró esa dirección en el mapa' })
  } catch (err) {
    res.status(502).json({ error: 'El servicio de mapas no respondió. Coloca el pin manualmente.' })
  }
})

router.get('/:id', async (req, res) => {
  const { data, error } = await supabase
    .from('ubicaciones')
    .select('*')
    .eq('id_ubicacion', req.params.id)
    .single()
  if (error) return res.status(404).json({ error: 'Ubicación no encontrada' })
  res.json(data)
})

// POST — crea la ubicación.
router.post('/', async (req, res) => {
  const { departamento, municipio, direccion, codigo_postal = null } = req.body

  if (!departamento || !municipio || !direccion) {
    return res.status(400).json({ error: 'departamento, municipio y direccion son obligatorios' })
  }

  const coords = validarCoordenadas(req.body.latitud, req.body.longitud)
  if (!coords.ok) return res.status(400).json({ error: coords.error })

  let { latitud, longitud } = coords

  if (latitud === null) {
    try {
      const encontrada = await buscarEnNominatim(
        `${direccion}, ${municipio}, ${departamento}, Honduras`
      )
      if (encontrada) ({ latitud, longitud } = encontrada)
    } catch (err) {
      }
  }

  const { data, error } = await supabase
    .from('ubicaciones')
    .insert([{ departamento, municipio, direccion, codigo_postal, latitud, longitud }])
    .select()

  if (error) return res.status(500).json({ error: error.message })
  res.status(201).json(data[0])
})


router.put('/:id', async (req, res) => {
  const cambios = {}
  for (const campo of CAMPOS_EDITABLES) {
    if (campo in req.body) cambios[campo] = req.body[campo]
  }

  if ('latitud' in cambios || 'longitud' in cambios) {
    const coords = validarCoordenadas(cambios.latitud, cambios.longitud)
    if (!coords.ok) return res.status(400).json({ error: coords.error })
    cambios.latitud = coords.latitud
    cambios.longitud = coords.longitud
  }

  if (Object.keys(cambios).length === 0) {
    return res.status(400).json({ error: 'No hay campos válidos para actualizar' })
  }

  const { data, error } = await supabase
    .from('ubicaciones')
    .update(cambios)
    .eq('id_ubicacion', req.params.id)
    .select()

  if (error) return res.status(500).json({ error: error.message })
  if (!data || data.length === 0) return res.status(404).json({ error: 'Ubicación no encontrada' })
  res.json(data[0])
})

router.delete('/:id', async (req, res) => {
  const { error } = await supabase
    .from('ubicaciones')
    .delete()
    .eq('id_ubicacion', req.params.id)
  if (error) return res.status(500).json({ error: error.message })
  res.json({ message: 'Ubicación eliminada correctamente' })
})

export default router