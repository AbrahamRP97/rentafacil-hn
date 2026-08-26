import { Router } from 'express'
import multer from 'multer'
import supabase from '../db.js'

const router = Router()

// Multer guarda el archivo en memoria (buffer) para subirlo directo a Supabase Storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5 MB máximo por imagen
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

// POST /upload — subir un archivo real
router.post('/upload', upload.single('imagen'), async (req, res) => {
  try {
    const { id_propiedad, es_portada } = req.body
    const file = req.file

    if (!id_propiedad) {
      return res.status(400).json({ error: 'id_propiedad es obligatorio' })
    }
    if (!file) {
      return res.status(400).json({ error: 'No se recibió ningún archivo' })
    }

    // Nombre único para evitar colisiones entre imágenes de distintas propiedades
    const extension = file.originalname.split('.').pop()
    const nombreArchivo = `propiedad-${id_propiedad}-${Date.now()}.${extension}`

    const { error: errorSubida } = await supabase.storage
      .from(BUCKET)
      .upload(nombreArchivo, file.buffer, {
        contentType: file.mimetype,
        upsert: false
      })

    if (errorSubida) {
      return res.status(500).json({ error: `Error al subir el archivo: ${errorSubida.message}` })
    }

    // Obtener la URL pública del archivo recién subido
    const { data: urlData } = supabase.storage
      .from(BUCKET)
      .getPublicUrl(nombreArchivo)

    const url_imagen = urlData.publicUrl

    // Registrar la imagen en la tabla, igual que el flujo por URL
    const { data, error } = await supabase
      .from('imagenes_propiedad')
      .insert([{
        id_propiedad,
        url_imagen,
        es_portada: es_portada === 'true' || es_portada === true
      }])
      .select()

    if (error) return res.status(500).json({ error: error.message })
    res.status(201).json(data[0])
  } catch (err) {
    res.status(500).json({ error: 'Error inesperado al procesar la imagen' })
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