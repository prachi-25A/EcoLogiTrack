import React, { useState, useEffect } from 'react';
import { metricsAPI } from '../services/api';

const AdminDashboard = () => {
  const [metrics, setMetrics] = useState({ total_orders: 0, total_revenue: 0, active_users: 0 });

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const response = await metricsAPI.getDashboardMetrics();
        setMetrics(response.data);
      } catch (error) {
        console.error('Error fetching dashboard metrics:', error);
      }
    };

    fetchMetrics();
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-4">Admin Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold mb-2">Total Orders</h2>
          <p className="text-gray-700">{metrics.total_orders}</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold mb-2">Total Revenue</h2>
          <p className="text-gray-700">${metrics.total_revenue.toFixed(2)}</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold mb-2">Active Users</h2>
          <p className="text-gray-700">{metrics.active_users}</p>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
