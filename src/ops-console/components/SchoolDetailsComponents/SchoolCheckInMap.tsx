import { useEffect } from 'react';
import { t } from 'i18next';
import {
  Circle,
  MapContainer,
  Marker,
  Polyline,
  Popup,
  TileLayer,
  useMap,
} from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import leafletMarkerRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import leafletMarkerUrl from 'leaflet/dist/images/marker-icon.png';
import leafletMarkerShadowUrl from 'leaflet/dist/images/marker-shadow.png';
import greenMarkerRetinaUrl from '../../../assets/images/marker-icon-2x-green.png';
import greenMarkerShadowUrl from '../../../assets/images/marker-shadow.png';
import L from 'leaflet';
import logger from '../../../utility/logger';
import type { LatLng, TargetLocation } from './SchoolCheckInModal.types';
import { MAX_DISTANCE_METERS } from './schoolCheckInUtils';

delete (L.Icon.Default.prototype as any)._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: leafletMarkerRetinaUrl,
  iconUrl: leafletMarkerUrl,
  shadowUrl: leafletMarkerShadowUrl,
});

const MapBoundsFitter = ({
  schoolLoc,
  userLoc,
}: {
  schoolLoc: LatLng;
  userLoc: LatLng | null;
}) => {
  const map = useMap();
  const userLat = userLoc?.lat;
  const userLng = userLoc?.lng;

  useEffect(() => {
    if (userLat !== undefined && userLng !== undefined) {
      const bounds = L.latLngBounds([
        [schoolLoc.lat, schoolLoc.lng],
        [userLat, userLng],
      ]);
      try {
        map.fitBounds(bounds, {
          paddingTopLeft: [50, 130],
          paddingBottomRight: [50, 20],
        });
      } catch (e) {
        logger.warn('Map fitBounds failed', e);
      }
    } else {
      map.setView([schoolLoc.lat, schoolLoc.lng], 15);
    }
  }, [schoolLoc.lat, schoolLoc.lng, userLat, userLng, map]);

  return null;
};

type SchoolCheckInMapProps = {
  isSchoolLocationMissing: boolean;
  targetLocation: TargetLocation;
  userLocation: LatLng | null;
};

export default function SchoolCheckInMap({
  isSchoolLocationMissing,
  targetLocation,
  userLocation,
}: SchoolCheckInMapProps) {
  return (
    <div id="check-in-map-container" className="map-container">
      <MapContainer
        center={
          userLocation
            ? [userLocation.lat, userLocation.lng]
            : [targetLocation.lat, targetLocation.lng]
        }
        zoom={15}
        className="map-leaf-container"
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

        {!isSchoolLocationMissing && (
          <MapBoundsFitter schoolLoc={targetLocation} userLoc={userLocation} />
        )}
        {isSchoolLocationMissing && userLocation && (
          <MapBoundsFitter
            schoolLoc={{ lat: userLocation.lat, lng: userLocation.lng }}
            userLoc={null}
          />
        )}

        {!isSchoolLocationMissing && (
          <>
            <Circle
              center={[targetLocation.lat, targetLocation.lng]}
              radius={MAX_DISTANCE_METERS}
              pathOptions={{
                color: 'green',
                fillColor: 'green',
                fillOpacity: 0.1,
              }}
            />
            {userLocation && (
              <Polyline
                positions={[
                  [targetLocation.lat, targetLocation.lng],
                  [userLocation.lat, userLocation.lng],
                ]}
                pathOptions={{
                  color: 'red',
                  dashArray: '5, 10',
                  weight: 2,
                }}
              />
            )}
            <Marker
              position={[targetLocation.lat, targetLocation.lng]}
              icon={
                new L.Icon({
                  iconUrl: greenMarkerRetinaUrl,
                  shadowUrl: greenMarkerShadowUrl,
                  iconSize: [30, 41],
                  iconAnchor: [12, 41],
                  popupAnchor: [1, -34],
                  shadowSize: [41, 41],
                })
              }
            >
              <Popup autoPan={false}>{t('School Location')}</Popup>
            </Marker>
          </>
        )}

        {userLocation && (
          <Marker position={[userLocation.lat, userLocation.lng]}>
            <Popup autoPan={false}>{t('Your Location')}</Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
}
