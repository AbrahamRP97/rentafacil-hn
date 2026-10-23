import { Router } from 'express'
import Stripe from 'stripe'
import supabase from '../db.js'

const router = Router()
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

router.post('/crear-sesion', async (req, res) => {
  try {
    const { id_contrato, monto, titulo_propiedad } = req.body

    if (!id_contrato || !monto) {
      return res.status(400).json({ error: 'id_contrato y monto son obligatorios' })
    }

    const montoBase = Number(monto)
    if (!Number.isFinite(montoBase) || montoBase <= 0) {
      return res.status(400).json({ error: 'El monto debe ser mayor a cero' })
    }
    const { data: com, error: errCom } = await supabase.rpc('fn_calcular_comision', { p_monto: montoBase })
    if (errCom) return res.status(500).json({ error: errCom.message })
    const cargoServicio = Number(com?.[0]?.out_comision_inquilino || 0)
    const totalACobrar = Math.round((montoBase + cargoServicio) * 100) / 100

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: titulo_propiedad ? `Pago - ${titulo_propiedad}` : `Pago contrato #${id_contrato}`
          },
          unit_amount: Math.round(totalACobrar * 100)
        },
        quantity: 1
      }],
      metadata: {
        id_contrato: String(id_contrato),
        monto_base: String(montoBase),
        cargo_servicio: String(cargoServicio)
      },
      success_url: `${process.env.FRONTEND_URL}/mis-reservas?pago=exito&id_contrato=${id_contrato}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/mis-reservas?pago=cancelado`
    })

    res.json({ url: session.url })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/verificar-sesion', async (req, res) => {
  try {
    const { session_id } = req.body
    if (!session_id) return res.status(400).json({ error: 'session_id es obligatorio' })

    const session = await stripe.checkout.sessions.retrieve(session_id)

    if (session.payment_status !== 'paid') {
      return res.status(400).json({ error: 'El pago no ha sido confirmado por Stripe' })
    }

    res.json({
      confirmado: true,
      monto: session.metadata?.monto_base ? Number(session.metadata.monto_base) : session.amount_total / 100
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router