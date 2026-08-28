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
export const createPropietario = (data) => api.post('/propietarios', data)
export const getPropietarioPorAuth = (auth_user_id) => api.get(`/propietarios/auth/${auth_user_id}`)

export const getInquilinos = () => api.get('/inquilinos')
export const createInquilino = (data) => api.post('/inquilinos', data)
export const getInquilinoPorAuth = (auth_user_id) => api.get(`/inquilinos/auth/${auth_user_id}`)

export const getReservas = () => api.get('/reservas')
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

export default api