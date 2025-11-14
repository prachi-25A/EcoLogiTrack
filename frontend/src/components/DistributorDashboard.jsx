import React, { useState } from 'react';
import { Truck, CheckCircle, TrendingUp, Leaf, AlertCircle, Package } from 'lucide-react';
import RouteOptimization from './RouteOptimization'; // Import the new component

const DistributorDashboard = ({ orders, products, fetchDashboardData }) => {
  const [optimizing, setOptimizing] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleUpdateStatus = async (orderId, status) => {
    try {
      await orderAPI.updateOrderStatus(orderId, status);
      fetchDashboardData();
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };

  const activeDeliveries = orders.filter(o => o.status === 'in_transit' || o.status === 'confirmed');
  const completedDeliveries = orders.filter(o => o.status === 'delivered').length;
  
  // These will be calculated within the RouteOptimization component now
  // const totalDistance = routes.reduce((sum, r) => sum + (r.distance || 0), 0);
  // const totalCO2 = routes.reduce((sum, r) => sum + (r.co2_emissions || 0), 0);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Distributor Dashboard</h2>
      
      {/* Statistics Cards - These can be updated based on the output of the optimizer if needed */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Active Deliveries</p>
              <p className="text-3xl font-bold text-gray-800">{activeDeliveries.length}</p>
            </div>
            <Truck className="text-blue-500" size={36} />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Completed</p>
              <p className="text-3xl font-bold text-gray-800">{completedDeliveries}</p>
            </div>
            <CheckCircle className="text-green-500" size={36} />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Total Distance</p>
              <p className="text-3xl font-bold text-gray-800">N/A</p>
            </div>
            <TrendingUp className="text-purple-500" size={36} />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-emerald-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">CO₂ Emissions</p>
              <p className="text-3xl font-bold text-gray-800">N/A</p>
            </div>
            <Leaf className="text-emerald-500" size={36} />
          </div>
        </div>
      </div>

      {/* Route Optimization */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <RouteOptimization />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Active Deliveries Table */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold mb-4">Active Deliveries (Demand)</h3>
          {activeDeliveries.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Order ID</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Quantity</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Status</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {activeDeliveries.map((order, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-mono text-gray-700">#{order._id?.slice(-6)}</td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{order.quantity}L</td>
                      <td className="px-4 py-3">
                        <span className={`px-3 py-1 text-xs rounded-full font-medium ${
                          order.status === 'in_transit' ? 'bg-blue-100 text-blue-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={order.status}
                          onChange={(e) => handleUpdateStatus(order._id, e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none text-xs"
                        >
                          <option value="confirmed">Confirmed</option>
                          <option value="in_transit">In Transit</option>
                          <option value="delivered">Delivered</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <CheckCircle size={48} className="mx-auto mb-4 text-gray-300" />
              <p>No active deliveries at the moment</p>
            </div>
          )}
        </div>

        {/* Available Production Table */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold mb-4">Available Production (Supply)</h3>
          {products.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Product ID</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Quantity</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Quality</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {products.filter(p => p.available).map((product, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-mono text-gray-700">#{product._id?.slice(-6)}</td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{product.quantity}L</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          product.quality_grade === 'A+' ? 'bg-green-100 text-green-800' :
                          product.quality_grade === 'A' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {product.quality_grade}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {new Date(product.production_date).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <Package size={48} className="mx-auto mb-4 text-gray-300" />
              <p>No available production data</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DistributorDashboard;
