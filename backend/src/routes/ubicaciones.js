import { Router } from 'express'
import supabase from '../db.js'

const router = Router()

router.get('/', async (req, res) => {
  const { data, error } = await supabase.from('ubicaciones').select('*')
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
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

// POST — crea la ubicación y, si no vienen coordenadas, las obtiene automáticamente
// geocodificando la dirección con el servicio gratuito de OpenStreetMap (Nominatim)
router.post('/', async (req, res) => {
  const { departamento, municipio, direccion, codigo_postal = null } = req.body

  if (!departamento || !municipio || !direccion) {
    return res.status(400).json({ error: 'departamento, municipio y direccion son obligatorios' })
  }

  let latitud = req.body.latitud || null
  let longitud = req.body.longitud || null

  if (!latitud || !longitud) {
    try {
      const consulta = encodeURIComponent(`${direccion}, ${municipio}, ${departamento}, Honduras`)
      const geoRes = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${consulta}`,
        { headers: { 'User-Agent': 'RentaFacilHN-Proyecto-Academico/1.0' } }
      )
      const geoData = await geoRes.json()
      if (geoData.length > 0) {
        latitud = parseFloat(geoData[0].lat)
        longitud = parseFloat(geoData[0].lon)
      }
    } catch (err) {
      // Si el servicio de geocodificación falla, la ubicación se crea igual,
      // simplemente sin coordenadas (no bloquea la creación de la propiedad)
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
  const { data, error } = await supabase
    .from('ubicaciones')
    .update(req.body)
    .eq('id_ubicacion', req.params.id)
    .select()
  if (error) return res.status(500).json({ error: error.message })
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