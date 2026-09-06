import { Router } from 'express'

const router = Router()

const SYSTEM_INSTRUCTION = `Eres un asistente experto en administración de proyectos de software.
Ayudas a estudiantes y profesionales respondiendo preguntas sobre metodologías ágiles (Scrum, Kanban),
planificación de proyectos, gestión de riesgos, elaboración de cronogramas, estimación de esfuerzo y
buenas prácticas generales de gestión de proyectos de software.

Responde siempre en español, de forma clara, concisa y práctica, usando ejemplos concretos cuando
ayude a entender mejor la respuesta. Si la pregunta no tiene relación con administración de proyectos,
indícalo amablemente y redirige la conversación hacia ese tema.`

const URL_INTERACTIONS = 'https://generativelanguage.googleapis.com/v1beta/interactions'

// Intenta un modelo específico y devuelve { ok, datos } o { ok: false, error }
async function consultarModelo(pregunta, modelo) {
  const respuesta = await fetch(URL_INTERACTIONS, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': process.env.GEMINI_API_KEY
    },
    body: JSON.stringify({
      model: modelo,
      input: pregunta,
      system_instruction: SYSTEM_INSTRUCTION
    })
  })

  const datos = await respuesta.json()

  if (!respuesta.ok || datos.status === 'failed') {
    return { ok: false, error: datos.error?.message || 'Error al consultar Gemini' }
  }

  const pasoRespuesta = datos.steps?.find(paso => paso.type === 'model_output')
  const bloqueTexto = pasoRespuesta?.content?.find(bloque => bloque.type === 'text')
  const texto = bloqueTexto?.text

  if (!texto) {
    return { ok: false, error: 'No se pudo generar una respuesta.' }
  }

  return { ok: true, texto }
}

router.post('/consultar', async (req, res) => {
  try {
    const { pregunta } = req.body

    if (!pregunta) {
      return res.status(400).json({ error: 'La pregunta es obligatoria' })
    }

    // Intenta primero con el modelo más reciente
    let resultado = await consultarModelo(pregunta, 'gemini-3.8-flash')

    // Si está saturado de demanda (u otro error), reintenta con un modelo de respaldo
    if (!resultado.ok) {
      resultado = await consultarModelo(pregunta, 'gemini-3.6-flash')
    }

    if (!resultado.ok) {
      return res.status(500).json({ error: resultado.error })
    }

    res.json({ respuesta: resultado.texto })
  } catch (err) {
    res.status(500).json({ error: 'Error inesperado al consultar el asistente' })
  }
})

export default router