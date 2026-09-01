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

router.post('/', async (req, res) => {
  const { data, error } = await supabase
    .from('ubicaciones')
    .insert([req.body])
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