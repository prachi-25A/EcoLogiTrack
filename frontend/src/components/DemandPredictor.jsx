import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import api from '../services/api';

const DemandPredictor = () => {
    const [date, setDate] = useState('');
    const [region, setRegion] = useState('');
    const [predictionData, setPredictionData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handlePredict = async () => {
        setLoading(true);
        setError('');
        setPredictionData(null);
        try {
            const response = await api.post('/predict-demand', { date, region });
            // Assuming the API returns data in a format suitable for Recharts
            // e.g., [{ name: 'Day 1', demand: 100 }, { name: 'Day 2', demand: 120 }]
            setPredictionData(response.data);
        } catch (err) {
            setError('Failed to fetch prediction. Please try again.');
            console.error('Prediction error:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="demand-predictor-container p-4">
            <h2 className="text-2xl font-bold mb-4">Demand Predictor</h2>
            <div className="input-group mb-4">
                <label htmlFor="date" className="block text-sm font-medium text-gray-700">Date:</label>
                <input
                    type="date"
                    id="date"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                />
            </div>
            <div className="input-group mb-4">
                <label htmlFor="region" className="block text-sm font-medium text-gray-700">Region:</label>
                <input
                    type="text"
                    id="region"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    placeholder="e.g., North, South"
                />
            </div>
            <button
                onClick={handlePredict}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                disabled={loading}
            >
                {loading ? 'Predicting...' : 'Predict Demand'}
            </button>

            {error && <p className="text-red-500 mt-4">{error}</p>}

            {predictionData && (
                <div className="chart-container mt-8" style={{ width: '100%', height: 300 }}>
                    <h3 className="text-xl font-semibold mb-4">Predicted Demand</h3>
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                            data={predictionData}
                            margin={{
                                top: 5, right: 30, left: 20, bottom: 5,
                            }}
                        >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" /> {/* Assuming 'name' for x-axis labels */}
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Line type="monotone" dataKey="demand" stroke="#8884d8" activeDot={{ r: 8 }} /> {/* Assuming 'demand' for y-axis values */}
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            )}
        </div>
    );
};

export default DemandPredictor;
