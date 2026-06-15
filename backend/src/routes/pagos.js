import { Router } from 'express'
import supabase from '../db.js'

const router = Router()

router.get('/', async (req, res) => {
  const { data, error } = await supabase
    .from('pagos')
    .select('*, CONTRATOS:contratos(*)')
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

router.get('/:id', async (req, res) => {
  const { data, error } = await supabase
    .from('pagos')
    .select('*, CONTRATOS:contratos(*)')
    .eq('id_pago', req.params.id)
    .single()
  if (error) return res.status(404).json({ error: 'Pago no encontrado' })
  res.json(data)
})

router.post('/', async (req, res) => {
  const { data, error } = await supabase
    .from('pagos')
    .insert([req.body])
    .select()
  if (error) return res.status(500).json({ error: error.message })
  res.status(201).json(data[0])
})

router.put('/:id', async (req, res) => {
  const { data, error } = await supabase
    .from('pagos')
    .update(req.body)
    .eq('id_pago', req.params.id)
    .select()
  if (error) return res.status(500).json({ error: error.message })
  res.json(data[0])
})

router.delete('/:id', async (req, res) => {
  const { error } = await supabase
    .from('pagos')
    .delete()
    .eq('id_pago', req.params.id)
  if (error) return res.status(500).json({ error: error.message })
  res.json({ message: 'Pago eliminado correctamente' })
})

export default router
