import { Router } from 'express'
import supabase from '../db.js'

const router = Router()

// POST /api/precios/cotizar

router.post('/cotizar', async (req, res) => {
  const { id_propiedad, fecha_inicio, fecha_fin } = req.body

  if (!id_propiedad || !fecha_inicio || !fecha_fin) {
    return res.status(400).json({ error: 'id_propiedad, fecha_inicio y fecha_fin son obligatorios' })
  }

  const { data, error } = await supabase.rpc('fn_calcular_precio', {
    p_id_propiedad: Number(id_propiedad),
    p_fecha_inicio: fecha_inicio,
    p_fecha_fin: fecha_fin
  })

  if (error) return res.status(400).json({ error: error.message })

  const q = data[0]
  res.json({
    noches: q.out_noches,
    tipo_estadia: q.out_tipo_estadia,
    precio_base_noche: Number(q.out_precio_base_noche),
    total: Number(q.out_subtotal),
    promedio_noche: Number(q.out_promedio_noche)
  })
})

export default router