import { Router } from 'express'
import multer from 'multer'
import supabase from '../db.js'

const router = Router()

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5 MB por imagen
})

const BUCKET = 'imagenes-propiedades'

// GET — obtener imágenes de una propiedad
router.get('/:id_propiedad', async (req, res) => {
  const { data, error } = await supabase
    .from('imagenes_propiedad')
    .select('*')
    .eq('id_propiedad', req.params.id_propiedad)

  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

// POST — registrar una imagen a partir de una URL (se mantiene por compatibilidad)
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

// POST /upload — subir UN archivo real. El frontend llama esta ruta una vez por
// cada archivo seleccionado (en paralelo) para soportar selección múltiple.
router.post('/upload', upload.single('imagen'), async (req, res) => {
  try {
    const { id_propiedad, es_portada } = req.body
    const file = req.file

    if (!id_propiedad) return res.status(400).json({ error: 'id_propiedad es obligatorio' })
    if (!file) return res.status(400).json({ error: 'No se recibió ningún archivo' })

    const extension = file.originalname.split('.').pop()
    const nombreArchivo = `propiedad-${id_propiedad}-${Date.now()}-${Math.round(Math.random() * 1e6)}.${extension}`

    const { error: errorSubida } = await supabase.storage
      .from(BUCKET)
      .upload(nombreArchivo, file.buffer, { contentType: file.mimetype, upsert: false })

    if (errorSubida) {
      return res.status(500).json({ error: `Error al subir el archivo: ${errorSubida.message}` })
    }

    const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(nombreArchivo)
    const url_imagen = urlData.publicUrl
    const esPortadaBool = es_portada === 'true' || es_portada === true

    // Si esta imagen va a ser la portada, primero se desmarca cualquier otra portada existente
    if (esPortadaBool) {
      await supabase
        .from('imagenes_propiedad')
        .update({ es_portada: false })
        .eq('id_propiedad', id_propiedad)
    }

    const { data, error } = await supabase
      .from('imagenes_propiedad')
      .insert([{ id_propiedad, url_imagen, es_portada: esPortadaBool }])
      .select()

    if (error) return res.status(500).json({ error: error.message })
    res.status(201).json(data[0])
  } catch (err) {
    res.status(500).json({ error: 'Error inesperado al procesar la imagen' })
  }
})

// PUT /:id_imagen/portada — marcar una imagen existente como portada
router.put('/:id_imagen/portada', async (req, res) => {
  try {
    const { id_imagen } = req.params

    const { data: imagen, error: errorBusqueda } = await supabase
      .from('imagenes_propiedad')
      .select('id_propiedad')
      .eq('id_imagen', id_imagen)
      .single()

    if (errorBusqueda || !imagen) {
      return res.status(404).json({ error: 'Imagen no encontrada' })
    }

    await supabase
      .from('imagenes_propiedad')
      .update({ es_portada: false })
      .eq('id_propiedad', imagen.id_propiedad)

    const { data, error } = await supabase
      .from('imagenes_propiedad')
      .update({ es_portada: true })
      .eq('id_imagen', id_imagen)
      .select()

    if (error) return res.status(500).json({ error: error.message })
    res.json(data[0])
  } catch (err) {
    res.status(500).json({ error: 'Error inesperado al marcar la portada' })
  }
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