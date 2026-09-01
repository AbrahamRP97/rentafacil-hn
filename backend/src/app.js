import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'

import propietariosRouter   from './routes/propietarios.js'
import inquilinosRouter     from './routes/inquilinos.js'
import propiedadesRouter    from './routes/propiedades.js'
import ubicacionesRouter    from './routes/ubicaciones.js'
import reservasRouter       from './routes/reservas.js'
import contratosRouter      from './routes/contratos.js'
import pagosRouter          from './routes/pagos.js'
import calificacionesRouter from './routes/calificaciones.js'
import imagenesRouter       from './routes/imagenes.js'
import consultasRouter      from './routes/consultasAvanzadas.js'
import transaccionesRouter  from './routes/transacciones.js'
import mensajesRouter       from './routes/mensajes.js'
import comprobantesRouter   from './routes/comprobantes.js'
import pagosStripeRouter    from './routes/pagosStripe.js'

dotenv.config()

const app = express()
app.use(cors())
app.use(express.json())

app.use('/api/propietarios',   propietariosRouter)
app.use('/api/inquilinos',     inquilinosRouter)
app.use('/api/propiedades',    propiedadesRouter)
app.use('/api/ubicaciones',    ubicacionesRouter)
app.use('/api/reservas',       reservasRouter)
app.use('/api/contratos',      contratosRouter)
app.use('/api/pagos',          pagosRouter)
app.use('/api/calificaciones', calificacionesRouter)
app.use('/api/imagenes',       imagenesRouter)
app.use('/api/consultas-avanzadas', consultasRouter)
app.use('/api/transacciones', transaccionesRouter)
app.use('/api/mensajes',      mensajesRouter)
app.use('/api/comprobantes',  comprobantesRouter)
app.use('/api/pagos-stripe',  pagosStripeRouter)

app.get('/', (req, res) => {
  res.json({ message: 'RentaFácil HN API funcionando ✅' })
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`)
})