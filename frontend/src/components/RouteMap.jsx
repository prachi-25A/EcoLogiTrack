import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

const RouteMap = ({ routes }) => {
  const colors = ['#3b82f6', '#10b981', '#f97316', '#8b5cf6'];

  return (
    <MapContainer center={[31.1471, 75.3412]} zoom={9} style={{ height: '500px', width: '100%' }}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      {routes.map((route, routeIndex) => {
        const positions = route.cities_with_coords.map(city => [city.lat, city.lon]);
        return (
          <div key={routeIndex}>
            <Polyline pathOptions={{ color: colors[routeIndex % colors.length] }} positions={positions} />
            {route.cities_with_coords.map((city, cityIndex) => (
              <Marker key={cityIndex} position={[city.lat, city.lon]}>
                <Popup>
                  {city.name}
                </Popup>
              </Marker>
            ))}
          </div>
        );
      })}
    </MapContainer>
  );
};

export default RouteMap;
