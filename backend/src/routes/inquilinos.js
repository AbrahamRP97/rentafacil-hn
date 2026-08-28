import { Router } from 'express'
import supabase from '../db.js'

const router = Router()

router.get('/', async (req, res) => {
  const { data, error } = await supabase.from('inquilinos').select('*')
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

// IMPORTANTE: esta ruta va antes de '/:id' por la misma razón que en propietarios.js
router.get('/auth/:auth_user_id', async (req, res) => {
  const { data, error } = await supabase
    .from('inquilinos')
    .select('*')
    .eq('auth_user_id', req.params.auth_user_id)
    .single()
  if (error) return res.status(404).json({ error: 'Inquilino no encontrado para este usuario' })
  res.json(data)
})

router.get('/:id', async (req, res) => {
  const { data, error } = await supabase
    .from('inquilinos')
    .select('*')
    .eq('id_inquilino', req.params.id)
    .single()
  if (error) return res.status(404).json({ error: 'Inquilino no encontrado' })
  res.json(data)
})

router.post('/', async (req, res) => {
  const { data, error } = await supabase
    .from('inquilinos')
    .insert([req.body])
    .select()
  if (error) return res.status(500).json({ error: error.message })
  res.status(201).json(data[0])
})

router.put('/:id', async (req, res) => {
  const { data, error } = await supabase
    .from('inquilinos')
    .update(req.body)
    .eq('id_inquilino', req.params.id)
    .select()
  if (error) return res.status(500).json({ error: error.message })
  res.json(data[0])
})

router.delete('/:id', async (req, res) => {
  const { error } = await supabase
    .from('inquilinos')
    .delete()
    .eq('id_inquilino', req.params.id)
  if (error) return res.status(500).json({ error: error.message })
  res.json({ message: 'Inquilino eliminado correctamente' })
})

export default router