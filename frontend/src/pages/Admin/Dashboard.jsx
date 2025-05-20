import React, { useState, useEffect } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Bar, Pie } from 'react-chartjs-2';
import API from "../../utils/api";
import { toast } from "react-toastify";
import { FaBoxOpen, FaUsers, FaShoppingCart, FaDollarSign, FaTools, FaExclamationTriangle } from "react-icons/fa";

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const Dashboard = () => {
  // State for dashboard data
  const [isLoading, setIsLoading] = useState(true);
  const [summaryData, setSummaryData] = useState({
    totalProducts: 0,
    totalCustomers: 0,
    totalSales: 0,
    totalRevenue: 0,
    totalRepairs: 0,
    pendingRepairs: 0,
    lowStockItems: 0,
    monthlyRevenue: 0
  });
  const [salesChartData, setSalesChartData] = useState([]);
  const [repairStatusData, setRepairStatusData] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [categoryRevenue, setCategoryRevenue] = useState([]);
  const [salesPeriod, setSalesPeriod] = useState('weekly');

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      try {
        // Fetch summary data
        const summaryResponse = await API.get('/dashboard/summary');
        setSummaryData(summaryResponse.data.data);

        // Fetch sales chart data
        const salesChartResponse = await API.get(`/dashboard/sales-chart?period=${salesPeriod}`);
        setSalesChartData(salesChartResponse.data.data);

        // Fetch repair status distribution
        const repairStatusResponse = await API.get('/dashboard/repair-status');
        setRepairStatusData(repairStatusResponse.data.data);

        // Fetch top selling products
        const topProductsResponse = await API.get('/dashboard/top-products');
        setTopProducts(topProductsResponse.data.data);

        // Fetch low stock items
        const lowStockResponse = await API.get('/dashboard/low-stock');
        setLowStockItems(lowStockResponse.data.data);

        // Fetch revenue by category
        const categoryRevenueResponse = await API.get('/dashboard/category-revenue');
        setCategoryRevenue(categoryRevenueResponse.data.data);

        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        toast.error("Failed to load dashboard data");
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [salesPeriod]);

  // Format currency
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'LKR',
      minimumFractionDigits: 2
    }).format(value || 0);
  };

  // Prepare sales chart data
  const prepareSalesChartData = () => {
    if (!salesChartData || !salesChartData.length) return null;

    let labels = [];
    let salesData = [];
    let revenueData = [];

    try {
      if (salesPeriod === 'daily') {
        labels = salesChartData.map(item => {
          const date = new Date(item.day);
          return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        });
        salesData = salesChartData.map(item => item.count);
        revenueData = salesChartData.map(item => item.revenue);
      } else if (salesPeriod === 'weekly') {
        labels = salesChartData.map(item => {
          if (!item.start_date) return 'Unknown';
          const date = new Date(item.start_date);
          return `Week of ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
        });
        salesData = salesChartData.map(item => item.count);
        revenueData = salesChartData.map(item => item.revenue);
      } else if (salesPeriod === 'monthly') {
        labels = salesChartData.map(item => {
          if (!item.month) return 'Unknown';
          const [year, month] = item.month.split('-');
          return new Date(year, month - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        });
        salesData = salesChartData.map(item => item.count);
        revenueData = salesChartData.map(item => item.revenue);
      }

      // If we have no valid data points, return null
      if (labels.length === 0 || salesData.every(item => !item) && revenueData.every(item => !item)) {
        return null;
      }

      return {
        labels,
        datasets: [
          {
            label: 'Sales Count',
            data: salesData,
            borderColor: 'rgb(53, 162, 235)',
            backgroundColor: 'rgba(53, 162, 235, 0.5)',
            yAxisID: 'y',
          },
          {
            label: 'Revenue',
            data: revenueData,
            borderColor: 'rgb(75, 192, 192)',
            backgroundColor: 'rgba(75, 192, 192, 0.5)',
            yAxisID: 'y1',
          },
        ],
      };
    } catch (error) {
      console.error("Error preparing sales chart data:", error);
      return null;
    }
  };

  // Prepare repair status chart data
  const prepareRepairStatusData = () => {
    if (!repairStatusData.length) return null;

    const statusColors = {
      'Pending': 'rgba(255, 159, 64, 0.7)',
      'In Progress': 'rgba(54, 162, 235, 0.7)',
      'Waiting for Parts': 'rgba(255, 206, 86, 0.7)',
      'Completed': 'rgba(75, 192, 192, 0.7)',
      'Cannot Repair': 'rgba(255, 99, 132, 0.7)',
      'Picked Up': 'rgba(153, 102, 255, 0.7)'
    };

    return {
      labels: repairStatusData.map(item => item.status),
      datasets: [
        {
          data: repairStatusData.map(item => item.count),
          backgroundColor: repairStatusData.map(item => statusColors[item.status] || 'rgba(201, 203, 207, 0.7)'),
          borderWidth: 1,
        },
      ],
    };
  };

  // Prepare category revenue chart data
  const prepareCategoryRevenueData = () => {
    if (!categoryRevenue.length) return null;

    const backgroundColors = [
      'rgba(255, 99, 132, 0.7)',
      'rgba(54, 162, 235, 0.7)',
      'rgba(255, 206, 86, 0.7)',
      'rgba(75, 192, 192, 0.7)',
      'rgba(153, 102, 255, 0.7)',
      'rgba(255, 159, 64, 0.7)',
      'rgba(201, 203, 207, 0.7)'
    ];

    return {
      labels: categoryRevenue.map(item => item.category || 'Uncategorized'),
      datasets: [
        {
          data: categoryRevenue.map(item => item.revenue),
          backgroundColor: categoryRevenue.map((_, index) => backgroundColors[index % backgroundColors.length]),
          borderWidth: 1,
        },
      ],
    };
  };

  // Stats cards data
  const statsCards = [
    {
      title: "Total Products",
      value: summaryData.totalProducts,
      icon: <FaBoxOpen className="text-blue-500" size={24} />,
      color: "border-blue-500"
    },
    {
      title: "Total Customers",
      value: summaryData.totalCustomers,
      icon: <FaUsers className="text-purple-500" size={24} />,
      color: "border-purple-500"
    },
    {
      title: "Total Sales",
      value: summaryData.totalSales,
      icon: <FaShoppingCart className="text-green-500" size={24} />,
      color: "border-green-500"
    },
    {
      title: "Total Revenue",
      value: formatCurrency(summaryData.totalRevenue),
      icon: <FaDollarSign className="text-yellow-500" size={24} />,
      color: "border-yellow-500"
    },
    {
      title: "Pending Repairs",
      value: summaryData.pendingRepairs,
      icon: <FaTools className="text-red-500" size={24} />,
      color: "border-red-500"
    },
    {
      title: "Low Stock Items",
      value: summaryData.lowStockItems,
      icon: <FaExclamationTriangle className="text-orange-500" size={24} />,
      color: "border-orange-500"
    },
  ];

  // Loading state
  if (isLoading) {
    return (
      <div className="p-6 flex justify-center items-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 overflow-auto">
      <h1 className="text-2xl font-semibold mb-6">Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {statsCards.map((stat, index) => (
          <div key={index} className={`bg-white rounded-lg shadow p-6 border-t-4 border-l-0 border-r-0 border-b-0 ${stat.color}`}>
            <div className="flex justify-between items-start">
              <h3 className="text-lg font-medium text-gray-500">{stat.title}</h3>
              {stat.icon}
            </div>
            <div className="mt-4">
              <p className="text-2xl font-semibold">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Sales Trend Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Sales Trend</h2>
            <div className="flex space-x-2">
              <button
                onClick={() => setSalesPeriod('daily')}
                className={`px-3 py-1 rounded-md text-sm ${salesPeriod === 'daily' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700'}`}
              >
                Daily
              </button>
              <button
                onClick={() => setSalesPeriod('weekly')}
                className={`px-3 py-1 rounded-md text-sm ${salesPeriod === 'weekly' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700'}`}
              >
                Weekly
              </button>
              <button
                onClick={() => setSalesPeriod('monthly')}
                className={`px-3 py-1 rounded-md text-sm ${salesPeriod === 'monthly' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700'}`}
              >
                Monthly
              </button>
            </div>
          </div>
          <div className="h-80">
            {prepareSalesChartData() ? (
              <Line
                data={prepareSalesChartData()}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    y: {
                      type: 'linear',
                      display: true,
                      position: 'left',
                      title: {
                        display: true,
                        text: 'Sales Count'
                      }
                    },
                    y1: {
                      type: 'linear',
                      display: true,
                      position: 'right',
                      grid: {
                        drawOnChartArea: false,
                      },
                      title: {
                        display: true,
                        text: 'Revenue (LKR)'
                      }
                    },
                  },
                }}
              />
            ) : (
              <div className="flex flex-col justify-center items-center h-full">
                <p className="text-gray-500 mb-2">No sales data available for the selected period</p>
                <p className="text-gray-400 text-sm">Try selecting a different time period or check back later when more sales data is available</p>
              </div>
            )}
          </div>
        </div>

        {/* Revenue by Category */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Revenue by Category</h2>
          <div className="h-80">
            {prepareCategoryRevenueData() ? (
              <Pie
                data={prepareCategoryRevenueData()}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'right',
                    },
                    tooltip: {
                      callbacks: {
                        label: function(context) {
                          const label = context.label || '';
                          const value = context.raw || 0;
                          return `${label}: ${formatCurrency(value)}`;
                        }
                      }
                    }
                  }
                }}
              />
            ) : (
              <div className="flex justify-center items-center h-full">
                <p className="text-gray-500">No category revenue data available</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Repair Status Distribution */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Repair Status Distribution</h2>
          <div className="h-80">
            {prepareRepairStatusData() ? (
              <Pie
                data={prepareRepairStatusData()}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                }}
              />
            ) : (
              <div className="flex justify-center items-center h-full">
                <p className="text-gray-500">No repair status data available</p>
              </div>
            )}
          </div>
        </div>

        {/* Top Selling Products */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Top Selling Products</h2>
          <div className="h-80">
            {topProducts.length > 0 ? (
              <Bar
                data={{
                  labels: topProducts.map(product => product.name),
                  datasets: [
                    {
                      label: 'Units Sold',
                      data: topProducts.map(product => product.total_quantity),
                      backgroundColor: 'rgba(53, 162, 235, 0.5)',
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  indexAxis: 'y',
                }}
              />
            ) : (
              <div className="flex justify-center items-center h-full">
                <p className="text-gray-500">No product sales data available</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Low Stock Items */}
      <div className="mt-8 bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Low Stock Items</h2>
        {lowStockItems.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Remaining Quantity</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {lowStockItems.map((item, index) => (
                  <tr key={index} className={item.remaining_quantity === 0 ? "bg-red-50" : ""}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className={`px-2 py-1 rounded-full text-xs ${item.remaining_quantity === 0 ? "bg-red-100 text-red-800" : "bg-yellow-100 text-yellow-800"}`}>
                        {item.remaining_quantity}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500 text-center py-4">No low stock items found</p>
        )}
      </div>
    </div>
  );
};

export default Dashboard;