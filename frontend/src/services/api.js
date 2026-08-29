import axios from 'axios'

const api = axios.create({
  baseURL: 'https://rentafacil-hn-backend.onrender.com/api'
})

export const getPropiedades = () => api.get('/propiedades')
export const getPropiedad = (id) => api.get(`/propiedades/${id}`)
export const createPropiedad = (data) => api.post('/propiedades', data)
export const updatePropiedad = (id, data) => api.put(`/propiedades/${id}`, data)
export const deletePropiedad = (id) => api.delete(`/propiedades/${id}`)

export const getPropietarios = () => api.get('/propietarios')
export const getPropietario = (id) => api.get(`/propietarios/${id}`)
export const createPropietario = (data) => api.post('/propietarios', data)
export const getPropietarioPorAuth = (auth_user_id) => api.get(`/propietarios/auth/${auth_user_id}`)

export const getInquilinos = () => api.get('/inquilinos')
export const getInquilino = (id) => api.get(`/inquilinos/${id}`)
export const createInquilino = (data) => api.post('/inquilinos', data)
export const getInquilinoPorAuth = (auth_user_id) => api.get(`/inquilinos/auth/${auth_user_id}`)

export const getReservas = () => api.get('/reservas')
export const getReserva = (id) => api.get(`/reservas/${id}`)
export const createReserva = (data) => api.post('/reservas', data)
export const updateReserva = (id, data) => api.put(`/reservas/${id}`, data)

export const getContratos = () => api.get('/contratos')
export const getPagos = () => api.get('/pagos')
export const getImagenes = (id_propiedad) => api.get(`/imagenes/${id_propiedad}`)
export const createImagen = (data) => api.post('/imagenes', data)
export const deleteImagen = (id) => api.delete(`/imagenes/${id}`)
export const uploadImagen = (formData) =>
  api.post('/imagenes/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
export const setImagenPortada = (id_imagen) => api.put(`/imagenes/${id_imagen}/portada`)

export const getConsultasAvanzadas = () => api.get('/consultas-avanzadas')
export const runConsultaAvanzada = (id) => api.get(`/consultas-avanzadas/${id}`)
export const aprobarReserva = (data) => api.post('/transacciones/aprobar-reserva', data)
export const registrarPago = (data) => api.post('/transacciones/registrar-pago', data)
export const cancelarContrato = (data) => api.post('/transacciones/cancelar-contrato', data)

// Chat interno
export const getConversacionesPropietario = (id_propietario) =>
  api.get(`/mensajes/conversaciones/propietario/${id_propietario}`)
export const getConversacionesInquilino = (id_inquilino) =>
  api.get(`/mensajes/conversaciones/inquilino/${id_inquilino}`)
export const getMensajesConversacion = (id_propiedad, id_propietario, id_inquilino) =>
  api.get(`/mensajes/${id_propiedad}/${id_propietario}/${id_inquilino}`)
export const enviarMensaje = (data) => api.post('/mensajes', data)
export const marcarMensajesLeidos = (data) => api.put('/mensajes/marcar-leido', data)

// Comprobante de transferencia
export const subirComprobante = (formData) =>
  api.post('/comprobantes/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })

// Pago con tarjeta (Stripe)
export const crearSesionPago = (data) => api.post('/pagos-stripe/crear-sesion', data)
export const verificarSesionPago = (data) => api.post('/pagos-stripe/verificar-sesion', data)

export default api