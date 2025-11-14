import React, { useState, useEffect } from 'react';
import { Leaf, AlertTriangle, CheckCircle } from 'lucide-react';

const SustainabilityReport = ({ distance, fuelType = 'diesel' }) => {
  const [emissions, setEmissions] = useState(null);
  const [score, setScore] = useState(''); // 'green', 'yellow', 'red'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (distance > 0) {
      const fetchEmissions = async () => {
        setLoading(true);
        setError('');
        try {
          const response = await fetch(`http://localhost:5001/api/carbon-footprint?distance=${distance}&fuel_type=${fuelType}`);
          if (!response.ok) {
            throw new Error('Failed to fetch emission data');
          }
          const data = await response.json();
          setEmissions(data.co2_emissions_kg);
          
          // Determine score based on emissions
          if (data.co2_emissions_kg < 10) {
            setScore('green');
          } else if (data.co2_emissions_kg <= 20) {
            setScore('yellow');
          } else {
            setScore('red');
          }
        } catch (err) {
          setError(err.message);
          setEmissions(null);
          setScore('');
        } finally {
          setLoading(false);
        }
      };

      fetchEmissions();
    } else {
      // Reset if distance is 0 or invalid
      setEmissions(null);
      setScore('');
    }
  }, [distance, fuelType]);

  const scoreConfig = {
    green: {
      icon: <CheckCircle className="text-green-500" size={32} />,
      textColor: 'text-green-700',
      bgColor: 'bg-green-100',
      message: 'Excellent',
    },
    yellow: {
      icon: <AlertTriangle className="text-yellow-500" size={32} />,
      textColor: 'text-yellow-700',
      bgColor: 'bg-yellow-100',
      message: 'Moderate',
    },
    red: {
      icon: <AlertTriangle className="text-red-500" size={32} />,
      textColor: 'text-red-700',
      bgColor: 'bg-red-100',
      message: 'High',
    },
  };

  const currentScore = scoreConfig[score];

  return (
    <div className="p-4 border rounded-lg bg-white shadow-sm">
      <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
        <Leaf size={20} className="mr-2 text-emerald-600" />
        Sustainability Score
      </h3>
      {loading && <p className="text-gray-500">Calculating...</p>}
      {error && <p className="text-red-500">{error}</p>}
      
      {emissions !== null && currentScore && (
        <div className={`p-4 rounded-md ${currentScore.bgColor} flex items-center space-x-4`}>
          {currentScore.icon}
          <div>
            <p className={`font-bold text-xl ${currentScore.textColor}`}>{currentScore.message}</p>
            <p className="text-gray-600">
              Estimated CO₂ Emissions: <span className="font-bold">{emissions} kg</span>
            </p>
          </div>
        </div>
      )}

      {distance <= 0 && !loading && (
        <p className="text-gray-500">Awaiting route optimization results to calculate score.</p>
      )}
    </div>
  );
};

export default SustainabilityReport;
