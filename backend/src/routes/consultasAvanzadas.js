import { Router } from 'express'
import supabase from '../db.js'

const router = Router()

const consultas = {
  propiedades_disponibles: 'Propiedades disponibles por municipio y rango de precio',
  reservas_pendientes: 'Reservas pendientes con datos del inquilino y la propiedad',
  historial_pagos: 'Historial de pagos por contrato',
  pagos_pendientes: 'Contratos activos con pagos pendientes',
  promedio_calificaciones: 'Promedio de calificaciones por contrato',
  ingresos_propietario: 'Ingresos completados por propietario',
  propiedades_mas_solicitadas: 'Propiedades mas solicitadas'
}

router.get('/', (req, res) => {
  const data = Object.entries(consultas).map(([id, title]) => ({ id, title }))
  res.json(data)
})

router.get('/:id', async (req, res) => {
  const handlers = {
    propiedades_disponibles,
    reservas_pendientes,
    historial_pagos,
    pagos_pendientes,
    promedio_calificaciones,
    ingresos_propietario,
    propiedades_mas_solicitadas
  }

  const handler = handlers[req.params.id]
  if (!handler) return res.status(404).json({ error: 'Consulta avanzada no encontrada' })

  const { data, error } = await handler()
  if (error) return res.status(500).json({ error: error.message })

  res.json({
    id: req.params.id,
    titulo: consultas[req.params.id],
    data
  })
})

async function propiedades_disponibles() {
  const { data, error } = await supabase
    .from('propiedades')
    .select('id_propiedad, titulo, tipo, precio_mensual, habitaciones, banos, UBICACIONES:ubicaciones(departamento, municipio)')
    .eq('estado', 'disponible')
    .gte('precio_mensual', 4000)
    .lte('precio_mensual', 16000)
    .order('precio_mensual', { ascending: true })

  return {
    data: data?.map((item) => ({
      id_propiedad: item.id_propiedad,
      titulo: item.titulo,
      tipo: item.tipo,
      departamento: item.UBICACIONES?.departamento,
      municipio: item.UBICACIONES?.municipio,
      precio_mensual: item.precio_mensual,
      habitaciones: item.habitaciones,
      banos: item.banos
    })),
    error
  }
}

async function reservas_pendientes() {
  const { data, error } = await supabase
    .from('reservas')
    .select('id_reserva, fecha_inicio, fecha_fin, estado, created_at, INQUILINOS:inquilinos(nombre, apellido, email), PROPIEDADES:propiedades(titulo, PROPIETARIOS:propietarios(nombre, apellido))')
    .eq('estado', 'pendiente')
    .order('created_at', { ascending: false })

  return {
    data: data?.map((item) => ({
      id_reserva: item.id_reserva,
      fecha_inicio: item.fecha_inicio,
      fecha_fin: item.fecha_fin,
      estado: item.estado,
      inquilino: `${item.INQUILINOS?.nombre ?? ''} ${item.INQUILINOS?.apellido ?? ''}`.trim(),
      email_inquilino: item.INQUILINOS?.email,
      propiedad: item.PROPIEDADES?.titulo,
      propietario: `${item.PROPIEDADES?.PROPIETARIOS?.nombre ?? ''} ${item.PROPIEDADES?.PROPIETARIOS?.apellido ?? ''}`.trim()
    })),
    error
  }
}

async function historial_pagos() {
  const { data, error } = await supabase
    .from('contratos')
    .select('id_contrato, RESERVAS:reservas(PROPIEDADES:propiedades(titulo), INQUILINOS:inquilinos(nombre, apellido)), PAGOS:pagos(fecha_pago, monto, metodo_pago, estado, referencia)')
    .order('id_contrato', { ascending: true })

  return {
    data: data?.flatMap((contrato) => {
      const pagos = contrato.PAGOS?.length ? contrato.PAGOS : [null]
      return pagos.map((pago) => ({
        id_contrato: contrato.id_contrato,
        propiedad: contrato.RESERVAS?.PROPIEDADES?.titulo,
        inquilino: `${contrato.RESERVAS?.INQUILINOS?.nombre ?? ''} ${contrato.RESERVAS?.INQUILINOS?.apellido ?? ''}`.trim(),
        fecha_pago: pago?.fecha_pago ?? null,
        monto: pago?.monto ?? null,
        metodo_pago: pago?.metodo_pago ?? null,
        estado: pago?.estado ?? null,
        referencia: pago?.referencia ?? null
      }))
    }),
    error
  }
}

