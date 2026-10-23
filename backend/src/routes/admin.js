import { Router } from 'express'
import supabase from '../db.js'
import { soloAdmin } from '../utils/auth.js'

const router = Router()

const redondear = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100

router.use(soloAdmin)

async function cargarPagosCompletados() {
  const [pagos, contratos, reservas, propiedades, propietarios, inquilinos] = await Promise.all([
    supabase.from('pagos').select('*').eq('estado', 'completado'),
    supabase.from('contratos').select('id_contrato, id_reserva'),
    supabase.from('reservas').select('id_reserva, id_propiedad, id_inquilino'),
    supabase.from('propiedades').select('id_propiedad, titulo, id_propietario'),
    supabase.from('propietarios').select('id_propietario, nombre, apellido, email, telefono'),
    supabase.from('inquilinos').select('id_inquilino, nombre, apellido')
  ])

  for (const r of [pagos, contratos, reservas, propiedades, propietarios, inquilinos]) {
    if (r.error) throw new Error(r.error.message)
  }

  const porId = (lista, campo) => Object.fromEntries((lista.data || []).map(x => [x[campo], x]))
  const mContratos = porId(contratos, 'id_contrato')
  const mReservas = porId(reservas, 'id_reserva')
  const mPropiedades = porId(propiedades, 'id_propiedad')
  const mPropietarios = porId(propietarios, 'id_propietario')
  const mInquilinos = porId(inquilinos, 'id_inquilino')

  return (pagos.data || []).map(p => {
    const contrato = mContratos[p.id_contrato]
    const reserva = contrato ? mReservas[contrato.id_reserva] : null
    const propiedad = reserva ? mPropiedades[reserva.id_propiedad] : null
    const propietario = propiedad ? mPropietarios[propiedad.id_propietario] : null
    const inquilino = reserva ? mInquilinos[reserva.id_inquilino] : null

    const comInq = Number(p.comision_inquilino || 0)
    const comProp = Number(p.comision_propietario || 0)
    const monto = Number(p.monto)
    const esTarjeta = p.metodo_pago === 'tarjeta'

    return {
      id_pago: p.id_pago,
      fecha_pago: p.fecha_pago,
      metodo_pago: p.metodo_pago,
      monto,
      comision_inquilino: comInq,
      comision_propietario: comProp,
      comision_total: redondear(comInq + comProp),
      liquidado: !!p.liquidado,
      direccion: esTarjeta ? 'plataforma_debe' : 'propietario_debe',
      importe_liquidacion: esTarjeta ? redondear(monto - comProp) : redondear(comInq + comProp),
      id_propietario: propietario?.id_propietario ?? null,
      propietario: propietario ? `${propietario.nombre} ${propietario.apellido}` : '—',
      propietario_email: propietario?.email ?? '',
      propietario_telefono: propietario?.telefono ?? '',
      propiedad: propiedad?.titulo ?? '—',
      inquilino: inquilino ? `${inquilino.nombre} ${inquilino.apellido}` : '—'
    }
  })
}

router.get('/resumen', async (req, res) => {
  try {
    const pagos = await cargarPagosCompletados()
    const conComision = pagos.filter(p => p.comision_total > 0 || !p.liquidado)

    const sumar = (lista, f) => redondear(lista.reduce((s, p) => s + f(p), 0))
    const pendientes = conComision.filter(p => !p.liquidado)

    const resumen = {
      comisiones_generadas: sumar(conComision, p => p.comision_total),
      comisiones_inquilinos: sumar(conComision, p => p.comision_inquilino),
      comisiones_propietarios: sumar(conComision, p => p.comision_propietario),
      por_cobrar_a_propietarios: sumar(pendientes.filter(p => p.direccion === 'propietario_debe'), p => p.importe_liquidacion),
      por_pagar_a_propietarios: sumar(pendientes.filter(p => p.direccion === 'plataforma_debe'), p => p.importe_liquidacion),
      pagos_con_comision: conComision.length
    }

    const porPropietario = {}
    for (const p of pendientes) {
      const k = p.id_propietario
      if (k == null) continue
      porPropietario[k] ||= {
        id_propietario: k,
        propietario: p.propietario,
        email: p.propietario_email,
        telefono: p.propietario_telefono,
        por_cobrar: 0,
        por_pagar: 0,
        pagos: 0
      }
      if (p.direccion === 'propietario_debe') porPropietario[k].por_cobrar += p.importe_liquidacion
      else porPropietario[k].por_pagar += p.importe_liquidacion
      porPropietario[k].pagos += 1
    }

    const propietarios = Object.values(porPropietario)
      .map(o => ({
        ...o,
        por_cobrar: redondear(o.por_cobrar),
        por_pagar: redondear(o.por_pagar),
        // positivo = la plataforma le debe al propietario; negativo = el propietario le debe a la plataforma
        balance: redondear(o.por_pagar - o.por_cobrar)
      }))
      .sort((a, b) => Math.abs(b.balance) - Math.abs(a.balance))

    const recientes = [...conComision]
      .sort((a, b) => b.id_pago - a.id_pago)
      .slice(0, 50)

    const { data: config } = await supabase.from('config_comisiones').select('*').eq('id', 1).maybeSingle()

    res.json({ resumen, propietarios, pagos_recientes: recientes, config })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

router.post('/liquidar', async (req, res) => {
  try {
    const id_propietario = Number(req.body.id_propietario)
    if (!id_propietario) return res.status(400).json({ error: 'id_propietario es obligatorio' })

    const pagos = await cargarPagosCompletados()
    const ids = pagos
      .filter(p => p.id_propietario === id_propietario && !p.liquidado)
      .map(p => p.id_pago)

    if (ids.length === 0) return res.status(400).json({ error: 'Este propietario no tiene pagos pendientes de liquidar' })

    const { error } = await supabase
      .from('pagos')
      .update({ liquidado: true, fecha_liquidacion: new Date().toISOString() })
      .in('id_pago', ids)
    if (error) return res.status(500).json({ error: error.message })

    res.json({ liquidados: ids.length })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

router.put('/config', async (req, res) => {
  const pctProp = Number(req.body.pct_propietario)
  const pctInq = Number(req.body.pct_inquilino)

  const valido = (n) => Number.isFinite(n) && n >= 0 && n <= 30
  if (!valido(pctProp) || !valido(pctInq)) {
    return res.status(400).json({ error: 'Los porcentajes deben estar entre 0 y 30' })
  }

  const { data, error } = await supabase
    .from('config_comisiones')
    .update({
      pct_propietario: redondear(pctProp),
      pct_inquilino: redondear(pctInq),
      updated_at: new Date().toISOString()
    })
    .eq('id', 1)
    .select()
  if (error) return res.status(500).json({ error: error.message })

  res.json(data[0])
})

export default router