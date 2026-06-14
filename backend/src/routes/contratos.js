import { Router } from 'express'
import supabase from '../db.js'

const router = Router()

router.get('/', async (req, res) => {
  const { data, error } = await supabase
    .from('CONTRATOS')
    .select('*, RESERVAS(*)')
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

router.get('/:id', async (req, res) => {
  const { data, error } = await supabase
    .from('CONTRATOS')
    .select('*, RESERVAS(*), PAGOS(*), CALIFICACIONES(*)')
    .eq('id_contrato', req.params.id)
    .single()
  if (error) return res.status(404).json({ error: 'Contrato no encontrado' })
  res.json(data)
})

router.post('/', async (req, res) => {
  const { data, error } = await supabase
    .from('CONTRATOS')
    .insert([req.body])
    .select()
  if (error) return res.status(500).json({ error: error.message })
  res.status(201).json(data[0])
})

router.put('/:id', async (req, res) => {
  const { data, error } = await supabase
    .from('CONTRATOS')
    .update(req.body)
    .eq('id_contrato', req.params.id)
    .select()
  if (error) return res.status(500).json({ error: error.message })
  res.json(data[0])
})

router.delete('/:id', async (req, res) => {
  const { error } = await supabase
    .from('CONTRATOS')
    .delete()
    .eq('id_contrato', req.params.id)
  if (error) return res.status(500).json({ error: error.message })
  res.json({ message: 'Contrato eliminado correctamente' })
})

export default router