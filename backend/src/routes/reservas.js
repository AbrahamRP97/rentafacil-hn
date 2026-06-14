import { Router } from 'express'
import supabase from '../db.js'

const router = Router()

router.get('/', async (req, res) => {
  const { data, error } = await supabase
    .from('RESERVAS')
    .select('*, PROPIEDADES(*), INQUILINOS(*)')
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

router.get('/:id', async (req, res) => {
  const { data, error } = await supabase
    .from('RESERVAS')
    .select('*, PROPIEDADES(*), INQUILINOS(*)')
    .eq('id_reserva', req.params.id)
    .single()
  if (error) return res.status(404).json({ error: 'Reserva no encontrada' })
  res.json(data)
})

router.post('/', async (req, res) => {
  const { data, error } = await supabase
    .from('RESERVAS')
    .insert([req.body])
    .select()
  if (error) return res.status(500).json({ error: error.message })
  res.status(201).json(data[0])
})

router.put('/:id', async (req, res) => {
  const { data, error } = await supabase
    .from('RESERVAS')
    .update(req.body)
    .eq('id_reserva', req.params.id)
    .select()
  if (error) return res.status(500).json({ error: error.message })
  res.json(data[0])
})

router.delete('/:id', async (req, res) => {
  const { error } = await supabase
    .from('RESERVAS')
    .delete()
    .eq('id_reserva', req.params.id)
  if (error) return res.status(500).json({ error: error.message })
  res.json({ message: 'Reserva eliminada correctamente' })
})

export default router