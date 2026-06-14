import { Router } from 'express'
import supabase from '../db.js'

const router = Router()

router.get('/', async (req, res) => {
  const { data, error } = await supabase
    .from('PROPIEDADES')
    .select('*, UBICACIONES(*), PROPIETARIOS(*)')
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

router.get('/:id', async (req, res) => {
  const { data, error } = await supabase
    .from('PROPIEDADES')
    .select('*, UBICACIONES(*), PROPIETARIOS(*), IMAGENES_PROPIEDAD(*)')
    .eq('id_propiedad', req.params.id)
    .single()
  if (error) return res.status(404).json({ error: 'Propiedad no encontrada' })
  res.json(data)
})

router.post('/', async (req, res) => {
  const { data, error } = await supabase
    .from('PROPIEDADES')
    .insert([req.body])
    .select()
  if (error) return res.status(500).json({ error: error.message })
  res.status(201).json(data[0])
})

router.put('/:id', async (req, res) => {
  const { data, error } = await supabase
    .from('PROPIEDADES')
    .update(req.body)
    .eq('id_propiedad', req.params.id)
    .select()
  if (error) return res.status(500).json({ error: error.message })
  res.json(data[0])
})

router.delete('/:id', async (req, res) => {
  const { error } = await supabase
    .from('PROPIEDADES')
    .delete()
    .eq('id_propiedad', req.params.id)
  if (error) return res.status(500).json({ error: error.message })
  res.json({ message: 'Propiedad eliminada correctamente' })
})

export default router