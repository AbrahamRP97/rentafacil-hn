import { Router } from 'express'

const router = Router()

// Instrucción de sistema: define el rol y alcance del asistente
const SYSTEM_INSTRUCTION = `Eres un asistente experto en administración de proyectos de software.
Ayudas a estudiantes y profesionales respondiendo preguntas sobre metodologías ágiles (Scrum, Kanban),
planificación de proyectos, gestión de riesgos, elaboración de cronogramas, estimación de esfuerzo y
buenas prácticas generales de gestión de proyectos de software.

Responde siempre en español, de forma clara, concisa y práctica, usando ejemplos concretos cuando
ayude a entender mejor la respuesta. Si la pregunta no tiene relación con administración de proyectos,
indícalo amablemente y redirige la conversación hacia ese tema.`

router.post('/consultar', async (req, res) => {
  try {
    const { pregunta } = req.body

    if (!pregunta) {
      return res.status(400).json({ error: 'La pregunta es obligatoria' })
    }

    const url = 'https://generativelanguage.googleapis.com/v1beta/interactions'

    const respuestaGemini = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': process.env.GEMINI_API_KEY
      },
      body: JSON.stringify({
        model: 'gemini-3.8-flash',
        input: pregunta,
        system_instruction: SYSTEM_INSTRUCTION
      })
    })

    const datos = await respuestaGemini.json()

    if (!respuestaGemini.ok || datos.status === 'failed') {
      return res.status(500).json({ error: datos.error?.message || 'Error al consultar Gemini' })
    }

    const pasoRespuesta = datos.steps?.find(paso => paso.type === 'model_output')
    const bloqueTexto = pasoRespuesta?.content?.find(bloque => bloque.type === 'text')
    const texto = bloqueTexto?.text || 'No se pudo generar una respuesta.'

    res.json({ respuesta: texto })
  } catch (err) {
    res.status(500).json({ error: 'Error inesperado al consultar el asistente' })
  }
})

export default router