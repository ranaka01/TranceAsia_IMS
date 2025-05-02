import React from "react";

const Dashboard = () => {
  // Sample data for dashboard stats
  const stats = [
    { title: "Total Products", value: 156, change: "+12%", color: "bg-blue-500" },
    { title: "Total Orders", value: 876, change: "+25%", color: "bg-green-500" },
    { title: "Total Customers", value: 432, change: "+8%", color: "bg-purple-500" },
    { title: "Total Revenue", value: "$24,500", change: "+18%", color: "bg-yellow-500" },
  ];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-6">Dashboard</h1>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white rounded-lg shadow p-6 border-t-4 border-l-0 border-r-0 border-b-0" style={{ borderColor: stat.color.replace('bg-', 'border-') }}>
            <h3 className="text-lg font-medium text-gray-500">{stat.title}</h3>
            <div className="flex items-baseline mt-4">
              <p className="text-2xl font-semibold">{stat.value}</p>
              <span className="ml-2 text-sm font-medium text-green-600">{stat.change}</span>
            </div>
          </div>
        ))}
      </div>
      
      {/* Content Placeholders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Recent Orders</h2>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((item) => (
              <div key={item} className="flex justify-between items-center p-3 hover:bg-gray-50 rounded-md">
                <div>
                  <p className="font-medium">Order #{Math.floor(Math.random() * 10000)}</p>
                  <p className="text-sm text-gray-500">Customer #{Math.floor(Math.random() * 1000)}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium">${(Math.random() * 1000).toFixed(2)}</p>
                  <p className="text-sm text-gray-500">Today</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Inventory Status */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Low Stock Items</h2>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((item) => (
              <div key={item} className="flex justify-between items-center p-3 hover:bg-gray-50 rounded-md">
                <div>
                  <p className="font-medium">Product #{Math.floor(Math.random() * 10000)}</p>
                  <p className="text-sm text-gray-500">{Math.floor(Math.random() * 10)} units remaining</p>
                </div>
                <button className="px-3 py-1 bg-blue-100 text-blue-600 rounded-md text-sm">
                  Restock
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;