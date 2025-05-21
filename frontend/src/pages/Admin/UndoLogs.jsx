import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import API from "../../utils/api";
import { toast } from "react-toastify";
import { FaDownload, FaCalendarAlt, FaTimes, FaEye } from "react-icons/fa";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import SearchInput from "../../components/UI/SearchInput";
import Button from "../../components/UI/Button";

const UndoLogs = () => {
  const [activeTab, setActiveTab] = useState("sales"); // "sales" or "purchases"
  const [saleLogs, setSaleLogs] = useState([]);
  const [purchaseLogs, setPurchaseLogs] = useState([]);
  const [filteredSaleLogs, setFilteredSaleLogs] = useState([]);
  const [filteredPurchaseLogs, setFilteredPurchaseLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    limit: 50
  });

  // Load logs when component mounts or date range changes
  useEffect(() => {
    const fetchLogs = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Build query parameters
        const params = new URLSearchParams();
        if (startDate) {
          params.append('startDate', startDate.toISOString());
        }
        if (endDate) {
          params.append('endDate', endDate.toISOString());
        }
        params.append('page', pagination.currentPage);
        params.append('limit', pagination.limit);

        const queryString = params.toString();

        // Fetch logs based on active tab
        if (activeTab === "sales") {
          const url = `undo-logs/?${queryString}`;
          const response = await API.get(url);
          const data = response.data?.data?.logs || [];
          setSaleLogs(data);
          setFilteredSaleLogs(data);

          // Update pagination
          if (response.data?.pagination) {
            setPagination(response.data.pagination);
          }
        } else {
          try {
            // Use the correct URL for purchase undo logs
            const url = `purchases/undo-logs?${queryString}`;
            console.log('Fetching purchase undo logs from URL:', url);
            const response = await API.get(url);
            console.log('Purchase undo logs response:', response.data);
            const data = response.data?.data?.logs || [];
            setPurchaseLogs(data);
            setFilteredPurchaseLogs(data);

            // Update pagination
            if (response.data?.data?.pagination) {
              setPagination(response.data.data.pagination);
            }
          } catch (error) {
            console.error('Error fetching purchase undo logs:', error);
            setPurchaseLogs([]);
            setFilteredPurchaseLogs([]);
            setError(`Failed to load purchase undo logs. Please try again later.`);
          }
        }
      } catch (err) {
        console.error(`Error fetching ${activeTab} undo logs:`, err);
        setError(`Failed to load ${activeTab} undo logs. Please try again later.`);
        if (activeTab === "sales") {
          setSaleLogs([]);
          setFilteredSaleLogs([]);
        } else {
          setPurchaseLogs([]);
          setFilteredPurchaseLogs([]);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchLogs();
  }, [activeTab, startDate, endDate, pagination.currentPage, pagination.limit]);

  // Filter logs based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredSaleLogs(saleLogs);
      setFilteredPurchaseLogs(purchaseLogs);
      return;
    }

    const query = searchQuery.toLowerCase();

    // Filter sale logs
    const filteredSales = saleLogs.filter(log =>
      log.invoice_no.toString().includes(query) ||
      log.user_name.toLowerCase().includes(query) ||
      log.reason_type.toLowerCase().includes(query) ||
      (log.reason_details && log.reason_details.toLowerCase().includes(query))
    );
    setFilteredSaleLogs(filteredSales);

    // Filter purchase logs
    const filteredPurchases = purchaseLogs.filter(log =>
      (log.purchase_id && log.purchase_id.toString().includes(query)) ||
      (log.product_name && log.product_name.toLowerCase().includes(query)) ||
      (log.supplier_name && log.supplier_name.toLowerCase().includes(query)) ||
      (log.undone_by && log.undone_by.toLowerCase().includes(query)) ||
      (log.reason && log.reason.toLowerCase().includes(query))
    );
    setFilteredPurchaseLogs(filteredPurchases);
  }, [saleLogs, purchaseLogs, searchQuery]);

  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  // Handle date filter clear
  const handleClearDateFilter = () => {
    setStartDate(null);
    setEndDate(null);
    setIsDatePickerOpen(false);
  };

  // Handle date filter toggle
  const handleDateFilterToggle = () => {
    setIsDatePickerOpen(!isDatePickerOpen);
  };

  // Handle view log details
  const handleViewLog = (log) => {
    setSelectedLog(log);
    setIsModalOpen(true);
  };

  // Handle close modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedLog(null);
  };

  // Handle export to CSV
  const handleExportCSV = async () => {
    try {
      // Build query parameters
      const params = new URLSearchParams();
      if (startDate) {
        params.append('startDate', startDate.toISOString());
      }
      if (endDate) {
        params.append('endDate', endDate.toISOString());
      }

      const queryString = params.toString();

      // Export based on active tab
      let url;
      if (activeTab === "sales") {
        url = `undo-logs/export-csv?${queryString}`;
      } else {
        url = `purchases/undo-logs/export-csv?${queryString}`;
        console.log('Export URL for purchase undo logs:', url);
      }

      // Open the URL in a new tab to download the CSV
      window.open(`${API.defaults.baseURL}${url}`, '_blank');
    } catch (err) {
      console.error(`Error exporting ${activeTab} undo logs:`, err);
      toast.error(`Failed to export ${activeTab} undo logs. Please try again later.`);
    }
  };

  // Handle tab change
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    // Remove the setCurrentPage call as it's not defined
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  // Handle pagination
  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > pagination.totalPages) return;
    setPagination(prev => ({ ...prev, currentPage: newPage }));
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-6">Undo Logs</h1>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <ul className="flex flex-wrap -mb-px">
          <li className="mr-2">
            <button
              className={`inline-block py-2 px-4 text-sm font-medium ${
                activeTab === "sales"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
              onClick={() => handleTabChange("sales")}
            >
              Sale Undo Logs
            </button>
          </li>
          <li className="mr-2">
            <button
              className={`inline-block py-2 px-4 text-sm font-medium ${
                activeTab === "purchases"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
              onClick={() => handleTabChange("purchases")}
            >
              Purchase Undo Logs
            </button>
          </li>
        </ul>
      </div>

      {/* Filters and actions */}
      <div className="flex flex-wrap items-center justify-between mb-6 gap-4">
        <div className="flex items-center space-x-4">
          <SearchInput
            placeholder={
              activeTab === "sales"
                ? "Search by invoice, user, or reason..."
                : "Search by product, supplier, or user..."
            }
            value={searchQuery}
            onChange={handleSearchChange}
            className="w-64"
          />

          <div className="relative">
            <button
              onClick={handleDateFilterToggle}
              className="flex items-center px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-700 hover:bg-gray-50"
            >
              <FaCalendarAlt className="mr-2" />
              {startDate && endDate
                ? `${format(startDate, "MMM d, yyyy")} - ${format(endDate, "MMM d, yyyy")}`
                : "Filter by Date"}
            </button>

            {isDatePickerOpen && (
              <div className="absolute z-10 mt-1 bg-white border border-gray-300 rounded-md shadow-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium">Select Date Range</h3>
                  <button
                    onClick={handleClearDateFilter}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <FaTimes />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Start Date
                    </label>
                    <DatePicker
                      selected={startDate}
                      onChange={date => setStartDate(date)}
                      selectsStart
                      startDate={startDate}
                      endDate={endDate}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      End Date
                    </label>
                    <DatePicker
                      selected={endDate}
                      onChange={date => setEndDate(date)}
                      selectsEnd
                      startDate={startDate}
                      endDate={endDate}
                      minDate={startDate}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <Button
          variant="secondary"
          onClick={handleExportCSV}
          className="bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 transition-colors flex items-center"
        >
          <FaDownload className="mr-2" />
          Export to CSV
        </Button>
      </div>

      {/* Loading state */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
        </div>
      ) : error ? (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      ) : (
        <>
          {/* Sale Logs table */}
          {activeTab === "sales" && (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Invoice #
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Undo Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Reason
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredSaleLogs.length > 0 ? (
                      filteredSaleLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {log.invoice_no}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {log.user_name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {format(new Date(log.undo_date), "yyyy-MM-dd HH:mm:ss")}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {log.reason_type}
                            {log.reason_details && (
                              <span className="text-xs text-gray-400 block">
                                {log.reason_details.length > 30
                                  ? `${log.reason_details.substring(0, 30)}...`
                                  : log.reason_details}
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <button
                              onClick={() => handleViewLog(log)}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              <FaEye className="inline mr-1" /> View Details
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                          No sale undo logs found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Purchase Logs table */}
          {activeTab === "purchases" && (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Purchase ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Product
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Supplier
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Quantity
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Buying Price
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date Purchased
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date Undone
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Undone By
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Reason
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredPurchaseLogs.length > 0 ? (
                      filteredPurchaseLogs.map((log) => (
                        <tr key={log.log_id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {log.purchase_id}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {log.product_name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {log.supplier_name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {log.quantity}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            Rs. {parseFloat(log.buying_price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {format(new Date(log.date_purchased), "yyyy-MM-dd HH:mm:ss")}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {format(new Date(log.date_undone), "yyyy-MM-dd HH:mm:ss")}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {log.undone_by}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {log.reason || "-"}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="9" className="px-6 py-4 text-center text-gray-500">
                          No purchase undo logs found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex justify-center mt-6">
              <nav className="flex items-center">
                <button
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                  disabled={pagination.currentPage === 1}
                  className={`px-3 py-1 rounded-l-md border ${
                    pagination.currentPage === 1
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-white text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  Previous
                </button>
                <div className="px-4 py-1 border-t border-b bg-white text-gray-700">
                  Page {pagination.currentPage} of {pagination.totalPages}
                </div>
                <button
                  onClick={() => handlePageChange(pagination.currentPage + 1)}
                  disabled={pagination.currentPage === pagination.totalPages}
                  className={`px-3 py-1 rounded-r-md border ${
                    pagination.currentPage === pagination.totalPages
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-white text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  Next
                </button>
              </nav>
            </div>
          )}
        </>
      )}

      {/* Log details modal */}
      {isModalOpen && selectedLog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Undo Log Details</h2>
                <button
                  onClick={handleCloseModal}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <FaTimes />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <h3 className="font-medium text-gray-700 mb-2">Undo Information</h3>
                  <div className="bg-gray-50 p-4 rounded-md">
                    <p><span className="font-medium">Invoice #:</span> {selectedLog.invoice_no}</p>
                    <p><span className="font-medium">Undone by:</span> {selectedLog.user_name}</p>
                    <p><span className="font-medium">Date/Time:</span> {format(new Date(selectedLog.undo_date), "yyyy-MM-dd HH:mm:ss")}</p>
                    <p><span className="font-medium">Reason:</span> {selectedLog.reason_type}</p>
                    {selectedLog.reason_details && (
                      <p><span className="font-medium">Details:</span> {selectedLog.reason_details}</p>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="font-medium text-gray-700 mb-2">Sale Information</h3>
                  <div className="bg-gray-50 p-4 rounded-md">
                    <p><span className="font-medium">Sale Date:</span> {selectedLog.sale_data.date ? format(new Date(selectedLog.sale_data.date), "yyyy-MM-dd HH:mm:ss") : "N/A"}</p>
                    <p><span className="font-medium">Customer:</span> {selectedLog.sale_data.customer_name || "Walk-in Customer"}</p>
                    <p><span className="font-medium">Total Amount:</span> Rs. {parseFloat(selectedLog.sale_data.total || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                    <p><span className="font-medium">Items Count:</span> {selectedLog.sale_data.items?.length || 0}</p>
                  </div>
                </div>
              </div>

              <h3 className="font-medium text-gray-700 mb-2">Sale Items</h3>
              <div className="bg-gray-50 p-4 rounded-md overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Price</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {selectedLog.sale_data.items?.length > 0 ? (
                      selectedLog.sale_data.items.map((item, index) => (
                        <tr key={index}>
                          <td className="px-4 py-2 text-sm text-gray-900">{item.product_name}</td>
                          <td className="px-4 py-2 text-sm text-gray-500">{item.quantity}</td>
                          <td className="px-4 py-2 text-sm text-gray-500">Rs. {parseFloat(item.unit_price || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                          <td className="px-4 py-2 text-sm text-gray-500">Rs. {parseFloat(item.total_price || item.quantity * item.unit_price || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4" className="px-4 py-2 text-sm text-center text-gray-500">No items found for this sale</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UndoLogs;
