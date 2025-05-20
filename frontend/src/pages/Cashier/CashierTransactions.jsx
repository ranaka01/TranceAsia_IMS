import React, { useState, useEffect, useRef } from "react";
import { format, startOfDay, endOfDay } from "date-fns";
import Button from "../../components/UI/Button";
import SearchInput from "../../components/UI/SearchInput";
import AddSaleModal from "../Admin/AddSaleModal";
import API from "../../utils/api";
import { FaCalendarAlt, FaTimes } from "react-icons/fa";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const CashierTransactions = () => {

  const [sales, setSales] = useState([]);
  const [filteredSales, setFilteredSales] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAddSaleModalOpen, setIsAddSaleModalOpen] = useState(false);
  const [currentSale, setCurrentSale] = useState(null);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const datePickerRef = useRef(null);

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
  }, []);

  // The fetchSales functionality has been moved to the useEffect hook

  // Load sales when component mounts or date range changes
  useEffect(() => {
    const getSales = async () => {
      setIsLoading(true);
      setError(null);
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
        const url = queryString ? `sales/?${queryString}` : "sales/";

        const response = await API.get(url);
        const data = response.data?.data?.sales || [];
        setSales(data);
        setFilteredSales(data);
      } catch (err) {
        console.error("Error fetching sales:", err);
        setError("Failed to load sales. Please try again later.");
        setSales([]);
        setFilteredSales([]);
      } finally {
        setIsLoading(false);
      }
    };

    getSales();
  }, [startDate, endDate]);

  // Filter sales based on search query
  const performSearch = (query) => {
    if (!Array.isArray(sales)) {
      setFilteredSales([]);
      return;
    }

    if (!query || query.trim() === "") {
      setFilteredSales([...sales]);
    } else {
      const filtered = sales.filter(
        (sale) =>
          (sale.bill_no && sale.bill_no.toString().includes(query)) ||
          (sale.customer_name && sale.customer_name.toLowerCase().includes(query.toLowerCase())) ||
          (sale.items && sale.items.toLowerCase().includes(query.toLowerCase()))
      );
      setFilteredSales(filtered);
    }
  };

  // Update filtered sales when sales list or search query changes
  useEffect(() => {
    performSearch(searchQuery);
  }, [sales, searchQuery]);

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleSearch = () => {
    performSearch(searchQuery);
  };

  const handleAddSale = () => {
    setCurrentSale(null);
    setIsAddSaleModalOpen(true);
  };

  const handleViewSale = async (sale) => {
    setIsLoading(true);
    try {
      // Fetch the complete sale data with items array
      const response = await API.get(`/sales/${sale.bill_no}`);
      const fullSaleData = response.data?.data?.sale;

      if (fullSaleData) {
        setCurrentSale(fullSaleData);
        setIsAddSaleModalOpen(true);
      } else {
        console.error("Failed to fetch complete sale data");
        // Still show the modal with the basic data we have
        setCurrentSale(sale);
        setIsAddSaleModalOpen(true);
      }
    } catch (error) {
      console.error("Error fetching sale details:", error);
      // Fall back to using the row data
      setCurrentSale(sale);
      setIsAddSaleModalOpen(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseModal = () => {
    setIsAddSaleModalOpen(false);
    setCurrentSale(null);
  };

  const handleSaleSaved = () => {
    // Trigger a refetch of sales data
    setStartDate(prev => {
      // This forces the useEffect to run again
      return prev;
    });
    setIsAddSaleModalOpen(false);
  };

  // Toggle date picker visibility
  const toggleDatePicker = () => {
    setIsDatePickerOpen(prev => !prev);
  };

  // Handle date changes
  const handleDateChange = (dates) => {
    const [start, end] = dates;
    setStartDate(start);
    setEndDate(end);

    if (start && end) {
      // Close the date picker when a complete range is selected
      setIsDatePickerOpen(false);
      // The useEffect hook will trigger fetchSales when startDate or endDate changes
    }
  };

  // Clear date filter
  const clearDateFilter = () => {
    setStartDate(null);
    setEndDate(null);
    // The useEffect hook will trigger the API call when state changes
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
      minimumFractionDigits: 2
    }).format(amount).replace('LKR', '').trim();
  };


  return (
      <div className="p-6 h-full flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-xl font-semibold">Sales</h1>
          <div className="flex items-center relative" ref={datePickerRef}>
            {/* Date filter indicator */}
            {(startDate || endDate) && (
              <div className="flex items-center mr-3 bg-blue-50 px-3 py-1 rounded-md">
                <span className="text-sm text-blue-700">
                  {startDate && endDate
                    ? `${format(startDate, 'MMM dd, yyyy')} - ${format(endDate, 'MMM dd, yyyy')}`
                    : startDate
                    ? `From ${format(startDate, 'MMM dd, yyyy')}`
                    : `Until ${format(endDate, 'MMM dd, yyyy')}`}
                </span>
                <button
                  onClick={clearDateFilter}
                  className="ml-2 text-blue-500 hover:text-blue-700"
                  title="Clear date filter"
                >
                  <FaTimes size={14} />
                </button>
              </div>
            )}
  
            {/* Calendar icon button */}
            <button
              onClick={toggleDatePicker}
              className="flex items-center justify-center p-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              title="Filter by date"
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
  
        <div className="mb-4 flex">
          <div className="flex-grow">
            <SearchInput
              placeholder="Search by bill no, customer, products..."
              value={searchQuery}
              onChange={handleSearchChange}
              onSearch={handleSearch}
            />
          </div>
        </div>
  
        {/* Error message */}
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
            {error}
            <button
              className="ml-2 underline"
              onClick={() => {
                // Force a refetch by triggering the useEffect
                setStartDate(prev => prev);
              }}
            >
              Try Again
            </button>
          </div>
        )}
  
        {/* Loading state */}
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          /* Sales table */
          <div className="flex-1 overflow-auto mb-16">
            <table className="w-full border-collapse">
              <thead className="sticky top-0 bg-white">
                <tr className="border-b border-gray-200">
                  <th className="py-3 px-4 text-left">Bill No</th>
                  <th className="py-3 px-4 text-left">Date</th>
                  <th className="py-3 px-4 text-left">Items</th>
                  <th className="py-3 px-4 text-left">Customer</th>
                  <th className="py-3 px-4 text-left">User</th>
                  <th className="py-3 px-4 text-right">Total, LKR</th>
                </tr>
              </thead>
              <tbody>
                {filteredSales.length > 0 ? (
                  filteredSales.map((sale, index) => (
                    <tr
                      key={`${sale.bill_no || index}-${index}`}
                      className="border-b border-gray-200 hover:bg-gray-50 cursor-pointer"
                      onClick={() => handleViewSale(sale)}
                    >
                      <td className="py-3 px-4">{sale.bill_no}</td>
                      <td className="py-3 px-4">{sale.date ? format(new Date(sale.date), 'MM/dd HH:mm') : ''}</td>
                      <td className="py-3 px-4">{sale.items}</td>
                      <td className="py-3 px-4">{sale.customer_name}</td>
                      <td className="py-3 px-4">{sale.user_name}</td>
                      <td className="py-3 px-4 text-right">{formatCurrency(sale.total)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="py-4 px-4 text-center text-gray-500">
                      No sales found matching your search criteria
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
  
        {/* Add Sale button (positioned at bottom right) */}
        <div className="fixed bottom-6 right-6">
          <Button
            variant="primary"
            onClick={handleAddSale}
            className="bg-blue-600 text-white py-2 px-6 rounded hover:bg-blue-700 transition-colors"
          >
            Add Sale
          </Button>
        </div>
  
        {/* Add Sale Modal */}
        {isAddSaleModalOpen && (
          <AddSaleModal
            isOpen={isAddSaleModalOpen}
            onClose={handleCloseModal}
            onSave={handleSaleSaved}
            currentSale={currentSale}
          />
        )}
      </div>
    );
}

export default CashierTransactions;


