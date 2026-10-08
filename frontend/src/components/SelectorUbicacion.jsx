import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import iconUrl from 'leaflet/dist/images/marker-icon.png'
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png'
import shadowUrl from 'leaflet/dist/images/marker-shadow.png'
import { geocodificarDireccion } from '../services/api'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({ iconRetinaUrl, iconUrl, shadowUrl })

const CENTRO_HONDURAS = [14.7, -86.5]
const ZOOM_PAIS = 7
const ZOOM_PIN = 17

const LIMITES_HONDURAS = { latMin: 12.9, latMax: 16.6, lngMin: -89.5, lngMax: -83.0 }

const redondear = (n) => Number(Number(n).toFixed(6))

const fueraDeHonduras = (lat, lng) =>
  lat < LIMITES_HONDURAS.latMin || lat > LIMITES_HONDURAS.latMax ||
  lng < LIMITES_HONDURAS.lngMin || lng > LIMITES_HONDURAS.lngMax

function CapturaClics({ onElegir }) {
  useMapEvents({
    click(e) {
      onElegir(e.latlng.lat, e.latlng.lng)
    }
  })
  return null
}

// Mueve la vista del mapa cuando el pin se coloca desde fuera (búsqueda o GPS)
function Recentrar({ destino }) {
  const map = useMap()
  useEffect(() => {
    if (destino) map.flyTo(destino.posicion, destino.zoom, { duration: 0.8 })
  }, [destino])
  return null
}

// Mapa donde el propietario ubica su propiedad con un pin.
function SelectorUbicacion({ latitud, longitud, onChange, departamento, municipio, direccion }) {
  const [buscando, setBuscando] = useState(false)
  const [mensaje, setMensaje] = useState(null) // { tipo: 'ok' | 'aviso' | 'error', texto }
  const [destino, setDestino] = useState(null)

  const tienePin = latitud !== null && latitud !== undefined && latitud !== '' &&
                   longitud !== null && longitud !== undefined && longitud !== ''
  const posicion = tienePin ? [Number(latitud), Number(longitud)] : null

  const elegir = (lat, lng) => {
    setMensaje(null)
    onChange({ latitud: redondear(lat), longitud: redondear(lng) })
  }

  const colocarYCentrar = (lat, lng, zoom = ZOOM_PIN) => {
    onChange({ latitud: redondear(lat), longitud: redondear(lng) })
    setDestino({ posicion: [lat, lng], zoom })
  }

  const buscarDireccion = async () => {
    setMensaje(null)
    setBuscando(true)
    try {
      const res = await geocodificarDireccion({ departamento, municipio, direccion })
      const { latitud: lat, longitud: lng, aproximada } = res.data
      colocarYCentrar(lat, lng, aproximada ? 14 : ZOOM_PIN)
      setMensaje(
        aproximada
          ? { tipo: 'aviso', texto: 'No encontramos la dirección exacta, así que el pin quedó en el municipio. Arrástralo o haz clic en el punto exacto de la propiedad.' }
          : { tipo: 'ok', texto: 'Pin colocado según la dirección. Verifica que esté en el lugar correcto y ajústalo si hace falta.' }
      )
    } catch (err) {
      const texto = err.response?.data?.error
      setMensaje({
        tipo: 'error',
        texto: (texto || 'No se pudo buscar la dirección') + ' Haz clic en el mapa para colocar el pin manualmente.'
      })
    } finally {
      setBuscando(false)
    }
  }

  const usarMiUbicacion = () => {
    setMensaje(null)
    if (!navigator.geolocation) {
      setMensaje({ tipo: 'error', texto: 'Tu navegador no permite obtener la ubicación.' })
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        colocarYCentrar(pos.coords.latitude, pos.coords.longitude)
        setMensaje({ tipo: 'ok', texto: 'Pin colocado en tu ubicación actual. Úsalo solo si estás en la propiedad.' })
      },
      () => setMensaje({ tipo: 'error', texto: 'No pudimos obtener tu ubicación. Revisa el permiso del navegador o haz clic en el mapa.' }),
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  const puedeBuscar = Boolean((municipio || '').trim() || (direccion || '').trim())

  return (
    <div style={styles.contenedor}>
      <p style={styles.ayuda}>
        Haz clic en el mapa para colocar el pin en el lugar exacto de la propiedad. Puedes arrastrarlo para ajustarlo.
      </p>

      <div style={styles.botones}>
        <button type="button" onClick={buscarDireccion} disabled={buscando || !puedeBuscar} className="btn btn-primario btn-sm">
          {buscando ? 'Buscando...' : '🔍 Buscar esta dirección en el mapa'}
        </button>
        <button type="button" onClick={usarMiUbicacion} className="btn btn-suave btn-sm">
          📍 Usar mi ubicación actual
        </button>
      </div>

      {mensaje && (
        <p style={{ ...styles.mensaje, ...styles[`mensaje_${mensaje.tipo}`] }}>{mensaje.texto}</p>
      )}

      <MapContainer
        center={posicion || CENTRO_HONDURAS}
        zoom={posicion ? ZOOM_PIN : ZOOM_PAIS}
        scrollWheelZoom={false}
        style={styles.mapa}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <CapturaClics onElegir={elegir} />
        <Recentrar destino={destino} />
        {posicion && (
          <Marker
            position={posicion}
            draggable
            eventHandlers={{
              dragend(e) {
                const { lat, lng } = e.target.getLatLng()
                elegir(lat, lng)
              }
            }}
          />
        )}
      </MapContainer>

      <p style={styles.estado}>
        {posicion
          ? `Pin colocado: ${posicion[0].toFixed(6)}, ${posicion[1].toFixed(6)}`
          : 'Aún no has colocado el pin. Si no lo colocas, intentaremos ubicar la dirección automáticamente y es posible que el mapa no aparezca.'}
      </p>

      {posicion && fueraDeHonduras(posicion[0], posicion[1]) && (
        <p style={{ ...styles.mensaje, ...styles.mensaje_aviso }}>
          Este punto parece estar fuera de Honduras. Revisa que el pin esté donde quieres.
        </p>
      )}
    </div>
  )
}

const styles = {
  contenedor: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.6rem'
  },
  ayuda: {
    margin: 0,
    fontSize: '0.82rem',
    color: '#666',
    lineHeight: 1.5
  },
  botones: {
    display: 'flex',
    gap: '0.5rem',
    flexWrap: 'wrap'
  },
  mapa: {
    height: '320px',
    width: '100%',
    borderRadius: '8px',
    border: '1px solid #ddd'
  },
  mensaje: {
    margin: 0,
    padding: '0.6rem 0.8rem',
    borderRadius: '4px',
    fontSize: '0.82rem',
    lineHeight: 1.5
  },
  mensaje_ok: { backgroundColor: '#e0ffe0', color: '#1e7e34' },
  mensaje_aviso: { backgroundColor: '#fff4e0', color: '#b26a00' },
  mensaje_error: { backgroundColor: '#ffe0e0', color: '#c0392b' },
  estado: {
    margin: 0,
    fontSize: '0.78rem',
    color: '#888'
  }
}

export default SelectorUbicacion