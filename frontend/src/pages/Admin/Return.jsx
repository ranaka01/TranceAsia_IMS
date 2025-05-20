import React, { useState, useEffect, useRef } from "react";
import { FaTimes, FaEye, FaPrint } from "react-icons/fa";
import Select from "react-select";
import Button from "../../components/UI/Button";
import SearchInput from "../../components/UI/SearchInput";
import { toast } from "react-toastify";

const Return = () => {
  // State for return form
  const [formData, setFormData] = useState({
    serialNumber: "",
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    productName: "",
    productId: "",
    purchaseDate: "",
    returnReason: "",
    returnCondition: "",
    refundAmount: "",
    notes: ""
  });

  // State for validation errors
  const [errors, setErrors] = useState({});

  // State for serial number search
  const [serialNumberResults, setSerialNumberResults] = useState([]);
  const [showSerialNumberDropdown, setShowSerialNumberDropdown] = useState(false);
  const serialNumberInputRef = useRef(null);
  const serialNumberDropdownRef = useRef(null);

  // State for customer fields
  const [areCustomerFieldsReadOnly, setAreCustomerFieldsReadOnly] = useState(false);

  // State for returns table
  const [returns, setReturns] = useState([]);
  const [filteredReturns, setFilteredReturns] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Return reason options
  const returnReasonOptions = [
    { value: "defective", label: "Defective Product" },
    { value: "damaged", label: "Damaged on Arrival" },
    { value: "wrong_item", label: "Wrong Item Received" },
    { value: "not_as_described", label: "Not as Described" },
    { value: "customer_dissatisfaction", label: "Customer Dissatisfaction" },
    { value: "other", label: "Other" }
  ];

  // Return condition options
  const returnConditionOptions = [
    { value: "unopened", label: "Unopened/New" },
    { value: "like_new", label: "Like New" },
    { value: "used", label: "Used" },
    { value: "damaged", label: "Damaged" },
    { value: "non_functional", label: "Non-functional" }
  ];

  // Mock data for returns table (would be fetched from API in real implementation)
  useEffect(() => {
    // Simulating API call to fetch returns
    setIsLoading(true);
    setTimeout(() => {
      const mockReturns = [
        {
          id: "RET001",
          date: "2023-05-15",
          customerName: "John Doe",
          productName: "Samsung Galaxy S21",
          serialNumber: "SN12345678",
          returnReason: "Defective Product",
          refundAmount: "85000.00",
          status: "Processed"
        },
        {
          id: "RET002",
          date: "2023-05-18",
          customerName: "Jane Smith",
          productName: "Apple iPhone 13",
          serialNumber: "AP98765432",
          returnReason: "Wrong Item Received",
          refundAmount: "120000.00",
          status: "Pending"
        },
        {
          id: "RET003",
          date: "2023-05-20",
          customerName: "Robert Johnson",
          productName: "Dell XPS 15",
          serialNumber: "DL45678901",
          returnReason: "Customer Dissatisfaction",
          refundAmount: "175000.00",
          status: "Processed"
        }
      ];

      setReturns(mockReturns);
      setFilteredReturns(mockReturns);
      setIsLoading(false);
    }, 1000);
  }, []);

  // Handle serial number search
  const handleSerialNumberSearch = async (value) => {
    // Make sure value is a string
    const searchValue = String(value || '');

    setFormData({
      ...formData,
      serialNumber: searchValue
    });

    if (searchValue.trim().length < 2) {
      setSerialNumberResults([]);
      setShowSerialNumberDropdown(false);
      return;
    }

    try {
      // Simulating API call to search serial numbers
      // In a real implementation, this would call an API endpoint
      setTimeout(() => {
        const mockResults = [
          {
            serial_number: "SN12345678",
            product_name: "Samsung Galaxy S21",
            product_id: "P001",
            purchase_date: "2023-01-15",
            customer_name: "John Doe",
            customer_phone: "0771234567",
            customer_email: "john.doe@example.com",
            price: "85000.00"
          },
          {
            serial_number: "SN12345679",
            product_name: "Samsung Galaxy S22",
            product_id: "P002",
            purchase_date: "2023-02-20",
            customer_name: "Jane Smith",
            customer_phone: "0779876543",
            customer_email: "jane.smith@example.com",
            price: "95000.00"
          }
        ].filter(item =>
          item.serial_number.toLowerCase().includes(searchValue.toLowerCase())
        );

        setSerialNumberResults(mockResults);
        setShowSerialNumberDropdown(mockResults.length > 0);
      }, 500);
    } catch (error) {
      console.error('Error searching serial numbers:', error);
      toast.error('Failed to search serial numbers');
      setSerialNumberResults([]);
      setShowSerialNumberDropdown(false);
    }
  };

  // Handle serial number selection
  const handleSerialNumberSelect = (serialNumber) => {
    // Find the selected result
    const selectedResult = serialNumberResults.find(
      result => result.serial_number === serialNumber
    );

    if (selectedResult) {
      // Populate form with selected result data
      setFormData({
        ...formData,
        serialNumber: selectedResult.serial_number,
        customerName: selectedResult.customer_name,
        customerPhone: selectedResult.customer_phone,
        customerEmail: selectedResult.customer_email || "Not Available",
        productName: selectedResult.product_name,
        productId: selectedResult.product_id,
        purchaseDate: selectedResult.purchase_date,
        refundAmount: selectedResult.price // Default to full refund
      });

      // Make customer fields read-only
      setAreCustomerFieldsReadOnly(true);
    }

    // Close dropdown
    setShowSerialNumberDropdown(false);
  };

  // Handle clear serial number
  const handleClearSerialNumber = () => {
    // Reset form data
    setFormData({
      ...formData,
      serialNumber: "",
      customerName: "",
      customerPhone: "",
      customerEmail: "",
      productName: "",
      productId: "",
      purchaseDate: "",
      refundAmount: ""
    });

    // Make customer fields editable
    setAreCustomerFieldsReadOnly(false);
  };

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // Handle select input changes
  const handleSelectChange = (selectedOption, { name }) => {
    setFormData({
      ...formData,
      [name]: selectedOption ? selectedOption.value : ""
    });
  };

  // Handle search query change
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  // Handle search
  const handleSearch = () => {
    if (!searchQuery.trim()) {
      setFilteredReturns(returns);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = returns.filter(
      item =>
        item.id.toLowerCase().includes(query) ||
        item.customerName.toLowerCase().includes(query) ||
        item.productName.toLowerCase().includes(query) ||
        item.serialNumber.toLowerCase().includes(query) ||
        item.returnReason.toLowerCase().includes(query) ||
        item.status.toLowerCase().includes(query)
    );

    setFilteredReturns(filtered);
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    if (!formData.serialNumber) {
      newErrors.serialNumber = "Serial number is required";
    }

    if (!formData.customerName) {
      newErrors.customerName = "Customer name is required";
    }

    if (!formData.customerPhone) {
      newErrors.customerPhone = "Customer phone is required";
    } else {
      // Clean up phone number and validate
      const cleanPhone = formData.customerPhone.replace(/\s+/g, '');
      const localPattern = /^07[0-9]{8}$/;
      const intlPattern = /^\+947[0-9]{8}$/;
      if (!(localPattern.test(cleanPhone) || intlPattern.test(cleanPhone))) {
        newErrors.customerPhone = "Please enter a valid Sri Lankan mobile number";
      }
    }

    if (formData.customerEmail && formData.customerEmail !== "Not Available") {
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(formData.customerEmail)) {
        newErrors.customerEmail = "Please enter a valid email address";
      }
    }

    if (!formData.productName) {
      newErrors.productName = "Product name is required";
    }

    if (!formData.returnReason) {
      newErrors.returnReason = "Return reason is required";
    }

    if (!formData.returnCondition) {
      newErrors.returnCondition = "Return condition is required";
    }

    if (!formData.refundAmount) {
      newErrors.refundAmount = "Refund amount is required";
    } else if (isNaN(parseFloat(formData.refundAmount)) || parseFloat(formData.refundAmount) < 0) {
      newErrors.refundAmount = "Please enter a valid refund amount";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fix the errors in the form");
      return;
    }

    // In a real implementation, this would call an API endpoint to process the return
    toast.success("Return processed successfully");

    // Reset form
    setFormData({
      serialNumber: "",
      customerName: "",
      customerPhone: "",
      customerEmail: "",
      productName: "",
      productId: "",
      purchaseDate: "",
      returnReason: "",
      returnCondition: "",
      refundAmount: "",
      notes: ""
    });

    setAreCustomerFieldsReadOnly(false);
  };

  // Handle view return details
  const handleViewReturn = (returnItem) => {
    // In a real implementation, this would open a modal with return details
    toast.info(`Viewing details for return ${returnItem.id}`);
  };

  // Handle print return receipt
  const handlePrintReturn = (returnItem) => {
    // In a real implementation, this would generate and print a return receipt
    toast.info(`Printing receipt for return ${returnItem.id}`);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-6">Return Management</h1>

      {/* Return Form Section */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-medium mb-4">Process New Return</h2>

        <form onSubmit={handleSubmit}>
          {/* Form Grid - 3 columns for desktop, 1 for mobile */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {/* Serial Number Search */}
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-1">
                Serial Number <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="serialNumber"
                  value={formData.serialNumber}
                  onChange={(e) => handleSerialNumberSearch(e.target.value)}
                  placeholder="Enter or search serial number"
                  className={`w-full px-3 py-2 border ${errors.serialNumber ? 'border-red-500' : 'border-gray-300'} rounded-md`}
                  ref={serialNumberInputRef}
                />
                {formData.serialNumber && (
                  <button
                    type="button"
                    onClick={handleClearSerialNumber}
                    className="absolute right-2 top-2.5 text-gray-400 hover:text-gray-600"
                    title="Clear serial number and related information"
                  >
                    <FaTimes size={16} />
                  </button>
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
                        </div>
                        <div className="text-sm text-gray-500">{result.product_name}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {errors.serialNumber && (
                <p className="mt-1 text-sm text-red-500">{errors.serialNumber}</p>
              )}
            </div>

            {/* Customer Name */}
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-1">
                Customer Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="customerName"
                value={formData.customerName}
                onChange={handleChange}
                placeholder="Customer name"
                className={`w-full px-3 py-2 border ${errors.customerName ? 'border-red-500' : 'border-gray-300'} ${areCustomerFieldsReadOnly ? 'bg-gray-50' : ''} rounded-md`}
                readOnly={areCustomerFieldsReadOnly}
              />
              {errors.customerName && (
                <p className="mt-1 text-sm text-red-500">{errors.customerName}</p>
              )}
            </div>

            {/* Customer Phone */}
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-1">
                Customer Phone <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="customerPhone"
                value={formData.customerPhone}
                onChange={handleChange}
                placeholder="07X XXXXXXX"
                className={`w-full px-3 py-2 border ${errors.customerPhone ? 'border-red-500' : 'border-gray-300'} ${areCustomerFieldsReadOnly ? 'bg-gray-50' : ''} rounded-md`}
                readOnly={areCustomerFieldsReadOnly}
              />
              {errors.customerPhone && (
                <p className="mt-1 text-sm text-red-500">{errors.customerPhone}</p>
              )}
            </div>

            {/* Customer Email */}
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-1">
                Customer Email
              </label>
              <input
                type="text"
                name="customerEmail"
                value={formData.customerEmail}
                onChange={handleChange}
                placeholder="customer@example.com"
                className={`w-full px-3 py-2 border ${errors.customerEmail ? 'border-red-500' : 'border-gray-300'} ${areCustomerFieldsReadOnly ? 'bg-gray-50' : ''} rounded-md`}
                readOnly={areCustomerFieldsReadOnly}
              />
              {errors.customerEmail && (
                <p className="mt-1 text-sm text-red-500">{errors.customerEmail}</p>
              )}
            </div>

            {/* Product Name */}
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-1">
                Product Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="productName"
                value={formData.productName}
                onChange={handleChange}
                placeholder="Product name"
                className={`w-full px-3 py-2 border ${errors.productName ? 'border-red-500' : 'border-gray-300'} ${areCustomerFieldsReadOnly ? 'bg-gray-50' : ''} rounded-md`}
                readOnly={areCustomerFieldsReadOnly}
              />
              {errors.productName && (
                <p className="mt-1 text-sm text-red-500">{errors.productName}</p>
              )}
            </div>

            {/* Purchase Date */}
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-1">
                Purchase Date
              </label>
              <input
                type="text"
                name="purchaseDate"
                value={formData.purchaseDate}
                onChange={handleChange}
                placeholder="YYYY-MM-DD"
                className={`w-full px-3 py-2 border border-gray-300 ${areCustomerFieldsReadOnly ? 'bg-gray-50' : ''} rounded-md`}
                readOnly={areCustomerFieldsReadOnly}
              />
            </div>

            {/* Return Reason */}
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-1">
                Return Reason <span className="text-red-500">*</span>
              </label>
              <Select
                name="returnReason"
                options={returnReasonOptions}
                value={returnReasonOptions.find(option => option.value === formData.returnReason) || null}
                onChange={(option) => handleSelectChange(option, { name: 'returnReason' })}
                placeholder="Select reason"
                className={errors.returnReason ? 'react-select-error' : ''}
                classNamePrefix="react-select"
              />
              {errors.returnReason && (
                <p className="mt-1 text-sm text-red-500">{errors.returnReason}</p>
              )}
            </div>

            {/* Return Condition */}
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-1">
                Return Condition <span className="text-red-500">*</span>
              </label>
              <Select
                name="returnCondition"
                options={returnConditionOptions}
                value={returnConditionOptions.find(option => option.value === formData.returnCondition) || null}
                onChange={(option) => handleSelectChange(option, { name: 'returnCondition' })}
                placeholder="Select condition"
                className={errors.returnCondition ? 'react-select-error' : ''}
                classNamePrefix="react-select"
              />
              {errors.returnCondition && (
                <p className="mt-1 text-sm text-red-500">{errors.returnCondition}</p>
              )}
            </div>

            {/* Refund Amount */}
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-1">
                Refund Amount <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="refundAmount"
                value={formData.refundAmount}
                onChange={handleChange}
                placeholder="Enter refund amount"
                className={`w-full px-3 py-2 border ${errors.refundAmount ? 'border-red-500' : 'border-gray-300'} rounded-md`}
              />
              {errors.refundAmount && (
                <p className="mt-1 text-sm text-red-500">{errors.refundAmount}</p>
              )}
            </div>
          </div>

          {/* Notes */}
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-medium mb-1">
              Additional Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Enter any additional notes about the return"
              className="w-full px-3 py-2 border border-gray-300 rounded-md h-24 resize-none"
            ></textarea>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <Button
              type="submit"
              variant="primary"
              className="px-6"
            >
              Process Return
            </Button>
          </div>
        </form>
      </div>

      {/* Returns Table Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <h2 className="text-xl font-medium mb-4 md:mb-0">Return History</h2>

          <div className="w-full md:w-auto">
            <SearchInput
              placeholder="Search by ID, customer, product, or status"
              value={searchQuery}
              onChange={handleSearchChange}
              onSearch={handleSearch}
              className="w-full md:w-64"
            />
          </div>
        </div>

        {/* Loading state */}
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          /* Returns table - with scrollable container */
          <div className="flex-1 overflow-auto mb-4">
            <table className="w-full border-collapse">
              <thead className="sticky top-0 bg-white">
                <tr className="border-b border-gray-200">
                  <th className="py-3 px-4 text-left">Return ID</th>
                  <th className="py-3 px-4 text-left">Date</th>
                  <th className="py-3 px-4 text-left">Customer</th>
                  <th className="py-3 px-4 text-left">Product</th>
                  <th className="py-3 px-4 text-left">Serial Number</th>
                  <th className="py-3 px-4 text-left">Return Reason</th>
                  <th className="py-3 px-4 text-left">Refund Amount</th>
                  <th className="py-3 px-4 text-left">Status</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredReturns.length > 0 ? (
                  filteredReturns.map((returnItem) => (
                    <tr
                      key={returnItem.id}
                      className="border-b border-gray-200 hover:bg-gray-50"
                    >
                      <td className="py-3 px-4">{returnItem.id}</td>
                      <td className="py-3 px-4">{returnItem.date}</td>
                      <td className="py-3 px-4">{returnItem.customerName}</td>
                      <td className="py-3 px-4">{returnItem.productName}</td>
                      <td className="py-3 px-4">{returnItem.serialNumber}</td>
                      <td className="py-3 px-4">{returnItem.returnReason}</td>
                      <td className="py-3 px-4">{returnItem.refundAmount}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            returnItem.status === "Processed"
                              ? "bg-green-100 text-green-800"
                              : returnItem.status === "Pending"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {returnItem.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex justify-center space-x-2">
                          <button
                            onClick={() => handleViewReturn(returnItem)}
                            className="text-blue-600 hover:text-blue-800"
                            title="View Details"
                          >
                            <FaEye size={16} />
                          </button>
                          <button
                            onClick={() => handlePrintReturn(returnItem)}
                            className="text-purple-600 hover:text-purple-800"
                            title="Print Receipt"
                          >
                            <FaPrint size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="9" className="py-4 text-center text-gray-500">
                      No returns found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add custom styles for react-select error state */}
      <style jsx>{`
        .react-select-error .react-select__control {
          border-color: #ef4444;
        }
      `}</style>
    </div>
  );
};

export default Return;