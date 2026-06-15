import { Router } from 'express'
import supabase from '../db.js'

const router = Router()

// GET — obtener imágenes de una propiedad
router.get('/:id_propiedad', async (req, res) => {
  const { data, error } = await supabase
    .from('imagenes_propiedad')
    .select('*')
    .eq('id_propiedad', req.params.id_propiedad)

  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

// POST — registrar una imagen
router.post('/', async (req, res) => {
  const { id_propiedad, url_imagen, es_portada } = req.body

  if (!id_propiedad || !url_imagen) {
    return res.status(400).json({ error: 'id_propiedad y url_imagen son obligatorios' })
  }

  const { data, error } = await supabase
    .from('imagenes_propiedad')
    .insert([{ id_propiedad, url_imagen, es_portada: es_portada || false }])
    .select()

  if (error) return res.status(500).json({ error: error.message })
  res.status(201).json(data[0])
})

// DELETE — eliminar una imagen
router.delete('/:id_imagen', async (req, res) => {
  const { error } = await supabase
    .from('imagenes_propiedad')
    .delete()
    .eq('id_imagen', req.params.id_imagen)

  if (error) return res.status(500).json({ error: error.message })
  res.json({ message: 'Imagen eliminada correctamente' })
})

export default router
