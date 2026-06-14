import { Router } from 'express'
import supabase from '../db.js'

const router = Router()

router.get('/', async (req, res) => {
  const { data, error } = await supabase
    .from('CALIFICACIONES')
    .select('*, CONTRATOS(*)')
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

router.get('/:id', async (req, res) => {
  const { data, error } = await supabase
    .from('CALIFICACIONES')
    .select('*, CONTRATOS(*)')
    .eq('id_calificacion', req.params.id)
    .single()
  if (error) return res.status(404).json({ error: 'Calificación no encontrada' })
  res.json(data)
})

router.post('/', async (req, res) => {
  const { data, error } = await supabase
    .from('CALIFICACIONES')
    .insert([req.body])
    .select()
  if (error) return res.status(500).json({ error: error.message })
  res.status(201).json(data[0])
})

router.delete('/:id', async (req, res) => {
  const { error } = await supabase
    .from('CALIFICACIONES')
    .delete()
    .eq('id_calificacion', req.params.id)
  if (error) return res.status(500).json({ error: error.message })
  res.json({ message: 'Calificación eliminada correctamente' })
})

export default router