import React, { useState } from 'react';
import { MapPin, Loader } from 'lucide-react';

const LocationPicker = ({ onLocationSelect, onCancel }) => {
  const [manualLocation, setManualLocation] = useState({ lat: '', lng: '' });
  const [loading, setLoading] = useState(false);

  const handleManualLocationChange = (e) => {
    setManualLocation({ ...manualLocation, [e.target.name]: e.target.value });
  };

  const handleUseCurrentLocation = () => {
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        onLocationSelect({ latitude, longitude });
        setLoading(false);
      },
      (error) => {
        console.error("Error getting current location:", error);
        setLoading(false);
        // Handle error (e.g., show a message to the user)
      }
    );
  };

  const handleManualLocationSubmit = () => {
    const lat = parseFloat(manualLocation.lat);
    const lng = parseFloat(manualLocation.lng);
    if (!isNaN(lat) && !isNaN(lng)) {
      onLocationSelect({ latitude: lat, longitude: lng });
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
        <h3 className="text-xl font-semibold mb-4">Select Location</h3>
        <div className="space-y-4">
          <button
            onClick={handleUseCurrentLocation}
            disabled={loading}
            className="w-full flex items-center justify-center bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition disabled:opacity-50"
          >
            {loading ? <Loader className="animate-spin mr-2" /> : <MapPin className="mr-2" />}
            Use My Current Location
          </button>
          <div className="text-center text-gray-500">OR</div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Enter Manually
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                name="lat"
                value={manualLocation.lat}
                onChange={handleManualLocationChange}
                placeholder="Latitude"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none"
              />
              <input
                type="text"
                name="lng"
                value={manualLocation.lng}
                onChange={handleManualLocationChange}
                placeholder="Longitude"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none"
              />
            </div>
          </div>
          <div className="flex justify-end gap-4">
            <button
              onClick={onCancel}
              className="text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              onClick={handleManualLocationSubmit}
              className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 transition"
            >
              Select
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LocationPicker;
