import { Router } from 'express'
import supabase from '../db.js'

const router = Router()

// Lista de conversaciones para un propietario (una por cada propiedad+inquilino)
router.get('/conversaciones/propietario/:id_propietario', async (req, res) => {
  const { data, error } = await supabase
    .from('mensajes')
    .select('*, PROPIEDADES:propiedades(*), INQUILINOS:inquilinos(*)')
    .eq('id_propietario', req.params.id_propietario)
    .order('created_at', { ascending: true })

  if (error) return res.status(500).json({ error: error.message })

  const grupos = {}
  for (const m of data) {
    const clave = `${m.id_propiedad}-${m.id_inquilino}`
    if (!grupos[clave]) {
      grupos[clave] = {
        id_propiedad: m.id_propiedad,
        id_inquilino: m.id_inquilino,
        propiedad: m.PROPIEDADES,
        inquilino: m.INQUILINOS,
        ultimo_mensaje: m,
        no_leidos: 0
      }
    }
    grupos[clave].ultimo_mensaje = m
    if (!m.leido && m.remitente === 'inquilino') grupos[clave].no_leidos++
  }

  res.json(Object.values(grupos).sort((a, b) =>
    new Date(b.ultimo_mensaje.created_at) - new Date(a.ultimo_mensaje.created_at)
  ))
})

// Lista de conversaciones para un inquilino (una por cada propiedad+propietario)
router.get('/conversaciones/inquilino/:id_inquilino', async (req, res) => {
  const { data, error } = await supabase
    .from('mensajes')
    .select('*, PROPIEDADES:propiedades(*), PROPIETARIOS:propietarios(*)')
    .eq('id_inquilino', req.params.id_inquilino)
    .order('created_at', { ascending: true })

  if (error) return res.status(500).json({ error: error.message })

  const grupos = {}
  for (const m of data) {
    const clave = `${m.id_propiedad}-${m.id_propietario}`
    if (!grupos[clave]) {
      grupos[clave] = {
        id_propiedad: m.id_propiedad,
        id_propietario: m.id_propietario,
        propiedad: m.PROPIEDADES,
        propietario: m.PROPIETARIOS,
        ultimo_mensaje: m,
        no_leidos: 0
      }
    }
    grupos[clave].ultimo_mensaje = m
    if (!m.leido && m.remitente === 'propietario') grupos[clave].no_leidos++
  }

  res.json(Object.values(grupos).sort((a, b) =>
    new Date(b.ultimo_mensaje.created_at) - new Date(a.ultimo_mensaje.created_at)
  ))
})

// Historial completo de una conversación específica
router.get('/:id_propiedad/:id_propietario/:id_inquilino', async (req, res) => {
  const { id_propiedad, id_propietario, id_inquilino } = req.params
  const { data, error } = await supabase
    .from('mensajes')
    .select('*')
    .eq('id_propiedad', id_propiedad)
    .eq('id_propietario', id_propietario)
    .eq('id_inquilino', id_inquilino)
    .order('created_at', { ascending: true })

  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

// Enviar un mensaje nuevo
router.post('/', async (req, res) => {
  const { id_propiedad, id_propietario, id_inquilino, remitente, contenido } = req.body

  if (!id_propiedad || !id_propietario || !id_inquilino || !remitente || !contenido) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' })
  }

  const { data, error } = await supabase
    .from('mensajes')
    .insert([{ id_propiedad, id_propietario, id_inquilino, remitente, contenido, leido: false }])
    .select()

  if (error) return res.status(500).json({ error: error.message })
  res.status(201).json(data[0])
})

// Marcar como leídos los mensajes enviados por la otra parte
router.put('/marcar-leido', async (req, res) => {
  const { id_propiedad, id_propietario, id_inquilino, remitente_a_marcar } = req.body

  const { error } = await supabase
    .from('mensajes')
    .update({ leido: true })
    .eq('id_propiedad', id_propiedad)
    .eq('id_propietario', id_propietario)
    .eq('id_inquilino', id_inquilino)
    .eq('remitente', remitente_a_marcar)
    .eq('leido', false)

  if (error) return res.status(500).json({ error: error.message })
  res.json({ message: 'Mensajes marcados como leídos' })
})

export default router