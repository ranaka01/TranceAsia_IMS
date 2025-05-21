import React, { useState, useEffect, useRef, useCallback } from "react";
import { format, startOfDay, endOfDay } from "date-fns";
import Button from "../../components/UI/Button";
import SearchInput from "../../components/UI/SearchInput";
import AddSaleModal from "../Admin/AddSaleModal";
import UndoSaleModal from "../../components/Cashier/UndoSaleModal";
import API from "../../utils/api";
import { FaCalendarAlt, FaTimes, FaUndo, FaInfoCircle } from "react-icons/fa";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { toast } from "react-toastify";

const CashierShop = () => {
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
  const [lastSale, setLastSale] = useState(null);
  const [canUndoLastSale, setCanUndoLastSale] = useState(false);
  const [isUndoLoading, setIsUndoLoading] = useState(false);
  const [isUndoModalOpen, setIsUndoModalOpen] = useState(false);
  const [remainingTime, setRemainingTime] = useState(0);
  const [timeLimit, setTimeLimit] = useState(10); // Default 10 minutes
  const datePickerRef = useRef(null);
  const timerRef = useRef(null);

  // Open AddSaleModal automatically when component mounts
  useEffect(() => {
    setIsAddSaleModalOpen(true);
  }, []);

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

  // Format remaining time as MM:SS
  const formatRemainingTime = useCallback(() => {
    const minutes = Math.floor(remainingTime / 60);
    const seconds = remainingTime % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }, [remainingTime]);

  // Fetch the last sale for the current user
  const fetchLastSale = async () => {
    try {
      const response = await API.get('sales/last');
      if (response.data?.status === 'success') {
        setLastSale(response.data.data.sale);
        setCanUndoLastSale(response.data.data.canUndo);

        // Set time limit and remaining time for countdown
        if (response.data.data.timeLimit) {
          setTimeLimit(response.data.data.timeLimit);
        }

        if (response.data.data.remainingMinutes) {
          // Convert minutes to seconds for the countdown
          const remainingSecs = Math.floor(response.data.data.remainingMinutes * 60);
          setRemainingTime(remainingSecs);

          // Clear any existing timer
          if (timerRef.current) {
            clearInterval(timerRef.current);
          }

          // Start countdown timer if there's time remaining
          if (remainingSecs > 0 && response.data.data.canUndo) {
            timerRef.current = setInterval(() => {
              setRemainingTime(prev => {
                if (prev <= 1) {
                  // Time's up, clear the timer and disable undo
                  clearInterval(timerRef.current);
                  setCanUndoLastSale(false);
                  return 0;
                }
                return prev - 1;
              });
            }, 1000);
          }
        }
      } else {
        setLastSale(null);
        setCanUndoLastSale(false);
        setRemainingTime(0);
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
      }
    } catch (error) {
      console.error("Error fetching last sale:", error);
      setLastSale(null);
      setCanUndoLastSale(false);
      setRemainingTime(0);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  };

  // Check if we can open the undo modal
  const canOpenUndoModal = () => {
    if (!lastSale) {
      toast.error("No recent sale found to undo");
      return false;
    }
    return true;
  };

  // Handle undoing the last sale
  const handleUndoLastSale = async (reasonType, reasonDetails) => {
    if (!lastSale) {
      toast.error("No recent sale found to undo");
      return;
    }

    setIsUndoLoading(true);
    try {
      await API.delete(`sales/${lastSale.invoice_no || lastSale.bill_no}`, {
        data: { reasonType, reasonDetails }
      });
      toast.success("Last sale has been successfully undone");

      // Refresh the sales list
      setStartDate(prev => prev); // This will trigger a refetch

      // Reset the last sale
      setLastSale(null);
      setCanUndoLastSale(false);

      // Clear the timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    } catch (error) {
      console.error("Error undoing last sale:", error);
      toast.error(error.response?.data?.message || "Failed to undo last sale");
      throw error; // Re-throw to let the modal handle the error state
    } finally {
      setIsUndoLoading(false);
    }
  };

  // Cleanup timer when component unmounts
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

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

        // Fetch the last sale after loading the sales list
        fetchLastSale();
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

      {/* Add Sale and Undo Last Sale buttons (positioned at bottom right) */}
      <div className="fixed bottom-6 right-6 flex space-x-3">
        {canUndoLastSale && (
          <div className="relative group">
            <Button
              variant="secondary"
              onClick={() => canOpenUndoModal() && setIsUndoModalOpen(true)}
              className="bg-yellow-500 text-white py-2 px-6 rounded hover:bg-yellow-600 transition-colors flex items-center"
              disabled={isUndoLoading || remainingTime <= 0}
            >
              {isUndoLoading ? (
                <div className="animate-spin h-4 w-4 border-2 border-white rounded-full border-t-transparent mr-2"></div>
              ) : (
                <FaUndo className="mr-2" />
              )}
              Undo Last Sale {remainingTime > 0 && `(${formatRemainingTime()})`}
            </Button>

            {/* Tooltip for time limit */}
            <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 hidden group-hover:block bg-gray-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap">
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 rotate-45 w-2 h-2 bg-gray-800"></div>
              {remainingTime > 0
                ? `You have ${formatRemainingTime()} to undo this sale`
                : `Time limit (${timeLimit} minutes) has expired`}
            </div>
          </div>
        )}
        <Button
          variant="primary"
          onClick={handleAddSale}
          className="bg-blue-600 text-white py-2 px-6 rounded hover:bg-blue-700 transition-colors"
        >
          Add Sale
        </Button>
      </div>

      {/* Undo Sale Modal */}
      {isUndoModalOpen && (
        <UndoSaleModal
          isOpen={isUndoModalOpen}
          onClose={() => setIsUndoModalOpen(false)}
          onConfirm={handleUndoLastSale}
          sale={lastSale}
        />
      )}

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
};

export default CashierShop;