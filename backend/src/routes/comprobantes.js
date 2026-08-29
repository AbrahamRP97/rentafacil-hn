import { Router } from 'express'
import multer from 'multer'
import supabase from '../db.js'

const router = Router()

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5 MB máximo
})

const BUCKET = 'comprobantes-pago'

// POST /upload — sube la captura de la transferencia y devuelve su URL pública
router.post('/upload', upload.single('comprobante'), async (req, res) => {
  try {
    const { id_contrato } = req.body
    const file = req.file

    if (!id_contrato) return res.status(400).json({ error: 'id_contrato es obligatorio' })
    if (!file) return res.status(400).json({ error: 'No se recibió ningún archivo' })

    const extension = file.originalname.split('.').pop()
    const nombreArchivo = `contrato-${id_contrato}-${Date.now()}.${extension}`

    const { error: errorSubida } = await supabase.storage
      .from(BUCKET)
      .upload(nombreArchivo, file.buffer, { contentType: file.mimetype, upsert: false })

    if (errorSubida) {
      return res.status(500).json({ error: `Error al subir el comprobante: ${errorSubida.message}` })
    }

    const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(nombreArchivo)
    res.status(201).json({ url: urlData.publicUrl })
  } catch (err) {
    res.status(500).json({ error: 'Error inesperado al procesar el comprobante' })
  }
})

export default router