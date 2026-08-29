import { Router } from 'express'
import Stripe from 'stripe'

const router = Router()
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

// Crea una sesión de pago y devuelve la URL a la que el inquilino debe ser redirigido
router.post('/crear-sesion', async (req, res) => {
  try {
    const { id_contrato, monto, titulo_propiedad } = req.body

    if (!id_contrato || !monto) {
      return res.status(400).json({ error: 'id_contrato y monto son obligatorios' })
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: titulo_propiedad ? `Pago - ${titulo_propiedad}` : `Pago contrato #${id_contrato}`
          },
          unit_amount: Math.round(Number(monto) * 100)
        },
        quantity: 1
      }],
      success_url: `${process.env.FRONTEND_URL}/mis-reservas?pago=exito&id_contrato=${id_contrato}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/mis-reservas?pago=cancelado`
    })

    res.json({ url: session.url })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Verifica que el pago realmente se completó en Stripe antes de registrarlo en la BD
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
      monto: session.amount_total / 100
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router