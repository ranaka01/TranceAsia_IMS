import React, { useState, useEffect } from "react";
import Button from "../../components/UI/Button";
import SearchInput from "../../components/UI/SearchInput";
import AddCustomerModal from "./AddCustomerModal";
import API from "../../utils/api"; // Import your configured API instance

const Customers = () => {
  // State management
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentCustomer, setCurrentCustomer] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // API URL
  const API_URL = "/customers";

  // Enhanced validation function to check empty fields and Sri Lankan mobile number
  const validateMobileNumber = (phone) => {
    if (!phone || phone.trim() === "") {
      return false;
    }

    // Remove spaces for validation
    const cleanPhone = phone.replace(/\s+/g, "");

    // Sri Lankan mobile numbers:
    // 1. Start with '07' followed by 8 more digits
    // 2. Or international format +94 7X XXXXXXX
    const localPattern = /^07[0-9]{8}$/;
    const intlPattern = /^\+947[0-9]{8}$/;

    return localPattern.test(cleanPhone) || intlPattern.test(cleanPhone);
  };

  // Enhanced validation function to check empty fields and email format
  const validateEmail = (email) => {
    if (!email || email.trim() === "") {
      return true; // Email is optional
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailPattern.test(email);
  };

  // Fetch customers from backend API
  const fetchCustomers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await API.get(API_URL);

      // Extract customers from the nested structure
      const data = response.data?.data?.customers || [];

      setCustomers(data);
      setFilteredCustomers(data);
    } catch (err) {
      console.error("Error fetching customers:", err);
      setError("Failed to load customers. Please try again later.");
      // Initialize with empty arrays on error to prevent map errors
      setCustomers([]);
      setFilteredCustomers([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch customers when component mounts
  useEffect(() => {
    fetchCustomers();
  }, []);

  // Function to perform the search filtering
  const performSearch = (query) => {
    // Guard against customers not being an array
    if (!Array.isArray(customers)) {
      setFilteredCustomers([]);
      return;
    }

    if (!query || query.trim() === "") {
      setFilteredCustomers([...customers]);
    } else {
      const filtered = customers.filter(
        (customer) =>
          customer.name?.toLowerCase().includes(query.toLowerCase()) ||
          (customer.phone && customer.phone.includes(query)) ||
          (customer.email &&
            customer.email.toLowerCase().includes(query.toLowerCase()))
      );
      setFilteredCustomers(filtered);
    }
  };

  // Update filtered customers when customers list changes OR search query changes
  useEffect(() => {
    performSearch(searchQuery);
  }, [customers, searchQuery]); // Added searchQuery as a dependency

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    // Search will be performed by the useEffect
  };

  const handleSearch = () => {
    // Explicitly perform search (for search button click)
    performSearch(searchQuery);
  };

  const handleAddCustomer = () => {
    setValidationErrors({});
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setValidationErrors({});
  };

  const handleSaveCustomer = async (customerData) => {
    // Validate data
    const errors = {};

    // Check for empty fields first
    if (!customerData.name || customerData.name.trim() === "") {
      errors.name = "Customer name is required";
    } else if (customerData.name.trim().length < 3) {
      errors.name = "Customer name must be at least 3 characters";
    }

    if (!customerData.phone || customerData.phone.trim() === "") {
      errors.phone = "Phone number is required";
    } else if (!validateMobileNumber(customerData.phone)) {
      errors.phone =
        "Please enter a valid Sri Lankan mobile number (e.g., 071 1234567)";
    }

    if (customerData.email && customerData.email.trim() !== "" && !validateEmail(customerData.email)) {
      errors.email = "Please enter a valid email address";
    }

    // If there are validation errors, don't save
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    setIsSubmitting(true); // Set submitting state to true
    try {
      // Send POST request to add new customer
      const response = await API.post(API_URL, customerData);

      // Add the new customer to the local state - adjust based on your API response
      let newCustomer;
      if (response.data?.data?.customer) {
        newCustomer = response.data.data.customer;
      } else if (response.data) {
        newCustomer = response.data;
      }

      // Important: Update customers state with the new customer
      if (newCustomer) {
        setCustomers(prevCustomers => [...prevCustomers, newCustomer]);
        // The useEffect will handle updating filteredCustomers automatically
      }

      // Close the modal and reset validation errors
      setIsModalOpen(false);
      setValidationErrors({});
    } catch (err) {
      console.error("Error adding customer:", err);

      // Handle API error responses - check if it's a duplicate entry error
      if (err.response?.data?.message) {
        setValidationErrors({
          ...errors,
          general: err.response.data.message
        });
      } else {
        setValidationErrors({
          ...errors,
          general: "Failed to add customer. Please try again."
        });
      }
    } finally {
      setIsSubmitting(false); // Reset submitting state
    }
  };

  const handleEditCustomer = (customer) => {
    setCurrentCustomer(customer);
    setValidationErrors({});
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setCurrentCustomer(null);
    setValidationErrors({});
  };

  const handleUpdateCustomer = async (updatedData) => {
    // Validate data
    const errors = {};

    // Check for empty fields first
    if (!updatedData.name || updatedData.name.trim() === "") {
      errors.name = "Customer name is required";
    } else if (updatedData.name.trim().length < 3) {
      errors.name = "Customer name must be at least 3 characters";
    }

    if (!updatedData.phone || updatedData.phone.trim() === "") {
      errors.phone = "Phone number is required";
    } else if (!validateMobileNumber(updatedData.phone)) {
      errors.phone =
        "Please enter a valid Sri Lankan mobile number (e.g., 071 1234567)";
    }

    if (updatedData.email && updatedData.email.trim() !== "" && !validateEmail(updatedData.email)) {
      errors.email = "Please enter a valid email address";
    }

    // If there are validation errors, don't update
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    setIsSubmitting(true); // Set submitting state to true
    try {
      // Send PATCH request to update customer
      await API.patch(`${API_URL}/${currentCustomer.id}`, updatedData);

      // Update local state
      const updatedCustomers = customers.map((customer) =>
        customer.id === currentCustomer.id
          ? { ...customer, ...updatedData }
          : customer
      );

      setCustomers(updatedCustomers);
      // The useEffect will handle updating filteredCustomers
      setIsEditModalOpen(false);
      setCurrentCustomer(null);
      setValidationErrors({});
    } catch (err) {
      console.error("Error updating customer:", err);

      // Handle API error responses
      if (err.response?.data?.message) {
        setValidationErrors({
          ...errors,
          general: err.response.data.message
        });
      } else {
        setValidationErrors({
          ...errors,
          general: "Failed to update customer. Please try again."
        });
      }
    } finally {
      setIsSubmitting(false); // Reset submitting state
    }
  };

  const handleDeleteClick = (customer) => {
    setCustomerToDelete(customer);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (!customerToDelete || !customerToDelete.id) {
      setShowDeleteConfirm(false);
      return;
    }

    setIsSubmitting(true); // Set submitting state to true
    try {
      // Send DELETE request to remove customer
      await API.delete(`${API_URL}/${customerToDelete.id}`);

      // Update local state
      const updatedCustomers = customers.filter(
        (customer) => customer.id !== customerToDelete.id
      );
      setCustomers(updatedCustomers);
    } catch (err) {
      console.error("Error deleting customer:", err);
      // You could add error handling UI here
    } finally {
      setShowDeleteConfirm(false);
      setCustomerToDelete(null);
      setIsSubmitting(false); // Reset submitting state
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
    setCustomerToDelete(null);
  };

  // Ensure filteredCustomers is always an array to prevent map errors
  const safeFilteredCustomers = Array.isArray(filteredCustomers) ? filteredCustomers : [];

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-semibold">Customers</h1>
      </div>

      <div className="mb-4 flex">
        <div className="flex-grow">
          <SearchInput
            placeholder="Search by name, Mobile no"
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
            onClick={fetchCustomers}
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
        /* Customers table - with scrollable container */
        <div className="flex-1 overflow-auto mb-16">
          <table className="w-full border-collapse">
            <thead className="sticky top-0 bg-white">
              <tr className="border-b border-gray-200">
                <th className="py-3 px-4 text-left">Customer ID</th>
                <th className="py-3 px-4 text-left">Date Created</th>
                <th className="py-3 px-4 text-left">Name</th>
                <th className="py-3 px-4 text-left">Phone</th>
                <th className="py-3 px-4 text-left">Email</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {safeFilteredCustomers.length > 0 ? (
                safeFilteredCustomers.map((customer, index) => (
                  <tr
                    key={`${customer.id || index}-${index}`}
                    className="border-b border-gray-200 hover:bg-gray-50"
                  >
                    <td className="py-3 px-4">{customer.id}</td>
                    <td className="py-3 px-4">{customer.dateCreated}</td>
                    <td className="py-3 px-4">{customer.name || ""}</td>
                    <td className="py-3 px-4">{customer.phone || ""}</td>
                    <td className="py-3 px-4">
                      <div className={`${customer.email && customer.email.length > 25 ? 'text-sm' : ''} truncate max-w-[200px]`} title={customer.email || ""}>
                        {customer.email || "-"}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex justify-center space-x-2">
                        <button
                          onClick={() => handleEditCustomer(customer)}
                          className="p-1 text-blue-600 hover:text-blue-800"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeleteClick(customer)}
                          className="p-1 text-red-600 hover:text-red-800"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="py-4 px-4 text-center text-gray-500">
                    No customers found matching your search criteria
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Customer button (positioned at bottom right) */}
      <div className="fixed bottom-6 right-6">
        <Button
          variant="primary"
          onClick={handleAddCustomer}
          className="bg-blue-600 text-white py-2 px-6 rounded hover:bg-blue-700 transition-colors"
          disabled={isSubmitting} // Disable when submitting
        >
          Add Customer
        </Button>
      </div>

      {/* Add Customer Modal - Pass validation errors */}
      <AddCustomerModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveCustomer}
        validationErrors={validationErrors}
        loading={isSubmitting}
      />

      {/* Edit Customer Modal - With validation */}
      {isEditModalOpen && currentCustomer && (
        <div className="fixed inset-0 bg-gray-100 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-md p-6 w-full max-w-md max-h-screen overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Edit Customer</h2>
              <button
                onClick={handleCloseEditModal}
                className="text-gray-500 hover:text-gray-700"
                disabled={isSubmitting} // Disable when submitting
              >
                ✕
              </button>
            </div>

            {validationErrors.general && (
              <div className="mb-4 p-2 bg-red-100 border border-red-400 text-red-700 rounded">
                {validationErrors.general}
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                const updatedData = {
                  name: formData.get("name"),
                  phone: formData.get("phone"),
                  email: formData.get("email") || null
                };
                handleUpdateCustomer(updatedData);
              }}
            >
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">
                  Customer Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  defaultValue={currentCustomer?.name || ""}
                  placeholder="Enter customer name"
                  className={`w-full px-3 py-2 border ${
                    validationErrors.name ? "border-red-500" : "border-gray-300"
                  } rounded-md`}
                  required
                  disabled={isSubmitting}
                />
                {validationErrors.name && (
                  <p className="mt-1 text-sm text-red-500">
                    {validationErrors.name}
                  </p>
                )}
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 mb-2">
                  Mobile Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="phone"
                  defaultValue={currentCustomer?.phone || ""}
                  placeholder="Enter customer mobile number (e.g., 071 1234567)"
                  className={`w-full px-3 py-2 border ${
                    validationErrors.phone ? "border-red-500" : "border-gray-300"
                  } rounded-md`}
                  required
                  disabled={isSubmitting}
                />
                {validationErrors.phone && (
                  <p className="mt-1 text-sm text-red-500">
                    {validationErrors.phone}
                  </p>
                )}
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  defaultValue={currentCustomer?.email || ""}
                  placeholder="Enter customer email (optional)"
                  className={`w-full px-3 py-2 border ${
                    validationErrors.email ? "border-red-500" : "border-gray-300"
                  } rounded-md`}
                  disabled={isSubmitting}
                />
                {validationErrors.email && (
                  <p className="mt-1 text-sm text-red-500">
                    {validationErrors.email}
                  </p>
                )}
              </div>

              <button
                type="submit"
                className={`w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors ${
                  isSubmitting ? "opacity-70 cursor-not-allowed" : ""
                }`}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                    Updating...
                  </div>
                ) : (
                  "Update"
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && customerToDelete && (

        <div className="fixed inset-0 bg-gray-100 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-md p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">Confirm Delete</h2>
            <p className="mb-6">
              Are you sure you want to delete customer "{customerToDelete?.name || "Unknown"}"?
              This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={handleCancelDelete}
                className="px-4 py-2 border border-gray-300 rounded-md"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className={`px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 ${
                  isSubmitting ? "opacity-70 cursor-not-allowed" : ""
                }`}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                    Deleting...
                  </div>
                ) : (
                  "Delete"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Customers;