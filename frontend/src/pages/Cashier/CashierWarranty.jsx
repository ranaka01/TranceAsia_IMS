import React, { useState, useRef, useEffect } from 'react';
import { FaSearch, FaCheckCircle, FaTimesCircle, FaCalendarAlt, FaClock, FaTimes } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { checkWarrantyBySerialNumber, searchSerialNumbers } from '../../services/repairService';

const CashierWarranty = () => {
  // State management
  const [serialNumber, setSerialNumber] = useState('');
  const [warrantyInfo, setWarrantyInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Serial number search state
  const [serialNumberResults, setSerialNumberResults] = useState([]);
  const [isSearchingSerialNumbers, setIsSearchingSerialNumbers] = useState(false);
  const [showSerialNumberDropdown, setShowSerialNumberDropdown] = useState(false);
  const serialNumberInputRef = useRef(null);
  const serialNumberDropdownRef = useRef(null);

  // Handle clicks outside the dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Handle serial number dropdown
      if (
        serialNumberDropdownRef.current &&
        !serialNumberDropdownRef.current.contains(event.target) &&
        serialNumberInputRef.current &&
        !serialNumberInputRef.current.contains(event.target)
      ) {
        setShowSerialNumberDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle serial number input change and search
  const handleSerialNumberChange = async (value) => {
    // Make sure value is a string
    const searchValue = String(value || '');
    setSerialNumber(searchValue);

    // Clear previous results when input changes
    if (warrantyInfo) setWarrantyInfo(null);
    if (error) setError(null);

    // Don't search if less than 2 characters
    if (searchValue.trim().length < 2) {
      setSerialNumberResults([]);
      setShowSerialNumberDropdown(false);
      return;
    }

    setIsSearchingSerialNumbers(true);

    try {
      const results = await searchSerialNumbers(searchValue);
      setSerialNumberResults(results || []);
      setShowSerialNumberDropdown((results || []).length > 0);
    } catch (error) {
      console.error('Error searching serial numbers:', error);
      toast.error('Failed to search serial numbers');
      setSerialNumberResults([]);
      setShowSerialNumberDropdown(false);
    } finally {
      setIsSearchingSerialNumbers(false);
    }
  };

  // Handle serial number selection from dropdown
  const handleSerialNumberSelect = async (serialNumber) => {
    // Make sure serialNumber is a string
    const serialNumberStr = String(serialNumber);
    setSerialNumber(serialNumberStr);
    setShowSerialNumberDropdown(false);

    // Automatically check warranty when a serial number is selected
    await checkWarranty(serialNumberStr);
  };

  // Clear serial number input
  const handleClearSerialNumber = () => {
    setSerialNumber('');
    setWarrantyInfo(null);
    setError(null);
    setSerialNumberResults([]);
    setShowSerialNumberDropdown(false);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate input
    if (!serialNumber.trim()) {
      setError('Please enter a serial number');
      return;
    }

    await checkWarranty(serialNumber);
  };

  // Check warranty by serial number
  const checkWarranty = async (serialNumberToCheck) => {
    // Reset states
    setWarrantyInfo(null);
    setError(null);
    setIsLoading(true);

    try {
      // Call API to check warranty
      const result = await checkWarrantyBySerialNumber(serialNumberToCheck);
      setWarrantyInfo(result);
    } catch (err) {
      console.error('Error checking warranty:', err);
      if (err.response && err.response.status === 404) {
        setError('No product found with this serial number');
      } else {
        setError(err.response?.data?.message || 'Failed to check warranty. Please try again.');
        toast.error('Error checking warranty status');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-6">Warranty Checker</h1>

      {/* Search Form */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-4">
          <div className="flex-grow relative">
            <label htmlFor="serialNumber" className="block text-sm font-medium text-gray-700 mb-1">
              Product Serial Number
            </label>
            <div className="relative">
              <input
                type="text"
                id="serialNumber"
                value={serialNumber}
                onChange={(e) => handleSerialNumberChange(e.target.value)}
                placeholder="Enter or search for serial number"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isLoading}
                ref={serialNumberInputRef}
              />

              {/* Clear button */}
              {serialNumber && (
                <button
                  type="button"
                  onClick={handleClearSerialNumber}
                  className="absolute right-10 top-2.5 text-gray-400 hover:text-gray-600"
                  title="Clear serial number"
                >
                  <FaTimes size={16} />
                </button>
              )}

              {/* Loading spinner for search */}
              {isSearchingSerialNumbers && (
                <div className="absolute right-3 top-2.5">
                  <div className="animate-spin h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                </div>
              )}

              {/* Serial Number Dropdown */}
              {showSerialNumberDropdown && serialNumberResults.length > 0 && (
                <div
                  className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base overflow-auto focus:outline-none sm:text-sm"
                  ref={serialNumberDropdownRef}
                >
                  {serialNumberResults.map((result, index) => (
                    <div
                      key={index}
                      className="cursor-pointer hover:bg-gray-100 px-4 py-2"
                      onClick={() => handleSerialNumberSelect(result.serial_number)}
                    >
                      <div className="flex justify-between">
                        <span className="font-medium">{result.serial_number}</span>
                        <span className={result.is_under_warranty ? "text-green-600" : "text-red-500"}>
                          {result.is_under_warranty
                            ? `${result.warranty_remaining_days} days left`
                            : "Expired"}
                        </span>
                      </div>
                      <div className="text-sm text-gray-500">{result.product_name}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="self-end">
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center gap-2 disabled:bg-blue-400"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                  <span>Checking...</span>
                </>
              ) : (
                <>
                  <FaSearch />
                  <span>Check Warranty</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-md">
          <div className="flex items-center">
            <FaTimesCircle className="text-red-500 mr-3" />
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Warranty Information */}
      {warrantyInfo && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold mb-2">Product Warranty Information</h2>
            <p className="text-gray-600">Details for serial number: <span className="font-medium">{serialNumber}</span></p>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Product Information */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Product Name</h3>
                  <p className="mt-1 text-lg font-semibold">{warrantyInfo.product_name}</p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500">Category</h3>
                  <p className="mt-1">{warrantyInfo.category || 'N/A'}</p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500">Customer</h3>
                  <p className="mt-1">{warrantyInfo.customer_name || 'N/A'}</p>
                </div>
              </div>

              {/* Warranty Information */}
              <div className="space-y-4">
                <div className="flex items-center">
                  <FaCalendarAlt className="text-gray-500 mr-2" />
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Purchase Date</h3>
                    <p className="mt-1">{formatDate(warrantyInfo.purchase_date)}</p>
                  </div>
                </div>

                <div className="flex items-center">
                  <FaClock className="text-gray-500 mr-2" />
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Warranty Period</h3>
                    <p className="mt-1">{warrantyInfo.warranty} {parseInt(warrantyInfo.warranty) === 1 ? 'Month' : 'Months'}</p>
                  </div>
                </div>

                <div className="flex items-center">
                  <div className={`mr-2 ${warrantyInfo.is_under_warranty ? 'text-green-500' : 'text-red-500'}`}>
                    {warrantyInfo.is_under_warranty ? <FaCheckCircle /> : <FaTimesCircle />}
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Warranty Status</h3>
                    <p className={`mt-1 font-medium ${warrantyInfo.is_under_warranty ? 'text-green-600' : 'text-red-600'}`}>
                      {warrantyInfo.is_under_warranty ? 'Valid' : 'Expired'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Warranty Timeline */}
            <div className="mt-8 border-t border-gray-200 pt-6">
              <h3 className="text-lg font-medium mb-4">Warranty Timeline</h3>

              <div className="relative">
                {/* Timeline Bar */}
                <div className="absolute left-0 top-0 h-full w-1 bg-gray-200"></div>

                {/* Purchase Date */}
                <div className="relative pl-8 pb-8">
                  <div className="absolute left-0 top-0 w-5 h-5 rounded-full bg-blue-500 border-4 border-white"></div>
                  <div>
                    <h4 className="text-sm font-medium">Purchase Date</h4>
                    <p className="text-gray-600">{formatDate(warrantyInfo.purchase_date)}</p>
                  </div>
                </div>

                {/* Warranty End Date */}
                <div className="relative pl-8">
                  <div className={`absolute left-0 top-0 w-5 h-5 rounded-full ${warrantyInfo.is_under_warranty ? 'bg-green-500' : 'bg-red-500'} border-4 border-white`}></div>
                  <div>
                    <h4 className="text-sm font-medium">Warranty End Date</h4>
                    <p className="text-gray-600">{formatDate(warrantyInfo.warranty_end_date)}</p>

                    {warrantyInfo.is_under_warranty ? (
                      <p className="mt-2 text-sm text-green-600">
                        {warrantyInfo.warranty_remaining_days} days remaining
                      </p>
                    ) : (
                      <p className="mt-2 text-sm text-red-600">
                        Warranty has expired
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CashierWarranty;