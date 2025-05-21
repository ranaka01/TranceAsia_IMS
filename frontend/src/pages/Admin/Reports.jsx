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

  // Sales report state
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

  // Purchase report state
  const [purchasesData, setPurchasesData] = useState([]);
  const [purchaseSummary, setPurchaseSummary] = useState({
    totalPurchases: 0,
    totalCost: 0,
    averagePurchaseValue: 0
  });
  const [topSuppliers, setTopSuppliers] = useState([]);
  const [purchaseCategoryBreakdown, setPurchaseCategoryBreakdown] = useState([]);

  // Repair report state
  const [repairsData, setRepairsData] = useState([]);
  const [repairSummary, setRepairSummary] = useState({
    totalRepairs: 0,
    completedRepairs: 0,
    avgRepairTime: 0,
    totalRevenue: 0
  });
  const [technicianPerformance, setTechnicianPerformance] = useState([]);
  const [deviceTypeAnalysis, setDeviceTypeAnalysis] = useState([]);

  // Return report state has been removed

  // Fetch report data when date range or active tab changes
  useEffect(() => {
    fetchReportData();
  }, [startDate, endDate, activeTab]);

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

      console.log(`Fetching data for ${activeTab} tab with date range: ${startDate ? format(startDate, 'yyyy-MM-dd') : 'none'} to ${endDate ? format(endDate, 'yyyy-MM-dd') : 'none'}`);

      // Fetch data based on active tab
      if (activeTab === "sales" || activeTab === "all") {
        try {
          // Fetch sales data
          console.log("Fetching sales data...");
          const salesResponse = await API.get(`sales/?${queryString}`);
          console.log("Sales data response:", salesResponse.data);
          setSalesData(salesResponse.data?.data?.sales || []);

          // Fetch sales statistics from backend
          console.log("Fetching sales statistics...");
          const salesStatsResponse = await API.get(`dashboard/sales-stats?${queryString}`);
          console.log("Sales stats response:", salesStatsResponse.data);
          const statsData = salesStatsResponse.data?.data || {
            totalSales: 0,
            totalRevenue: 0,
            averageOrderValue: 0,
            profitMargin: 0
          };

          setSalesSummary(statsData);

          // Fetch top products
          console.log("Fetching top products...");
          const topProductsResponse = await API.get(`dashboard/top-products?${queryString}`);
          console.log("Top products response:", topProductsResponse.data);
          setTopProducts(topProductsResponse.data?.data || []);

          // Fetch category revenue
          console.log("Fetching category revenue...");
          const categoryRevenueResponse = await API.get(`dashboard/category-revenue?${queryString}`);
          console.log("Category revenue response:", categoryRevenueResponse.data);
          setCategoryRevenue(categoryRevenueResponse.data?.data || []);

          // Fetch low stock items
          console.log("Fetching low stock items...");
          const lowStockResponse = await API.get('dashboard/low-stock');
          console.log("Low stock response:", lowStockResponse.data);
          setLowStockItems(lowStockResponse.data?.data || []);
        } catch (error) {
          console.error("Error fetching sales data:", error);
          toast.error(`Failed to load sales data: ${error.message}`);
        }
      }

      if (activeTab === "purchases" || activeTab === "all") {
        try {
          // Fetch purchases data
          console.log("Fetching purchases data...");
          const purchasesResponse = await API.get(`purchases/?${queryString}`);
          console.log("Purchases data response:", purchasesResponse.data);

          // Log the structure of the first purchase item for debugging
          if (purchasesResponse.data?.data?.purchases && purchasesResponse.data.data.purchases.length > 0) {
            console.log("First purchase item structure:", JSON.stringify(purchasesResponse.data.data.purchases[0], null, 2));
          } else if (Array.isArray(purchasesResponse.data?.data) && purchasesResponse.data.data.length > 0) {
            console.log("First purchase item structure:", JSON.stringify(purchasesResponse.data.data[0], null, 2));
          }

          // Check the structure of the response
          if (purchasesResponse.data?.data?.purchases) {
            setPurchasesData(purchasesResponse.data.data.purchases);
          } else if (Array.isArray(purchasesResponse.data?.data)) {
            // If the data is directly an array
            setPurchasesData(purchasesResponse.data.data);
          } else {
            console.error("Unexpected purchases data structure:", purchasesResponse.data);
            setPurchasesData([]);
            toast.warning("Purchase data format is unexpected. Some information may not display correctly.");
          }

          try {
            // Fetch purchase statistics
            console.log("Fetching purchase statistics...");
            const purchaseStatsResponse = await API.get(`dashboard/purchase-stats?${queryString}`);
            console.log("Purchase stats response:", purchaseStatsResponse.data);
            const purchaseStats = purchaseStatsResponse.data?.data || {
              totalPurchases: 0,
              totalCost: 0,
              averagePurchaseValue: 0
            };

            setPurchaseSummary(purchaseStats);
          } catch (statsError) {
            console.error("Error fetching purchase statistics:", statsError);
            toast.error(`Failed to load purchase statistics: ${statsError.message}`);
            setPurchaseSummary({
              totalPurchases: 0,
              totalCost: 0,
              averagePurchaseValue: 0
            });
          }

          try {
            // Fetch top suppliers
            console.log("Fetching top suppliers...");
            const topSuppliersResponse = await API.get(`dashboard/top-suppliers?${queryString}`);
            console.log("Top suppliers response:", topSuppliersResponse.data);
            setTopSuppliers(topSuppliersResponse.data?.data || []);
          } catch (suppliersError) {
            console.error("Error fetching top suppliers:", suppliersError);
            toast.error(`Failed to load top suppliers: ${suppliersError.message}`);
            setTopSuppliers([]);
          }

          try {
            // Fetch purchase category breakdown
            console.log("Fetching purchase category breakdown...");
            const categoryBreakdownResponse = await API.get(`dashboard/purchase-category-breakdown?${queryString}`);
            console.log("Purchase category breakdown response:", categoryBreakdownResponse.data);
            setPurchaseCategoryBreakdown(categoryBreakdownResponse.data?.data || []);
          } catch (categoryError) {
            console.error("Error fetching purchase category breakdown:", categoryError);
            toast.error(`Failed to load purchase category breakdown: ${categoryError.message}`);
            setPurchaseCategoryBreakdown([]);
          }
        } catch (error) {
          console.error("Error fetching purchase data:", error);
          toast.error(`Failed to load purchase data: ${error.message}`);
          // Set default values for all purchase-related state
          setPurchasesData([]);
          setPurchaseSummary({
            totalPurchases: 0,
            totalCost: 0,
            averagePurchaseValue: 0
          });
          setTopSuppliers([]);
          setPurchaseCategoryBreakdown([]);
        }
      }

      if (activeTab === "repairs" || activeTab === "all") {
        try {
          // Fetch repairs data
          console.log("Fetching repairs data...");
          const repairsResponse = await API.get(`repairs/?${queryString}`);
          console.log("Repairs data response:", repairsResponse.data);

          // Log the structure of the first repair item for debugging
          if (repairsResponse.data?.data?.repairs && repairsResponse.data.data.repairs.length > 0) {
            console.log("First repair item structure:", JSON.stringify(repairsResponse.data.data.repairs[0], null, 2));
          } else if (Array.isArray(repairsResponse.data?.data) && repairsResponse.data.data.length > 0) {
            console.log("First repair item structure:", JSON.stringify(repairsResponse.data.data[0], null, 2));
          }

          // Check the structure of the response
          if (repairsResponse.data?.data?.repairs) {
            setRepairsData(repairsResponse.data.data.repairs);
          } else if (Array.isArray(repairsResponse.data?.data)) {
            // If the data is directly an array
            setRepairsData(repairsResponse.data.data);
          } else {
            console.error("Unexpected repairs data structure:", repairsResponse.data);
            setRepairsData([]);
            toast.warning("Repair data format is unexpected. Some information may not display correctly.");
          }

          try {
            // Fetch repair statistics
            console.log("Fetching repair statistics...");
            const repairStatsResponse = await API.get(`dashboard/repair-stats?${queryString}`);
            console.log("Repair stats response:", repairStatsResponse.data);
            const repairStats = repairStatsResponse.data?.data || {
              totalRepairs: 0,
              completedRepairs: 0,
              avgRepairTime: 0,
              totalRevenue: 0
            };

            setRepairSummary(repairStats);
          } catch (statsError) {
            console.error("Error fetching repair statistics:", statsError);
            toast.error(`Failed to load repair statistics: ${statsError.message}`);
            setRepairSummary({
              totalRepairs: 0,
              completedRepairs: 0,
              avgRepairTime: 0,
              totalRevenue: 0
            });
          }

          try {
            // Fetch technician performance
            console.log("Fetching technician performance...");
            const technicianResponse = await API.get(`dashboard/technician-performance?${queryString}`);
            console.log("Technician performance response:", technicianResponse.data);
            setTechnicianPerformance(technicianResponse.data?.data || []);
          } catch (techError) {
            console.error("Error fetching technician performance:", techError);
            toast.error(`Failed to load technician performance: ${techError.message}`);
            setTechnicianPerformance([]);
          }

          try {
            // Fetch device type analysis
            console.log("Fetching device type analysis...");
            const deviceTypeResponse = await API.get(`dashboard/device-type-analysis?${queryString}`);
            console.log("Device type analysis response:", deviceTypeResponse.data);
            setDeviceTypeAnalysis(deviceTypeResponse.data?.data || []);
          } catch (deviceError) {
            console.error("Error fetching device type analysis:", deviceError);
            toast.error(`Failed to load device type analysis: ${deviceError.message}`);
            setDeviceTypeAnalysis([]);
          }
        } catch (error) {
          console.error("Error fetching repair data:", error);
          toast.error(`Failed to load repair data: ${error.message}`);
          // Set default values for all repair-related state
          setRepairsData([]);
          setRepairSummary({
            totalRepairs: 0,
            completedRepairs: 0,
            avgRepairTime: 0,
            totalRevenue: 0
          });
          setTechnicianPerformance([]);
          setDeviceTypeAnalysis([]);
        }
      }

      // Return Reports data fetching has been removed

      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching report data:", error);
      toast.error(`Failed to load report data: ${error.message}`);
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

  // Prepare top suppliers chart data
  const prepareTopSuppliersData = () => {
    if (!topSuppliers || !topSuppliers.length) return null;

    return {
      labels: topSuppliers.map(supplier => supplier.supplier_name),
      datasets: [
        {
          label: 'Purchase Value (LKR)',
          data: topSuppliers.map(supplier => supplier.total_value),
          backgroundColor: 'rgba(75, 192, 192, 0.6)',
        }
      ]
    };
  };

  // Prepare purchase category breakdown chart data
  const preparePurchaseCategoryData = () => {
    if (!purchaseCategoryBreakdown || !purchaseCategoryBreakdown.length) return null;

    return {
      labels: purchaseCategoryBreakdown.map(category => category.category || 'Uncategorized'),
      datasets: [
        {
          label: 'Purchase Cost',
          data: purchaseCategoryBreakdown.map(category => category.total_cost),
          backgroundColor: [
            'rgba(54, 162, 235, 0.6)',
            'rgba(255, 206, 86, 0.6)',
            'rgba(75, 192, 192, 0.6)',
            'rgba(153, 102, 255, 0.6)',
            'rgba(255, 159, 64, 0.6)',
            'rgba(255, 99, 132, 0.6)',
            'rgba(199, 199, 199, 0.6)'
          ],
          borderWidth: 1
        }
      ]
    };
  };

  // Prepare repair status distribution chart data
  const prepareRepairStatusData = () => {
    if (!repairsData || !repairsData.length) return null;

    // Count repairs by status
    const statusCounts = {};
    repairsData.forEach(repair => {
      const status = repair.status || 'Unknown';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });

    const statuses = Object.keys(statusCounts);
    const counts = statuses.map(status => statusCounts[status]);

    return {
      labels: statuses,
      datasets: [
        {
          label: 'Repairs',
          data: counts,
          backgroundColor: [
            'rgba(255, 99, 132, 0.6)',
            'rgba(54, 162, 235, 0.6)',
            'rgba(255, 206, 86, 0.6)',
            'rgba(75, 192, 192, 0.6)',
            'rgba(153, 102, 255, 0.6)'
          ],
          borderWidth: 1
        }
      ]
    };
  };

  // Prepare technician performance chart data
  const prepareTechnicianPerformanceData = () => {
    if (!technicianPerformance || !technicianPerformance.length) return null;

    return {
      labels: technicianPerformance.map(tech => tech.technician_name || `Technician ${tech.technician}`),
      datasets: [
        {
          label: 'Completed Repairs',
          data: technicianPerformance.map(tech => tech.completed_repairs),
          backgroundColor: 'rgba(75, 192, 192, 0.6)',
        },
        {
          label: 'Total Repairs',
          data: technicianPerformance.map(tech => tech.total_repairs),
          backgroundColor: 'rgba(54, 162, 235, 0.6)',
        }
      ]
    };
  };

  // Prepare device type analysis chart data
  const prepareDeviceTypeData = () => {
    if (!deviceTypeAnalysis || !deviceTypeAnalysis.length) return null;

    return {
      labels: deviceTypeAnalysis.map(item => item.device_type || 'Unknown'),
      datasets: [
        {
          label: 'Repairs',
          data: deviceTypeAnalysis.map(item => item.count),
          backgroundColor: [
            'rgba(255, 99, 132, 0.6)',
            'rgba(54, 162, 235, 0.6)',
            'rgba(255, 206, 86, 0.6)',
            'rgba(75, 192, 192, 0.6)',
            'rgba(153, 102, 255, 0.6)',
            'rgba(255, 159, 64, 0.6)'
          ],
          borderWidth: 1
        }
      ]
    };
  };

  // Return Reasons chart has been removed

  // Export sales data as CSV
  const exportSalesCSV = () => {
    if (!salesData || !salesData.length) {
      toast.warning("No sales data to export");
      return;
    }

    // Create CSV content
    const headers = ["Invoice No", "Date", "Customer", "Items", "Total (LKR)"];
    const rows = salesData.map(sale => [
      sale.bill_no || sale.invoice_id || sale.invoice_no || 'N/A',
      new Date(sale.date).toLocaleDateString(),
      sale.customer_name || 'Walk-in Customer',
      sale.items || `${sale.items_count || 0} items`,
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
    const headers = ["Product Name", "Remaining Quantity", "Reorder Level"];
    const rows = lowStockItems.map(item => [
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

  // Export purchases data as CSV
  const exportPurchasesCSV = () => {
    if (!purchasesData || !purchasesData.length) {
      toast.warning("No purchase data to export");
      return;
    }

    // Create CSV content
    const headers = ["Purchase ID", "Product", "Supplier", "Quantity", "Buying Price", "Total Cost", "Date"];
    const rows = purchasesData.map(purchase => [
      purchase.purchase_id,
      purchase.product_name,
      purchase.supplier_name,
      purchase.quantity,
      parseFloat(purchase.buying_price || 0).toFixed(2),
      parseFloat((purchase.buying_price || 0) * (purchase.quantity || 0)).toFixed(2),
      new Date(purchase.date).toLocaleDateString()
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
    link.setAttribute('download', `purchases_report_${format(startDate, 'yyyy-MM-dd')}_to_${format(endDate, 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export repairs data as CSV
  const exportRepairsCSV = () => {
    if (!repairsData || !repairsData.length) {
      toast.warning("No repair data to export");
      return;
    }

    // Create CSV content
    const headers = ["Repair ID", "Customer", "Device", "Issue", "Status", "Received Date", "Completed Date", "Revenue"];
    const rows = repairsData.map(repair => [
      repair.repair_id || repair.id,
      repair.customer_name || repair.customer,
      `${repair.device_type || repair.deviceType} ${repair.device_model || repair.deviceModel}`,
      repair.issue_description || repair.issue,
      repair.status,
      new Date(repair.date_received || repair.dateReceived).toLocaleDateString(),
      (repair.date_completed || repair.dateCompleted) ? new Date(repair.date_completed || repair.dateCompleted).toLocaleDateString() : 'N/A',
      repair.status === 'Picked Up' ?
        parseFloat((repair.estimated_cost || parseFloat(repair.estimatedCost)) +
                  (repair.extra_expenses || parseFloat(repair.extraExpenses) || 0) -
                  (repair.advance_payment || parseFloat(repair.advancePayment) || 0)).toFixed(2) :
        'N/A'
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
    link.setAttribute('download', `repairs_report_${format(startDate, 'yyyy-MM-dd')}_to_${format(endDate, 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export returns data as CSV function has been removed

  // Generate low stock PDF report
  const generateLowStockPDFReport = () => {
    if (!lowStockItems || !lowStockItems.length) {
      toast.warning("No low stock data to export");
      return;
    }

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Add title
    doc.setFontSize(18);
    doc.text('Low Stock Items Report', pageWidth / 2, 15, { align: 'center' });

    // Add date
    doc.setFontSize(12);
    doc.text(
      `Generated on: ${format(new Date(), 'MMM dd, yyyy')}`,
      pageWidth / 2,
      25,
      { align: 'center' }
    );

    // Add low stock items table
    doc.setFontSize(14);
    doc.text('Low Stock Items', 14, 35);

    const lowStockTableData = lowStockItems.map(item => [
      item.name,
      item.remaining_quantity,
      item.reorder_level || 10
    ]);

    autoTable(doc, {
      startY: 40,
      head: [['Product Name', 'Remaining Quantity', 'Reorder Level']],
      body: lowStockTableData,
      theme: 'grid',
      headStyles: { fillColor: [66, 66, 66] },
      margin: { left: 14, right: 14 },
      styles: { fontSize: 10 }
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
    doc.save(`low_stock_report_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  };

  // Generate purchase PDF report
  const generatePurchasePDFReport = () => {
    if (!purchasesData || !purchasesData.length) {
      toast.warning("No purchase data to export");
      return;
    }

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Add title
    doc.setFontSize(18);
    doc.text('Purchase Report', pageWidth / 2, 15, { align: 'center' });

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
      ['Total Purchases', purchaseSummary.totalPurchases.toString()],
      ['Total Cost', formatCurrency(purchaseSummary.totalCost)]
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

    // Add purchase data table
    doc.setFontSize(14);
    doc.text('Purchase Transactions', 14, doc.lastAutoTable.finalY + 15);

    const purchaseTableData = purchasesData.map(purchase => [
      purchase.purchase_id,
      purchase.product_name,
      purchase.supplier_name,
      purchase.quantity,
      formatCurrency(purchase.buying_price),
      formatCurrency(purchase.buying_price * purchase.quantity),
      new Date(purchase.date).toLocaleDateString()
    ]);

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 20,
      head: [['ID', 'Product', 'Supplier', 'Qty', 'Unit Price', 'Total Cost', 'Date']],
      body: purchaseTableData,
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
    doc.save(`purchase_report_${format(startDate, 'yyyy-MM-dd')}_to_${format(endDate, 'yyyy-MM-dd')}.pdf`);
  };

  // Generate repair PDF report
  const generateRepairPDFReport = () => {
    if (!repairsData || !repairsData.length) {
      toast.warning("No repair data to export");
      return;
    }

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Add title
    doc.setFontSize(18);
    doc.text('Repair Service Report', pageWidth / 2, 15, { align: 'center' });

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
      ['Total Repairs', repairSummary.totalRepairs.toString()],
      ['Completed Repairs', repairSummary.completedRepairs.toString()],
      ['Total Revenue', formatCurrency(repairSummary.totalRevenue)]
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

    // Add repair data table
    doc.setFontSize(14);
    doc.text('Repair History', 14, doc.lastAutoTable.finalY + 15);

    const repairTableData = repairsData.map(repair => [
      repair.repair_id || repair.id,
      repair.customer_name || repair.customer,
      `${repair.device_type || repair.deviceType} ${repair.device_model || repair.deviceModel}`,
      repair.status,
      new Date(repair.date_received || repair.dateReceived).toLocaleDateString(),
      (repair.date_completed || repair.dateCompleted) ? new Date(repair.date_completed || repair.dateCompleted).toLocaleDateString() : 'N/A'
    ]);

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 20,
      head: [['ID', 'Customer', 'Device', 'Status', 'Received', 'Completed']],
      body: repairTableData,
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
    doc.save(`repair_report_${format(startDate, 'yyyy-MM-dd')}_to_${format(endDate, 'yyyy-MM-dd')}.pdf`);
  };

  // Generate return PDF report function has been removed

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
      sale.bill_no || sale.invoice_id || sale.invoice_no || 'N/A',
      new Date(sale.date).toLocaleDateString(),
      sale.customer_name || 'Walk-in Customer',
      sale.items || `${sale.items_count || 0} items`,
      formatCurrency(sale.total)
    ]);

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 20,
      head: [['Invoice No', 'Date', 'Customer', 'Items', 'Total']],
      body: salesTableData,
      theme: 'grid',
      headStyles: { fillColor: [66, 66, 66] },
      margin: { left: 14, right: 14 },
      styles: { fontSize: 9 },
      columnStyles: {
        3: { cellWidth: 'auto', overflow: 'linebreak' } // Make Items column wider with text wrapping
      }
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
                activeTab === "purchases"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
              onClick={() => setActiveTab("purchases")}
            >
              Purchase Reports
            </button>
          </li>
          <li className="mr-2">
            <button
              className={`inline-block py-2 px-4 text-sm font-medium ${
                activeTab === "repairs"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
              onClick={() => setActiveTab("repairs")}
            >
              Repair Reports
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
        <div className="flex flex-col items-center justify-center h-64">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Loading {activeTab} report data...</p>
        </div>
      ) : (
        <>
          {/* Sales Reports Tab */}
          {activeTab === "sales" && (
            <div>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white rounded-lg shadow p-6 border-t-4 border-blue-500 border-l-0 border-r-0 border-b-0">
                  <h3 className="text-lg font-medium text-gray-500">Total Sales</h3>
                  <p className="text-2xl font-semibold mt-2">{salesSummary.totalSales}</p>
                </div>
                <div className="bg-white rounded-lg shadow p-6 border-t-4 border-green-500 border-l-0 border-r-0 border-b-0">
                  <h3 className="text-lg font-medium text-gray-500">Total Revenue</h3>
                  <p className="text-2xl font-semibold mt-2">{formatCurrency(salesSummary.totalRevenue)}</p>
                </div>
                <div className="bg-white rounded-lg shadow p-6 border-t-4 border-yellow-500 border-l-0 border-r-0 border-b-0">
                  <h3 className="text-lg font-medium text-gray-500">Profit</h3>
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
                        <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice No</th>
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
                            <td className="py-3 px-4 whitespace-nowrap">{sale.bill_no || sale.invoice_id || sale.invoice_no || 'N/A'}</td>
                            <td className="py-3 px-4 whitespace-nowrap">{new Date(sale.date).toLocaleDateString()}</td>
                            <td className="py-3 px-4 whitespace-nowrap">{sale.customer_name || 'Walk-in Customer'}</td>
                            <td className="py-3 px-4">
                              {sale.items ? (
                                <div className="max-w-xs">
                                  {sale.items.length > 50 ? (
                                    <div className="relative group">
                                      <span className="cursor-pointer text-blue-600 hover:text-blue-800">
                                        {sale.items.substring(0, 50)}...
                                      </span>
                                      <div className="hidden group-hover:block absolute z-10 bg-white p-2 rounded shadow-lg border border-gray-200 max-w-md">
                                        {sale.items}
                                      </div>
                                    </div>
                                  ) : (
                                    sale.items
                                  )}
                                </div>
                              ) : (
                                <span className="text-gray-500">{sale.items_count || 0} items</span>
                              )}
                            </td>
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

          {/* Purchases Reports Tab */}
          {activeTab === "purchases" && (
            <div>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-white rounded-lg shadow p-6 border-t-4 border-blue-500 border-l-0 border-r-0 border-b-0">
                  <h3 className="text-lg font-medium text-gray-500">Total Purchases</h3>
                  <p className="text-2xl font-semibold mt-2">{purchaseSummary.totalPurchases}</p>
                </div>
                <div className="bg-white rounded-lg shadow p-6 border-t-4 border-green-500 border-l-0 border-r-0 border-b-0">
                  <h3 className="text-lg font-medium text-gray-500">Total Cost</h3>
                  <p className="text-2xl font-semibold mt-2">{formatCurrency(purchaseSummary.totalCost)}</p>
                </div>
              </div>

              {/* Export buttons */}
              <div className="flex justify-end mb-4 gap-2">
                <button
                  onClick={exportPurchasesCSV}
                  className="flex items-center px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
                >
                  <FaFileCsv className="mr-2" />
                  Export CSV
                </button>
                <button
                  onClick={generatePurchasePDFReport}
                  className="flex items-center px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm"
                >
                  <FaFilePdf className="mr-2" />
                  Export PDF
                </button>
              </div>

              {/* Charts Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Top Suppliers Chart */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-lg font-semibold mb-4">Top Suppliers by Value</h2>
                  <div className="h-80">
                    {topSuppliers && topSuppliers.length > 0 ? (
                      prepareTopSuppliersData() ? (
                        <Bar
                          data={prepareTopSuppliersData()}
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            indexAxis: 'y',
                          }}
                        />
                      ) : (
                        <div className="flex justify-center items-center h-full">
                          <p className="text-gray-500">Error preparing chart data</p>
                        </div>
                      )
                    ) : (
                      <div className="flex justify-center items-center h-full">
                        <p className="text-gray-500">No supplier data available for the selected period</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Category Breakdown Chart */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-lg font-semibold mb-4">Purchase by Category</h2>
                  <div className="h-80">
                    {purchaseCategoryBreakdown && purchaseCategoryBreakdown.length > 0 ? (
                      preparePurchaseCategoryData() ? (
                        <Pie
                          data={preparePurchaseCategoryData()}
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                          }}
                        />
                      ) : (
                        <div className="flex justify-center items-center h-full">
                          <p className="text-gray-500">Error preparing chart data</p>
                        </div>
                      )
                    ) : (
                      <div className="flex justify-center items-center h-full">
                        <p className="text-gray-500">No category data available for the selected period</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Purchases Table */}
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-lg font-semibold">Purchase Transactions</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Purchase ID</th>
                        <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                        <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Supplier</th>
                        <th className="py-3 px-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                        <th className="py-3 px-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Price</th>
                        <th className="py-3 px-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total Cost</th>
                        <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {purchasesData.length > 0 ? (
                        purchasesData.map((purchase, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="py-3 px-4 whitespace-nowrap">{purchase.purchase_id}</td>
                            <td className="py-3 px-4 whitespace-nowrap">{purchase.product_name}</td>
                            <td className="py-3 px-4 whitespace-nowrap">{purchase.supplier_name}</td>
                            <td className="py-3 px-4 whitespace-nowrap text-right">{purchase.quantity}</td>
                            <td className="py-3 px-4 whitespace-nowrap text-right">{formatCurrency(purchase.buying_price)}</td>
                            <td className="py-3 px-4 whitespace-nowrap text-right">{formatCurrency(purchase.buying_price * purchase.quantity)}</td>
                            <td className="py-3 px-4 whitespace-nowrap">{new Date(purchase.date).toLocaleDateString()}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="7" className="py-4 px-4 text-center text-gray-500">
                            No purchase data available for the selected period
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Repairs Reports Tab */}
          {activeTab === "repairs" && (
            <div>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white rounded-lg shadow p-6 border-t-4 border-blue-500 border-l-0 border-r-0 border-b-0">
                  <h3 className="text-lg font-medium text-gray-500">Total Repairs</h3>
                  <p className="text-2xl font-semibold mt-2">{repairSummary.totalRepairs}</p>
                </div>
                <div className="bg-white rounded-lg shadow p-6 border-t-4 border-green-500 border-l-0 border-r-0 border-b-0">
                  <h3 className="text-lg font-medium text-gray-500">Completed Repairs</h3>
                  <p className="text-2xl font-semibold mt-2">{repairSummary.completedRepairs}</p>
                </div>
                <div className="bg-white rounded-lg shadow p-6 border-t-4 border-yellow-500 border-l-0 border-r-0 border-b-0">
                  <h3 className="text-lg font-medium text-gray-500">Total Revenue</h3>
                  <p className="text-2xl font-semibold mt-2">{formatCurrency(repairSummary.totalRevenue)}</p>
                </div>
              </div>

              {/* Export buttons */}
              <div className="flex justify-end mb-4 gap-2">
                <button
                  onClick={exportRepairsCSV}
                  className="flex items-center px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
                >
                  <FaFileCsv className="mr-2" />
                  Export CSV
                </button>
                <button
                  onClick={generateRepairPDFReport}
                  className="flex items-center px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm"
                >
                  <FaFilePdf className="mr-2" />
                  Export PDF
                </button>
              </div>

              {/* Charts Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Status Distribution Chart */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-lg font-semibold mb-4">Repair Status Distribution</h2>
                  <div className="h-80">
                    {repairsData && repairsData.length > 0 ? (
                      prepareRepairStatusData() ? (
                        <Pie
                          data={prepareRepairStatusData()}
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                          }}
                        />
                      ) : (
                        <div className="flex justify-center items-center h-full">
                          <p className="text-gray-500">Error preparing chart data</p>
                        </div>
                      )
                    ) : (
                      <div className="flex justify-center items-center h-full">
                        <p className="text-gray-500">No repair status data available for the selected period</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Technician Performance Chart */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-lg font-semibold mb-4">Technician Performance</h2>
                  <div className="h-80">
                    {technicianPerformance && technicianPerformance.length > 0 ? (
                      prepareTechnicianPerformanceData() ? (
                        <Bar
                          data={prepareTechnicianPerformanceData()}
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                          }}
                        />
                      ) : (
                        <div className="flex justify-center items-center h-full">
                          <p className="text-gray-500">Error preparing chart data</p>
                        </div>
                      )
                    ) : (
                      <div className="flex justify-center items-center h-full">
                        <p className="text-gray-500">No technician data available for the selected period</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Device Type Analysis */}
              <div className="bg-white rounded-lg shadow p-6 mb-6">
                <h2 className="text-lg font-semibold mb-4">Device Type Analysis</h2>
                <div className="h-80">
                  {deviceTypeAnalysis && deviceTypeAnalysis.length > 0 ? (
                    prepareDeviceTypeData() ? (
                      <Bar
                        data={prepareDeviceTypeData()}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                        }}
                      />
                    ) : (
                      <div className="flex justify-center items-center h-full">
                        <p className="text-gray-500">Error preparing chart data</p>
                      </div>
                    )
                  ) : (
                    <div className="flex justify-center items-center h-full">
                      <p className="text-gray-500">No device type data available for the selected period</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Repairs Table */}
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-lg font-semibold">Repair History</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Repair ID</th>
                        <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                        <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Device</th>
                        <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Issue</th>
                        <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Received</th>
                        <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Completed</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {repairsData.length > 0 ? (
                        repairsData.map((repair, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="py-3 px-4 whitespace-nowrap">{repair.repair_id || repair.id}</td>
                            <td className="py-3 px-4 whitespace-nowrap">{repair.customer_name || repair.customer}</td>
                            <td className="py-3 px-4 whitespace-nowrap">{`${repair.device_type || repair.deviceType} ${repair.device_model || repair.deviceModel}`}</td>
                            <td className="py-3 px-4 whitespace-nowrap">{repair.issue_description || repair.issue}</td>
                            <td className="py-3 px-4 whitespace-nowrap">
                              <span className={`px-2 py-1 rounded-full text-xs ${
                                repair.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                                repair.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                                repair.status === 'Completed' ? 'bg-green-100 text-green-800' :
                                repair.status === 'Cannot Repair' ? 'bg-red-100 text-red-800' :
                                repair.status === 'Picked Up' ? 'bg-purple-100 text-purple-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {repair.status}
                              </span>
                            </td>
                            <td className="py-3 px-4 whitespace-nowrap">{new Date(repair.date_received || repair.dateReceived).toLocaleDateString()}</td>
                            <td className="py-3 px-4 whitespace-nowrap">{(repair.date_completed || repair.dateCompleted) ? new Date(repair.date_completed || repair.dateCompleted).toLocaleDateString() : '-'}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="7" className="py-4 px-4 text-center text-gray-500">
                            No repair data available for the selected period
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Returns Reports Tab has been removed */}

          {/* Inventory Reports Tab */}
          {activeTab === "inventory" && (
            <div>
              {/* Export buttons */}
              <div className="flex justify-end mb-4 gap-2">
                <button
                  onClick={exportLowStockCSV}
                  className="flex items-center px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
                >
                  <FaFileCsv className="mr-2" />
                  Export CSV
                </button>
                <button
                  onClick={generateLowStockPDFReport}
                  className="flex items-center px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm"
                >
                  <FaFilePdf className="mr-2" />
                  Export PDF
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
                        <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product Name</th>
                        <th className="py-3 px-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Remaining Quantity</th>
                        <th className="py-3 px-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Reorder Level</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {lowStockItems.length > 0 ? (
                        lowStockItems.map((item, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="py-3 px-4 whitespace-nowrap">{item.name}</td>
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
                          <td colSpan="3" className="py-4 px-4 text-center text-gray-500">
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