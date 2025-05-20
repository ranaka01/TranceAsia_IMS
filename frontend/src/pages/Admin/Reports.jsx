import React, { useState, useEffect, useRef } from "react";
import { format, startOfDay, endOfDay, subDays } from "date-fns";
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
import { FaCalendarAlt, FaTimes, FaDownload, FaFilePdf, FaFileCsv } from "react-icons/fa";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import API from "../../utils/api";
import { toast } from "react-toastify";
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

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

const Reports = () => {
  // Date range state
  const [startDate, setStartDate] = useState(subDays(new Date(), 30));
  const [endDate, setEndDate] = useState(new Date());
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const datePickerRef = useRef(null);

  // Report data state
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("sales");
  const [salesData, setSalesData] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [categoryRevenue, setCategoryRevenue] = useState([]);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [salesSummary, setSalesSummary] = useState({
    totalSales: 0,
    totalRevenue: 0,
    averageOrderValue: 0,
    profitMargin: 0
  });

  // Fetch report data when date range changes
  useEffect(() => {
    fetchReportData();
  }, [startDate, endDate]);

  // Close date picker when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target)) {
        setIsDatePickerOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [datePickerRef]);

  // Fetch all report data
  const fetchReportData = async () => {
    setIsLoading(true);
    try {
      // Build query parameters for date filtering
      const params = new URLSearchParams();
      if (startDate) {
        params.append('startDate', startOfDay(startDate).toISOString());
      }
      if (endDate) {
        params.append('endDate', endOfDay(endDate).toISOString());
      }
      const queryString = params.toString();

      // Fetch sales data
      const salesResponse = await API.get(`sales/?${queryString}`);
      setSalesData(salesResponse.data?.data?.sales || []);

      // Calculate sales summary
      const sales = salesResponse.data?.data?.sales || [];
      const totalSales = sales.length;
      const totalRevenue = sales.reduce((sum, sale) => sum + parseFloat(sale.total || 0), 0);
      const averageOrderValue = totalSales > 0 ? totalRevenue / totalSales : 0;
      // Assuming a 30% profit margin for demonstration
      const profitMargin = totalRevenue * 0.3;

      setSalesSummary({
        totalSales,
        totalRevenue,
        averageOrderValue,
        profitMargin
      });

      // Fetch top products
      const topProductsResponse = await API.get(`dashboard/top-products?${queryString}`);
      setTopProducts(topProductsResponse.data?.data || []);

      // Fetch category revenue
      const categoryRevenueResponse = await API.get(`dashboard/category-revenue?${queryString}`);
      setCategoryRevenue(categoryRevenueResponse.data?.data || []);

      // Fetch low stock items
      const lowStockResponse = await API.get('dashboard/low-stock');
      setLowStockItems(lowStockResponse.data?.data || []);

      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching report data:", error);
      toast.error("Failed to load report data");
      setIsLoading(false);
    }
  };

  // Toggle date picker
  const toggleDatePicker = () => {
    setIsDatePickerOpen(!isDatePickerOpen);
  };

  // Handle date range change
  const handleDateChange = (dates) => {
    const [start, end] = dates;
    setStartDate(start);
    setEndDate(end);
    if (start && end) {
      setIsDatePickerOpen(false);
    }
  };

  // Clear date filter
  const clearDateFilter = () => {
    setStartDate(subDays(new Date(), 30));
    setEndDate(new Date());
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
      minimumFractionDigits: 2
    }).format(amount || 0);
  };

  // Prepare sales chart data
  const prepareSalesChartData = () => {
    if (!salesData || !salesData.length) return null;

    // Group sales by date
    const salesByDate = {};
    salesData.forEach(sale => {
      const date = new Date(sale.date).toLocaleDateString('en-US');
      if (!salesByDate[date]) {
        salesByDate[date] = {
          count: 0,
          revenue: 0
        };
      }
      salesByDate[date].count += 1;
      salesByDate[date].revenue += parseFloat(sale.total || 0);
    });

    // Convert to arrays for chart
    const dates = Object.keys(salesByDate).sort((a, b) => new Date(a) - new Date(b));
    const salesCounts = dates.map(date => salesByDate[date].count);
    const salesRevenue = dates.map(date => salesByDate[date].revenue);

    return {
      labels: dates,
      datasets: [
        {
          label: 'Sales Count',
          data: salesCounts,
          borderColor: 'rgb(53, 162, 235)',
          backgroundColor: 'rgba(53, 162, 235, 0.5)',
          yAxisID: 'y',
          tension: 0.4
        },
        {
          label: 'Revenue (LKR)',
          data: salesRevenue,
          borderColor: 'rgb(75, 192, 192)',
          backgroundColor: 'rgba(75, 192, 192, 0.5)',
          yAxisID: 'y1',
          tension: 0.4
        }
      ]
    };
  };

  // Prepare top products chart data
  const prepareTopProductsData = () => {
    if (!topProducts || !topProducts.length) return null;

    return {
      labels: topProducts.map(product => product.name),
      datasets: [
        {
          label: 'Units Sold',
          data: topProducts.map(product => product.total_quantity),
          backgroundColor: 'rgba(53, 162, 235, 0.5)',
        }
      ]
    };
  };

  // Prepare category revenue chart data
  const prepareCategoryRevenueData = () => {
    if (!categoryRevenue || !categoryRevenue.length) return null;

    return {
      labels: categoryRevenue.map(category => category.category || 'Uncategorized'),
      datasets: [
        {
          label: 'Revenue',
          data: categoryRevenue.map(category => category.revenue),
          backgroundColor: [
            'rgba(255, 99, 132, 0.6)',
            'rgba(54, 162, 235, 0.6)',
            'rgba(255, 206, 86, 0.6)',
            'rgba(75, 192, 192, 0.6)',
            'rgba(153, 102, 255, 0.6)',
            'rgba(255, 159, 64, 0.6)',
            'rgba(199, 199, 199, 0.6)'
          ],
          borderWidth: 1
        }
      ]
    };
  };

  // Export sales data as CSV
  const exportSalesCSV = () => {
    if (!salesData || !salesData.length) {
      toast.warning("No sales data to export");
      return;
    }

    // Create CSV content
    const headers = ["Invoice ID", "Date", "Customer", "Items", "Total (LKR)"];
    const rows = salesData.map(sale => [
      sale.invoice_id,
      new Date(sale.date).toLocaleDateString(),
      sale.customer_name || 'Walk-in Customer',
      sale.items_count || 0,
      parseFloat(sale.total || 0).toFixed(2)
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    // Create and download CSV file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `sales_report_${format(startDate, 'yyyy-MM-dd')}_to_${format(endDate, 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export low stock items as CSV
  const exportLowStockCSV = () => {
    if (!lowStockItems || !lowStockItems.length) {
      toast.warning("No low stock data to export");
      return;
    }

    // Create CSV content
    const headers = ["Product ID", "Product Name", "Remaining Quantity", "Reorder Level"];
    const rows = lowStockItems.map(item => [
      item.product_id,
      item.name,
      item.remaining_quantity,
      item.reorder_level || 10
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    // Create and download CSV file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `low_stock_report_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Generate PDF report
  const generatePDFReport = () => {
    if (!salesData || !salesData.length) {
      toast.warning("No sales data to export");
      return;
    }

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Add title
    doc.setFontSize(18);
    doc.text('Sales Report', pageWidth / 2, 15, { align: 'center' });

    // Add date range
    doc.setFontSize(12);
    doc.text(
      `Period: ${format(startDate, 'MMM dd, yyyy')} to ${format(endDate, 'MMM dd, yyyy')}`,
      pageWidth / 2,
      25,
      { align: 'center' }
    );

    // Add summary section
    doc.setFontSize(14);
    doc.text('Summary', 14, 35);

    const summaryData = [
      ['Total Sales', salesSummary.totalSales.toString()],
      ['Total Revenue', formatCurrency(salesSummary.totalRevenue)],
      ['Average Order Value', formatCurrency(salesSummary.averageOrderValue)],
      ['Estimated Profit', formatCurrency(salesSummary.profitMargin)]
    ];

    autoTable(doc, {
      startY: 40,
      head: [['Metric', 'Value']],
      body: summaryData,
      theme: 'grid',
      headStyles: { fillColor: [66, 66, 66] },
      margin: { left: 14, right: 14 },
      styles: { fontSize: 10 }
    });

    // Add sales data table
    doc.setFontSize(14);
    doc.text('Sales Transactions', 14, doc.lastAutoTable.finalY + 15);

    const salesTableData = salesData.map(sale => [
      sale.invoice_id,
      new Date(sale.date).toLocaleDateString(),
      sale.customer_name || 'Walk-in Customer',
      sale.items_count || 0,
      formatCurrency(sale.total)
    ]);

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 20,
      head: [['Invoice ID', 'Date', 'Customer', 'Items', 'Total']],
      body: salesTableData,
      theme: 'grid',
      headStyles: { fillColor: [66, 66, 66] },
      margin: { left: 14, right: 14 },
      styles: { fontSize: 9 }
    });

    // Add footer
    doc.setFontSize(10);
    doc.text(
      `Generated on ${new Date().toLocaleDateString()} - Trance Asia Computers`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );

    // Save the PDF
    doc.save(`sales_report_${format(startDate, 'yyyy-MM-dd')}_to_${format(endDate, 'yyyy-MM-dd')}.pdf`);
  };

  return (
    <div className="p-6 overflow-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Reports</h1>

        {/* Date range filter */}
        <div className="flex items-center relative" ref={datePickerRef}>
          {/* Date filter indicator */}
          <div className="flex items-center mr-3 bg-blue-50 px-3 py-1 rounded-md">
            <span className="text-sm text-blue-700">
              {format(startDate, 'MMM dd, yyyy')} - {format(endDate, 'MMM dd, yyyy')}
            </span>
            <button
              onClick={clearDateFilter}
              className="ml-2 text-blue-500 hover:text-blue-700"
              title="Reset to last 30 days"
            >
              <FaTimes size={14} />
            </button>
          </div>

          {/* Calendar icon button */}
          <button
            onClick={toggleDatePicker}
            className="flex items-center justify-center p-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            title="Filter by date range"
          >
            <FaCalendarAlt className="text-gray-600" />
          </button>

          {/* Date picker dropdown */}
          {isDatePickerOpen && (
            <div className="absolute right-0 top-full mt-1 z-10 bg-white shadow-lg rounded-md p-4 border border-gray-200">
              <DatePicker
                selected={startDate}
                onChange={handleDateChange}
                startDate={startDate}
                endDate={endDate}
                selectsRange
                inline
                calendarClassName="bg-white"
              />
            </div>
          )}
        </div>
      </div>

      {/* Report tabs */}
      <div className="mb-6 border-b border-gray-200">
        <ul className="flex flex-wrap -mb-px">
          <li className="mr-2">
            <button
              className={`inline-block py-2 px-4 text-sm font-medium ${
                activeTab === "sales"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
              onClick={() => setActiveTab("sales")}
            >
              Sales Reports
            </button>
          </li>
          <li className="mr-2">
            <button
              className={`inline-block py-2 px-4 text-sm font-medium ${
                activeTab === "inventory"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
              onClick={() => setActiveTab("inventory")}
            >
              Inventory Reports
            </button>
          </li>
        </ul>
      </div>

      {/* Loading state */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <>
          {/* Sales Reports Tab */}
          {activeTab === "sales" && (
            <div>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-lg shadow p-6 border-t-4 border-blue-500 border-l-0 border-r-0 border-b-0">
                  <h3 className="text-lg font-medium text-gray-500">Total Sales</h3>
                  <p className="text-2xl font-semibold mt-2">{salesSummary.totalSales}</p>
                </div>
                <div className="bg-white rounded-lg shadow p-6 border-t-4 border-green-500 border-l-0 border-r-0 border-b-0">
                  <h3 className="text-lg font-medium text-gray-500">Total Revenue</h3>
                  <p className="text-2xl font-semibold mt-2">{formatCurrency(salesSummary.totalRevenue)}</p>
                </div>
                <div className="bg-white rounded-lg shadow p-6 border-t-4 border-purple-500 border-l-0 border-r-0 border-b-0">
                  <h3 className="text-lg font-medium text-gray-500">Average Order Value</h3>
                  <p className="text-2xl font-semibold mt-2">{formatCurrency(salesSummary.averageOrderValue)}</p>
                </div>
                <div className="bg-white rounded-lg shadow p-6 border-t-4 border-yellow-500 border-l-0 border-r-0 border-b-0">
                  <h3 className="text-lg font-medium text-gray-500">Profit Margin</h3>
                  <p className="text-2xl font-semibold mt-2">{formatCurrency(salesSummary.profitMargin)}</p>
                </div>
              </div>

              {/* Export buttons */}
              <div className="flex justify-end mb-4 gap-2">
                <button
                  onClick={exportSalesCSV}
                  className="flex items-center px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
                >
                  <FaFileCsv className="mr-2" />
                  Export CSV
                </button>
                <button
                  onClick={generatePDFReport}
                  className="flex items-center px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm"
                >
                  <FaFilePdf className="mr-2" />
                  Export PDF
                </button>
              </div>

              {/* Sales Chart */}
              <div className="bg-white rounded-lg shadow p-6 mb-6">
                <h2 className="text-lg font-semibold mb-4">Sales Trend</h2>
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
                    <div className="flex justify-center items-center h-full">
                      <p className="text-gray-500">No sales data available for the selected period</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Charts Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Top Products Chart */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-lg font-semibold mb-4">Top Selling Products</h2>
                  <div className="h-80">
                    {prepareTopProductsData() ? (
                      <Bar
                        data={prepareTopProductsData()}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          indexAxis: 'y',
                        }}
                      />
                    ) : (
                      <div className="flex justify-center items-center h-full">
                        <p className="text-gray-500">No product data available for the selected period</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Category Revenue Chart */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-lg font-semibold mb-4">Revenue by Category</h2>
                  <div className="h-80">
                    {prepareCategoryRevenueData() ? (
                      <Pie
                        data={prepareCategoryRevenueData()}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                        }}
                      />
                    ) : (
                      <div className="flex justify-center items-center h-full">
                        <p className="text-gray-500">No category data available for the selected period</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Sales Table */}
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-lg font-semibold">Sales Transactions</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice ID</th>
                        <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                        <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
                        <th className="py-3 px-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {salesData.length > 0 ? (
                        salesData.map((sale, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="py-3 px-4 whitespace-nowrap">{sale.invoice_id}</td>
                            <td className="py-3 px-4 whitespace-nowrap">{new Date(sale.date).toLocaleDateString()}</td>
                            <td className="py-3 px-4 whitespace-nowrap">{sale.customer_name || 'Walk-in Customer'}</td>
                            <td className="py-3 px-4 whitespace-nowrap">{sale.items_count || 0}</td>
                            <td className="py-3 px-4 whitespace-nowrap text-right">{formatCurrency(sale.total)}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="5" className="py-4 px-4 text-center text-gray-500">
                            No sales data available for the selected period
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Inventory Reports Tab */}
          {activeTab === "inventory" && (
            <div>
              {/* Export button */}
              <div className="flex justify-end mb-4">
                <button
                  onClick={exportLowStockCSV}
                  className="flex items-center px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
                >
                  <FaFileCsv className="mr-2" />
                  Export Low Stock CSV
                </button>
              </div>

              {/* Low Stock Items */}
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-lg font-semibold">Low Stock Items</h2>
                  <p className="text-sm text-gray-500 mt-1">Products with inventory levels below the reorder threshold</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product ID</th>
                        <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product Name</th>
                        <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                        <th className="py-3 px-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Remaining Quantity</th>
                        <th className="py-3 px-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Reorder Level</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {lowStockItems.length > 0 ? (
                        lowStockItems.map((item, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="py-3 px-4 whitespace-nowrap">{item.product_id}</td>
                            <td className="py-3 px-4 whitespace-nowrap">{item.name}</td>
                            <td className="py-3 px-4 whitespace-nowrap">{item.category || 'Uncategorized'}</td>
                            <td className="py-3 px-4 whitespace-nowrap text-right">
                              <span className={`px-2 py-1 rounded-full text-xs ${parseInt(item.remaining_quantity) <= 5 ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                {item.remaining_quantity}
                              </span>
                            </td>
                            <td className="py-3 px-4 whitespace-nowrap text-right">{item.reorder_level || 10}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="5" className="py-4 px-4 text-center text-gray-500">
                            No low stock items found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Reports;