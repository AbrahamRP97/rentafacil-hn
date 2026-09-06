import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import { Link } from 'react-router-dom'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import iconUrl from 'leaflet/dist/images/marker-icon.png'
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png'
import shadowUrl from 'leaflet/dist/images/marker-shadow.png'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({ iconRetinaUrl, iconUrl, shadowUrl })

const CENTRO_HONDURAS = [14.0723, -87.1921]

function MapaPropiedades({ propiedades, alturaMapa = '500px', zoomInicial = 7 }) {
  const propiedadesConCoordenadas = propiedades.filter(
    p => p.UBICACIONES?.latitud && p.UBICACIONES?.longitud
  )

  if (propiedadesConCoordenadas.length === 0) {
    return (
      <p style={styles.sinCoordenadas}>
        Ninguna propiedad tiene ubicación geográfica registrada todavía.
      </p>
    )
  }

  const centro = propiedadesConCoordenadas.length === 1
    ? [propiedadesConCoordenadas[0].UBICACIONES.latitud, propiedadesConCoordenadas[0].UBICACIONES.longitud]
    : CENTRO_HONDURAS

  return (
    <MapContainer
      center={centro}
      zoom={propiedadesConCoordenadas.length === 1 ? 15 : zoomInicial}
      style={{ height: alturaMapa, width: '100%', borderRadius: '8px' }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      {propiedadesConCoordenadas.map(p => (
        <Marker key={p.id_propiedad} position={[p.UBICACIONES.latitud, p.UBICACIONES.longitud]}>
          <Popup>
            <strong>{p.titulo}</strong><br />
            L. {p.precio_mensual} / mes<br />
            {p.UBICACIONES.municipio}, {p.UBICACIONES.departamento}<br />
            <Link to={`/propiedades/${p.id_propiedad}`}>Ver detalle →</Link>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}

const styles = {
  sinCoordenadas: {
    textAlign: 'center',
    color: '#888',
    padding: '3rem',
    backgroundColor: '#f9f9f9',
    borderRadius: '8px',
    fontSize: '0.9rem'
  }
}

export default MapaPropiedades