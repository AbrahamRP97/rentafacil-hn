import { Router } from 'express'
import supabase from '../db.js'

const router = Router()

router.post('/aprobar-reserva', async (req, res) => {
  const { id_reserva, deposito = null, instrucciones_checkin = null } = req.body

  if (!id_reserva) {
    return res.status(400).json({ error: 'id_reserva es obligatorio' })
  }

  const { data, error } = await supabase.rpc('fn_aprobar_reserva', {
    p_id_reserva: Number(id_reserva),
    p_deposito: deposito === null ? null : Number(deposito),
    p_instrucciones_checkin: instrucciones_checkin
  })

  if (error) return res.status(400).json({ error: error.message })
  res.json(data[0])
})

router.post('/registrar-pago', async (req, res) => {
  const {
    id_contrato,
    monto,
    metodo_pago,
    fecha_pago = null,
    referencia = null
  } = req.body

  if (!id_contrato || !monto || !metodo_pago) {
    return res.status(400).json({
      error: 'id_contrato, monto y metodo_pago son obligatorios'
    })
  }

  const parametros = {
    p_id_contrato: Number(id_contrato),
    p_monto: Number(monto),
    p_metodo_pago: metodo_pago,
    p_referencia: referencia
  }

  if (fecha_pago) parametros.p_fecha_pago = fecha_pago

  const { data, error } = await supabase.rpc(
    'fn_registrar_pago',
    parametros
  )

  if (error) return res.status(400).json({ error: error.message })
  res.status(201).json(data[0])
})

router.post('/cancelar-contrato', async (req, res) => {
  const { id_contrato } = req.body

  if (!id_contrato) {
    return res.status(400).json({ error: 'id_contrato es obligatorio' })
  }

  const { data, error } = await supabase.rpc('fn_cancelar_contrato', {
    p_id_contrato: Number(id_contrato)
  })

  if (error) return res.status(400).json({ error: error.message })
  res.json(data[0])
})

export default router