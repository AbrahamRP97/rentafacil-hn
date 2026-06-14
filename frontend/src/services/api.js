import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:3000/api'
})

export const getPropiedades = () => api.get('/propiedades')
export const getPropiedad = (id) => api.get(`/propiedades/${id}`)
export const createPropiedad = (data) => api.post('/propiedades', data)
export const updatePropiedad = (id, data) => api.put(`/propiedades/${id}`, data)
export const deletePropiedad = (id) => api.delete(`/propiedades/${id}`)

export const getPropietarios = () => api.get('/propietarios')
export const getInquilinos = () => api.get('/inquilinos')
export const getReservas = () => api.get('/reservas')
export const getContratos = () => api.get('/contratos')
export const getPagos = () => api.get('/pagos')

export default api