async function pagos_pendientes() {
  const { data, error } = await supabase
    .from('pagos')
    .select('fecha_pago, estado, CONTRATOS:contratos(id_contrato, monto_mensual, estado, RESERVAS:reservas(PROPIEDADES:propiedades(titulo), INQUILINOS:inquilinos(nombre, apellido)))')
    .eq('estado', 'pendiente')
    .order('fecha_pago', { ascending: true })

  return {
    data: data
      ?.filter((item) => item.CONTRATOS?.estado === 'activo')
      .map((item) => ({
        id_contrato: item.CONTRATOS.id_contrato,
        propiedad: item.CONTRATOS.RESERVAS?.PROPIEDADES?.titulo,
        inquilino: `${item.CONTRATOS.RESERVAS?.INQUILINOS?.nombre ?? ''} ${item.CONTRATOS.RESERVAS?.INQUILINOS?.apellido ?? ''}`.trim(),
        monto_mensual: item.CONTRATOS.monto_mensual,
        fecha_pago: item.fecha_pago,
        estado_pago: item.estado
      })),
    error
  }
}

async function promedio_calificaciones() {
  const { data, error } = await supabase
    .from('contratos')
    .select('id_contrato, RESERVAS:reservas(PROPIEDADES:propiedades(titulo)), CALIFICACIONES:calificaciones(id_calificacion, puntuacion)')

  return {
    data: data?.map((contrato) => {
      const calificaciones = contrato.CALIFICACIONES ?? []
      const total = calificaciones.length
      const suma = calificaciones.reduce((acc, item) => acc + Number(item.puntuacion), 0)

      return {
        id_contrato: contrato.id_contrato,
        propiedad: contrato.RESERVAS?.PROPIEDADES?.titulo,
        promedio_calificacion: total ? Number((suma / total).toFixed(2)) : null,
        total_calificaciones: total
      }
    }),
    error
  }
}

async function ingresos_propietario() {
  const { data, error } = await supabase
    .from('propietarios')
    .select('id_propietario, nombre, apellido, PROPIEDADES:propiedades(id_propiedad, RESERVAS:reservas(CONTRATOS:contratos(PAGOS:pagos(monto, estado))))')

  return {
    data: data?.map((propietario) => {
      const propiedades = propietario.PROPIEDADES ?? []
      const ingresos = propiedades.reduce((total, propiedad) => {
        const reservas = propiedad.RESERVAS ?? []
        return total + reservas.reduce((subtotal, reserva) => {
          const contratos = Array.isArray(reserva.CONTRATOS) ? reserva.CONTRATOS : [reserva.CONTRATOS].filter(Boolean)
          return subtotal + contratos.reduce((sumaContrato, contrato) => {
            const pagos = contrato.PAGOS ?? []
            return sumaContrato + pagos
              .filter((pago) => pago.estado === 'completado')
              .reduce((sumaPago, pago) => sumaPago + Number(pago.monto), 0)
          }, 0)
        }, 0)
      }, 0)

      return {
        id_propietario: propietario.id_propietario,
        propietario: `${propietario.nombre} ${propietario.apellido}`,
        ingresos_completados: ingresos,
        propiedades_publicadas: propiedades.length
      }
    }).sort((a, b) => b.ingresos_completados - a.ingresos_completados),
    error
  }
}

async function propiedades_mas_solicitadas() {
  const { data, error } = await supabase
    .from('propiedades')
    .select('id_propiedad, titulo, tipo, RESERVAS:reservas(id_reserva)')

  return {
    data: data?.map((propiedad) => ({
      id_propiedad: propiedad.id_propiedad,
      titulo: propiedad.titulo,
      tipo: propiedad.tipo,
      total_reservas: propiedad.RESERVAS?.length ?? 0
    })).sort((a, b) => b.total_reservas - a.total_reservas || a.titulo.localeCompare(b.titulo)),
    error
  }
}

export default router
