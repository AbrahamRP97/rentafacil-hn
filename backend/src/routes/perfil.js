import { Router } from 'express'
import multer from 'multer'
import supabase from '../db.js'

const router = Router()
const BUCKET = 'fotos-perfil'
const TIPOS_PERMITIDOS = ['image/jpeg', 'image/png', 'image/webp']

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 3 * 1024 * 1024 } // 3 MB
})

// Identifica al usuario con el token de sesión de Supabase que envía el frontend
async function usuarioDelToken(req) {
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '')
  if (!token) return null
  const { data, error } = await supabase.auth.getUser(token)
  if (error || !data?.user) return null
  return data.user
}

// Busca el perfil del usuario: primero como propietario y luego como inquilino
async function buscarPerfil(user) {
  const { data: prop } = await supabase
    .from('propietarios').select('*').eq('auth_user_id', user.id).maybeSingle()
  if (prop) return { rol: 'anfitrion', tabla: 'propietarios', llave: 'id_propietario', perfil: prop }

  const { data: inq } = await supabase
    .from('inquilinos').select('*').eq('auth_user_id', user.id).maybeSingle()
  if (inq) return { rol: 'inquilino', tabla: 'inquilinos', llave: 'id_inquilino', perfil: inq }

  return null
}

// GET /api/perfil — datos del usuario que inició sesión
router.get('/', async (req, res) => {
  try {
    const user = await usuarioDelToken(req)
    if (!user) return res.status(401).json({ error: 'Inicia sesión para ver tu perfil' })

    const encontrado = await buscarPerfil(user)
    if (!encontrado) return res.status(404).json({ error: 'No se encontró tu perfil' })

    let { perfil } = encontrado
    if (user.email && perfil.email !== user.email) {
      await supabase.from(encontrado.tabla).update({ email: user.email }).eq(encontrado.llave, perfil[encontrado.llave])
      perfil = { ...perfil, email: user.email }
    }

    res.json({ rol: encontrado.rol, perfil })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// PUT /api/perfil — editar datos personales (solo campos permitidos)
router.put('/', async (req, res) => {
  try {
    const user = await usuarioDelToken(req)
    if (!user) return res.status(401).json({ error: 'Inicia sesión para editar tu perfil' })

    const encontrado = await buscarPerfil(user)
    if (!encontrado) return res.status(404).json({ error: 'No se encontró tu perfil' })

    const { nombre, apellido, telefono, ciudad, biografia } = req.body
    const cambios = {}

    if (nombre !== undefined) {
      if (!String(nombre).trim()) return res.status(400).json({ error: 'El nombre no puede estar vacío' })
      cambios.nombre = String(nombre).trim().slice(0, 100)
    }
    if (apellido !== undefined) {
      if (!String(apellido).trim()) return res.status(400).json({ error: 'El apellido no puede estar vacío' })
      cambios.apellido = String(apellido).trim().slice(0, 100)
    }
    if (telefono !== undefined) {
      const tel = String(telefono).trim()
      if (tel && !/^[0-9+\-\s()]{7,20}$/.test(tel)) {
        return res.status(400).json({ error: 'El teléfono solo puede tener números, espacios, + y -' })
      }
      cambios.telefono = tel
    }
    if (ciudad !== undefined) cambios.ciudad = String(ciudad).trim().slice(0, 100)
    if (biografia !== undefined) cambios.biografia = String(biografia).trim().slice(0, 500)

    if (Object.keys(cambios).length === 0) {
      return res.status(400).json({ error: 'No hay cambios para guardar' })
    }

    const { data, error } = await supabase
      .from(encontrado.tabla)
      .update(cambios)
      .eq(encontrado.llave, encontrado.perfil[encontrado.llave])
      .select()
    if (error) return res.status(500).json({ error: error.message })

    res.json({ rol: encontrado.rol, perfil: data[0] })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// POST /api/perfil/foto — subir o reemplazar la foto de perfil
router.post('/foto', (req, res, next) => {
  upload.single('foto')(req, res, (err) => {
    if (err) {
      const grande = err.code === 'LIMIT_FILE_SIZE'
      return res.status(grande ? 413 : 400).json({
        error: grande ? 'La foto no puede pesar más de 3 MB' : 'No se pudo leer la imagen'
      })
    }
    next()
  })
}, async (req, res) => {
  try {
    const user = await usuarioDelToken(req)
    if (!user) return res.status(401).json({ error: 'Inicia sesión para cambiar tu foto' })

    const encontrado = await buscarPerfil(user)
    if (!encontrado) return res.status(404).json({ error: 'No se encontró tu perfil' })

    const file = req.file
    if (!file) return res.status(400).json({ error: 'No se recibió ninguna imagen' })
    if (!TIPOS_PERMITIDOS.includes(file.mimetype)) {
      return res.status(400).json({ error: 'La foto debe ser JPG, PNG o WEBP' })
    }

    const anterior = (encontrado.perfil.foto_url || '').split(`/${BUCKET}/`)[1]

    const extension = file.mimetype === 'image/png' ? 'png' : file.mimetype === 'image/webp' ? 'webp' : 'jpg'
    const nombreArchivo = `${user.id}-${Date.now()}.${extension}`

    const { error: errorSubida } = await supabase.storage
      .from(BUCKET)
      .upload(nombreArchivo, file.buffer, { contentType: file.mimetype, upsert: false })
    if (errorSubida) return res.status(500).json({ error: `Error al subir la foto: ${errorSubida.message}` })

    const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(nombreArchivo)
    const foto_url = urlData.publicUrl

    const { data, error } = await supabase
      .from(encontrado.tabla)
      .update({ foto_url })
      .eq(encontrado.llave, encontrado.perfil[encontrado.llave])
      .select()
    if (error) return res.status(500).json({ error: error.message })

    // Borra la foto anterior para no acumular archivos
    if (anterior) await supabase.storage.from(BUCKET).remove([decodeURIComponent(anterior.split('?')[0])])

    res.json({ rol: encontrado.rol, perfil: data[0] })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// DELETE /api/perfil/foto — quitar la foto de perfil
router.delete('/foto', async (req, res) => {
  try {
    const user = await usuarioDelToken(req)
    if (!user) return res.status(401).json({ error: 'Inicia sesión para cambiar tu foto' })

    const encontrado = await buscarPerfil(user)
    if (!encontrado) return res.status(404).json({ error: 'No se encontró tu perfil' })

    const anterior = (encontrado.perfil.foto_url || '').split(`/${BUCKET}/`)[1]
    if (anterior) await supabase.storage.from(BUCKET).remove([decodeURIComponent(anterior.split('?')[0])])

    const { data, error } = await supabase
      .from(encontrado.tabla)
      .update({ foto_url: null })
      .eq(encontrado.llave, encontrado.perfil[encontrado.llave])
      .select()
    if (error) return res.status(500).json({ error: error.message })

    res.json({ rol: encontrado.rol, perfil: data[0] })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

export default router