import { MapContainer, Marker, TileLayer } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import markerUrl from '../../../assets/images/marker-icon-2x-green.png';
import markerShadowUrl from '../../../assets/images/marker-shadow.png';
import type { SchoolCoordinates } from './schoolLocation';

const schoolMarker = L.icon({
  iconUrl: markerUrl,
  shadowUrl: markerShadowUrl,
  iconSize: [30, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

export default function SchoolLocationMap({
  location,
}: {
  location: SchoolCoordinates;
}) {
  return (
    <MapContainer
      key={`${location.lat},${location.lng}`}
      center={[location.lat, location.lng]}
      zoom={15}
      className="school-location-map"
      dragging={false}
      zoomControl={false}
      scrollWheelZoom={false}
      touchZoom={false}
      doubleClickZoom={false}
      keyboard={false}
      boxZoom={false}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      <Marker position={[location.lat, location.lng]} icon={schoolMarker} />
    </MapContainer>
  );
}
