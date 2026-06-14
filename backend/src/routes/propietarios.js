import { Router } from 'express'
import supabase from '../db.js'

const router = Router()

router.get('/', async (req, res) => {
  const { data, error } = await supabase.from('PROPIETARIOS').select('*')
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

router.get('/:id', async (req, res) => {
  const { data, error } = await supabase
    .from('PROPIETARIOS')
    .select('*')
    .eq('id_propietario', req.params.id)
    .single()
  if (error) return res.status(404).json({ error: 'Propietario no encontrado' })
  res.json(data)
})

router.post('/', async (req, res) => {
  const { data, error } = await supabase
    .from('PROPIETARIOS')
    .insert([req.body])
    .select()
  if (error) return res.status(500).json({ error: error.message })
  res.status(201).json(data[0])
})

router.put('/:id', async (req, res) => {
  const { data, error } = await supabase
    .from('PROPIETARIOS')
    .update(req.body)
    .eq('id_propietario', req.params.id)
    .select()
  if (error) return res.status(500).json({ error: error.message })
  res.json(data[0])
})

router.delete('/:id', async (req, res) => {
  const { error } = await supabase
    .from('PROPIETARIOS')
    .delete()
    .eq('id_propietario', req.params.id)
  if (error) return res.status(500).json({ error: error.message })
  res.json({ message: 'Propietario eliminado correctamente' })
})

export default router