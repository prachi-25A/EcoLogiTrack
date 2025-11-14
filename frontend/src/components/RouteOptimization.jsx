import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import { routeAPI } from '../services/api';
import { PUNJAB_CITIES } from '../data/punjab_cities';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import SustainabilityReport from './SustainabilityReport';

// Fix for default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

const RouteOptimization = () => {
  const [selectedCities, setSelectedCities] = useState([{ name: 'ludhiana', demand: 0 }]); // Start with depot
  const [numVehicles, setNumVehicles] = useState(1);
  const [optimizedRoutes, setOptimizedRoutes] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [totalOptimizedDistance, setTotalOptimizedDistance] = useState(null);

  const handleCitySelect = (cityName) => {
    if (selectedCities.find(c => c.name === cityName)) {
      setSelectedCities(selectedCities.filter(c => c.name !== cityName));
    } else {
      setSelectedCities([...selectedCities, { name: cityName, demand: 100 }]); // Default demand
    }
  };

  const handleDemandChange = (cityName, demand) => {
    const updatedCities = selectedCities.map(c =>
      c.name === cityName ? { ...c, demand: parseInt(demand) } : c
    );
    setSelectedCities(updatedCities);
  };

  const handleOptimize = async () => {
    setLoading(true);
    setError('');
    setOptimizedRoutes(null);
    setTotalOptimizedDistance(null); // Reset distance on new optimization

    const locations = selectedCities.map(c => c.name);
    const demands = selectedCities.map(c => c.demand);

    try {
      const response = await routeAPI.optimizeRoute({
        locations,
        demands,
        num_vehicles: numVehicles,
      });
      setOptimizedRoutes(response.data);
      setTotalOptimizedDistance(response.data.total_distance);
    } catch (err) {
      setError('Failed to optimize route. Please try again.');
      console.error('Optimization error:', err);
    } finally {
      setLoading(false);
    }
  };

  const routeColors = ['blue', 'red', 'green', 'purple', 'orange'];

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-4">Route Optimization</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1">
          <h2 className="text-2xl font-bold mb-4">Settings</h2>
          <div className="mb-4">
            <label htmlFor="numVehicles" className="block text-gray-700 font-bold mb-2">Number of Vehicles</label>
            <input
              type="number"
              id="numVehicles"
              value={numVehicles}
              onChange={(e) => setNumVehicles(parseInt(e.target.value))}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              min="1"
            />
          </div>
          <h3 className="text-xl font-bold mb-2">Selected Cities</h3>
          <div className="space-y-2">
            {selectedCities.map(city => (
              <div key={city.name} className="flex items-center justify-between">
                <span className="capitalize">{city.name}</span>
                <input
                  type="number"
                  value={city.demand}
                  onChange={(e) => handleDemandChange(city.name, e.target.value)}
                  className="shadow appearance-none border rounded w-24 py-1 px-2 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  min="0"
                  disabled={city.name === 'ludhiana'} // Depot demand is always 0
                />
              </div>
            ))}
          </div>
          <button
            onClick={handleOptimize}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline mt-4 w-full"
            disabled={loading}
          >
            {loading ? 'Optimizing...' : 'Optimize Route'}
          </button>
          {error && <p className="text-red-500 mt-4">{error}</p>}
        </div>
        <div className="md:col-span-2">
          <MapContainer center={[31.1471, 75.3412]} zoom={8} style={{ height: '500px', width: '100%' }}>
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            {Object.entries(PUNJAB_CITIES).map(([key, city]) => (
              <Marker
                key={key}
                position={[city.lat, city.lon]}
                eventHandlers={{
                  click: () => handleCitySelect(key),
                }}
                opacity={selectedCities.find(c => c.name === key) ? 1 : 0.5}
              >
                <Popup>{city.name}</Popup>
              </Marker>
            ))}
            {optimizedRoutes && optimizedRoutes.routes.map((route, index) => (
              <Polyline
                key={index}
                positions={route.cities_with_coords.map(c => [c.lat, c.lon])}
                color={routeColors[index % routeColors.length]}
              />
            ))}
          </MapContainer>
        </div>
      </div>
      {optimizedRoutes && (
        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-4">Optimized Route Summary</h2>
          <p className="mb-2">Total Distance: {optimizedRoutes.total_distance} km</p>
          <p className="mb-4">Total CO2 Emissions: {optimizedRoutes.total_co2} kg</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {optimizedRoutes.routes.map((route, index) => (
              <div key={index} className="border p-4 rounded-lg">
                <h3 className="font-bold text-lg" style={{ color: routeColors[index % routeColors.length] }}>
                  Vehicle {route.vehicle_id}
                </h3>
                <p>Route: {route.cities.join(' -> ')}</p>
                <p>Distance: {route.distance} km</p>
                <p>Load: {route.load}</p>
              </div>
            ))}
          </div>
          <SustainabilityReport distance={totalOptimizedDistance} fuelType="diesel" />
        </div>
      )}
    </div>
  );
};

export default RouteOptimization;
