import React, { useState, useEffect } from "react";
import Button from "../../components/UI/Button";
import SearchInput from "../../components/UI/SearchInput";
import AddSupplierModal from "./AddSupplierModal";
import API from "../../utils/api"; // Import your configured API instance instead of axios

const Suppliers = () => {
  // Sample product categories - could also come from the backend
  const productCategories = [
    "Laptop/Desktop",
    "Hardware",
    "Peripherals",
    "Mobile Devices",
    "Networking",
    "Storage",
    "Accessories",
  ];

  // State management - ensure arrays are initialized properly
  const [suppliers, setSuppliers] = useState([]);
  const [filteredSuppliers, setFilteredSuppliers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentSupplier, setCurrentSupplier] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [supplierToDelete, setSupplierToDelete] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false); // New state for form submission
  const [error, setError] = useState(null);

  // API URL - replace with environment variable
  const API_URL = "/suppliers"; // No need for full URL, it's in the baseURL of your API instance

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
      return false;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailPattern.test(email);
  };

  // Fetch suppliers from backend API
  const fetchSuppliers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await API.get(API_URL);

      // Fixed: Extract suppliers from the nested structure
      // Check if response.data.data exists and contains suppliers
      const data = response.data?.data?.suppliers || [];

      setSuppliers(data);
      setFilteredSuppliers(data);
    } catch (err) {
      console.error("Error fetching suppliers:", err);
      setError("Failed to load suppliers. Please try again later.");
      // Initialize with empty arrays on error to prevent map errors
      setSuppliers([]);
      setFilteredSuppliers([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch suppliers when component mounts
  useEffect(() => {
    fetchSuppliers();
  }, []);

  // Function to perform the search filtering
  const performSearch = (query) => {
    // Guard against suppliers not being an array
    if (!Array.isArray(suppliers)) {
      setFilteredSuppliers([]);
      return;
    }

    if (!query || query.trim() === "") {
      setFilteredSuppliers([...suppliers]);
    } else {
      const filtered = suppliers.filter(
        (supplier) =>
          supplier.name?.toLowerCase().includes(query.toLowerCase()) ||
          (supplier.phone && supplier.phone.includes(query)) ||
          (supplier.email &&
            supplier.email.toLowerCase().includes(query.toLowerCase())) ||
          (supplier.category &&
            supplier.category.toLowerCase().includes(query.toLowerCase()))
      );
      setFilteredSuppliers(filtered);
    }
  };

  // Update filtered suppliers when suppliers list changes OR search query changes
  useEffect(() => {
    performSearch(searchQuery);
  }, [suppliers, searchQuery]); // Added searchQuery as a dependency

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    // Search will be performed by the useEffect
  };

  const handleSearch = () => {
    // Explicitly perform search (for search button click)
    performSearch(searchQuery);
  };

  const handleAddSupplier = () => {
    setValidationErrors({});
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setValidationErrors({});
  };

  const handleSaveSupplier = async (supplierData) => {
    // Validate data
    const errors = {};

    // Check for empty fields first
    if (!supplierData.name || supplierData.name.trim() === "") {
      errors.name = "Supplier name is required";
    } else if (supplierData.name.trim().length < 3) {
      errors.name = "Supplier name must be at least 3 characters";
    }

    if (!supplierData.category || supplierData.category.trim() === "") {
      errors.category = "Category is required";
    }

    if (!supplierData.phone || supplierData.phone.trim() === "") {
      errors.phone = "Phone number is required";
    } else if (!validateMobileNumber(supplierData.phone)) {
      errors.phone =
        "Please enter a valid Sri Lankan mobile number (e.g., 071 1234567)";
    } else {
      // Check for duplicate phone number
      const isDuplicatePhone = suppliers.some(
        supplier => supplier.phone === supplierData.phone
      );
      if (isDuplicatePhone) {
        errors.phone = "This phone number is already registered with another supplier";
      }
    }

    if (!supplierData.email || supplierData.email.trim() === "") {
      errors.email = "Email is required";
    } else if (!validateEmail(supplierData.email)) {
      errors.email = "Please enter a valid email address";
    } else {
      // Check for duplicate email
      const isDuplicateEmail = suppliers.some(
        supplier => supplier.email && supplier.email.toLowerCase() === supplierData.email.toLowerCase()
      );
      if (isDuplicateEmail) {
        errors.email = "This email is already registered with another supplier";
      }
    }

    if (!supplierData.address || supplierData.address.trim() === "") {
      errors.address = "Address is required";
    } else if (supplierData.address.trim().length < 5) {
      errors.address = "Please enter a complete address";
    } else {
      // Check for duplicate address (case insensitive comparison)
      const isDuplicateAddress = suppliers.some(
        supplier => supplier.address && supplier.address.toLowerCase() === supplierData.address.toLowerCase()
      );
      if (isDuplicateAddress) {
        errors.address = "This address is already registered with another supplier";
      }
    }

    // If there are validation errors, don't save
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    setIsSubmitting(true); // Set submitting state to true
    try {
      // Send POST request to add new supplier
      const response = await API.post(API_URL, supplierData);

      // Add the new supplier to the local state - adjust based on your API response
      let newSupplier;
      if (response.data?.data?.supplier) {
        newSupplier = response.data.data.supplier;
      } else if (response.data) {
        newSupplier = response.data;
      }

      // Important: Update suppliers state with the new supplier
      if (newSupplier) {
        setSuppliers(prevSuppliers => [...prevSuppliers, newSupplier]);
        // The useEffect will handle updating filteredSuppliers automatically
      }

      // Close the modal and reset validation errors
      setIsModalOpen(false);
      setValidationErrors({});
    } catch (err) {
      console.error("Error adding supplier:", err);
      
      // Handle API error responses - check if it's a duplicate entry error
      if (err.response?.data?.errors) {
        const apiErrors = err.response.data.errors;
        
        // Map API errors to our form fields
        const fieldErrors = {};
        if (apiErrors.email) fieldErrors.email = "This email is already registered";
        if (apiErrors.phone) fieldErrors.phone = "This phone number is already registered";
        if (apiErrors.address) fieldErrors.address = "This address is already registered";
        
        if (Object.keys(fieldErrors).length > 0) {
          setValidationErrors({
            ...errors,
            ...fieldErrors
          });
        } else {
          setValidationErrors({
            ...errors,
            submit: "Failed to add supplier. Please try again."
          });
        }
      } else {
        setValidationErrors({
          ...errors,
          submit: "Failed to add supplier. Please try again."
        });
      }
    } finally {
      setIsSubmitting(false); // Reset submitting state
    }
  };

  const handleEditSupplier = (supplier) => {
    setCurrentSupplier(supplier);
    setValidationErrors({});
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setCurrentSupplier(null);
    setValidationErrors({});
  };

  const handleUpdateSupplier = async (updatedData) => {
    // Validate data
    const errors = {};

    // Check for empty fields first
    if (!updatedData.name || updatedData.name.trim() === "") {
      errors.name = "Supplier name is required";
    } else if (updatedData.name.trim().length < 3) {
      errors.name = "Supplier name must be at least 3 characters";
    }

    if (!updatedData.category || updatedData.category.trim() === "") {
      errors.category = "Category is required";
    }

    if (!updatedData.phone || updatedData.phone.trim() === "") {
      errors.phone = "Phone number is required";
    } else if (!validateMobileNumber(updatedData.phone)) {
      errors.phone =
        "Please enter a valid Sri Lankan mobile number (e.g., 071 1234567)";
    } else {
      // Check for duplicate phone number (excluding current supplier)
      const isDuplicatePhone = suppliers.some(
        supplier => supplier.id !== currentSupplier.id && supplier.phone === updatedData.phone
      );
      if (isDuplicatePhone) {
        errors.phone = "This phone number is already registered with another supplier";
      }
    }

    if (!updatedData.email || updatedData.email.trim() === "") {
      errors.email = "Email is required";
    } else if (!validateEmail(updatedData.email)) {
      errors.email = "Please enter a valid email address";
    } else {
      // Check for duplicate email (excluding current supplier)
      const isDuplicateEmail = suppliers.some(
        supplier => supplier.id !== currentSupplier.id && 
          supplier.email && supplier.email.toLowerCase() === updatedData.email.toLowerCase()
      );
      if (isDuplicateEmail) {
        errors.email = "This email is already registered with another supplier";
      }
    }

    if (!updatedData.address || updatedData.address.trim() === "") {
      errors.address = "Address is required";
    } else if (updatedData.address.trim().length < 5) {
      errors.address = "Please enter a complete address";
    } else {
      // Check for duplicate address (excluding current supplier)
      const isDuplicateAddress = suppliers.some(
        supplier => supplier.id !== currentSupplier.id && 
          supplier.address && supplier.address.toLowerCase() === updatedData.address.toLowerCase()
      );
      if (isDuplicateAddress) {
        errors.address = "This address is already registered with another supplier";
      }
    }

    // If there are validation errors, don't update
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    setIsSubmitting(true); // Set submitting state to true
    try {
      // Send PATCH request to update supplier (backend uses PATCH not PUT)
      await API.patch(`${API_URL}/${currentSupplier.id}`, updatedData);

      // Update local state
      const updatedSuppliers = suppliers.map((supplier) =>
        supplier.id === currentSupplier.id
          ? { ...supplier, ...updatedData }
          : supplier
      );

      setSuppliers(updatedSuppliers);
      // The useEffect will handle updating filteredSuppliers
      setIsEditModalOpen(false);
      setCurrentSupplier(null);
      setValidationErrors({});
    } catch (err) {
      console.error("Error updating supplier:", err);
      
      // Handle API error responses - check if it's a duplicate entry error
      if (err.response?.data?.errors) {
        const apiErrors = err.response.data.errors;
        
        // Map API errors to our form fields
        const fieldErrors = {};
        if (apiErrors.email) fieldErrors.email = "This email is already registered";
        if (apiErrors.phone) fieldErrors.phone = "This phone number is already registered";
        if (apiErrors.address) fieldErrors.address = "This address is already registered";
        
        if (Object.keys(fieldErrors).length > 0) {
          setValidationErrors({
            ...errors,
            ...fieldErrors
          });
        } else {
          setValidationErrors({
            ...errors,
            submit: "Failed to update supplier. Please try again."
          });
        }
      } else {
        setValidationErrors({
          ...errors,
          submit: "Failed to update supplier. Please try again."
        });
      }
    } finally {
      setIsSubmitting(false); // Reset submitting state
    }
  };

  const handleDeleteClick = (supplier) => {
    setSupplierToDelete(supplier);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (!supplierToDelete || !supplierToDelete.id) {
      setShowDeleteConfirm(false);
      return;
    }

    setIsSubmitting(true); // Set submitting state to true
    try {
      // Send DELETE request to remove supplier
      await API.delete(`${API_URL}/${supplierToDelete.id}`);

      // Update local state
      const updatedSuppliers = suppliers.filter(
        (supplier) => supplier.id !== supplierToDelete.id
      );
      setSuppliers(updatedSuppliers);
    } catch (err) {
      console.error("Error deleting supplier:", err);
      // You could add error handling UI here
    } finally {
      setShowDeleteConfirm(false);
      setSupplierToDelete(null);
      setIsSubmitting(false); // Reset submitting state
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
    setSupplierToDelete(null);
  };

  // Ensure filteredSuppliers is always an array to prevent map errors
  const safeFilteredSuppliers = Array.isArray(filteredSuppliers) ? filteredSuppliers : [];

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-semibold">Suppliers</h1>
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
            onClick={fetchSuppliers}
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
        /* Suppliers table - with scrollable container */
        <div className="flex-1 overflow-auto mb-16">
          <table className="w-full border-collapse">
            <thead className="sticky top-0 bg-white">
              <tr className="border-b border-gray-200">
                <th className="py-3 px-4 text-left">Supplier ID</th>
                <th className="py-3 px-4 text-left">Name</th>
                <th className="py-3 px-4 text-left">Product Category</th>
                <th className="py-3 px-4 text-left">Phone</th>
                <th className="py-3 px-4 text-left">Email</th>
                <th className="py-3 px-4 text-left">Address</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {safeFilteredSuppliers.length > 0 ? (
                safeFilteredSuppliers.map((supplier, index) => (
                  <tr
                    key={`${supplier.id || index}-${index}`}
                    className="border-b border-gray-200 hover:bg-gray-50"
                  >
                    <td className="py-3 px-4">{supplier.id}</td>
                    <td className="py-3 px-4">{supplier.name || ""}</td>
                    <td className="py-3 px-4">{supplier.category || ""}</td>
                    <td className="py-3 px-4">{supplier.phone || ""}</td>
                    <td className="py-3 px-4">
                      <div className={`${supplier.email && supplier.email.length > 25 ? 'text-sm' : ''} truncate max-w-[200px]`} title={supplier.email || ""}>
                        {supplier.email || ""}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className={`${supplier.address && supplier.address.length > 30 ? 'text-sm' : ''} truncate max-w-[250px]`} title={supplier.address || ""}>
                        {supplier.address || ""}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex justify-center space-x-2">
                        <button
                          onClick={() => handleEditSupplier(supplier)}
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
                          onClick={() => handleDeleteClick(supplier)}
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
                  <td colSpan="7" className="py-4 px-4 text-center text-gray-500">
                    No suppliers found matching your search criteria
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Supplier button (positioned at bottom right) */}
      <div className="fixed bottom-6 right-6">
        <Button
          variant="primary"
          onClick={handleAddSupplier}
          className="bg-blue-600 text-white py-2 px-6 rounded hover:bg-blue-700 transition-colors"
          disabled={isSubmitting} // Disable when submitting
        >
          Add Supplier
        </Button>
      </div>

      {/* Add Supplier Modal - Pass validation errors */}
      <AddSupplierModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveSupplier}
        categories={productCategories}
        validationErrors={validationErrors}
        loading={isSubmitting}
      />

      {/* Edit Supplier Modal - With validation */}
      {isEditModalOpen && currentSupplier && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-md p-6 w-full max-w-md max-h-screen overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Edit Supplier</h2>
              <button
                onClick={handleCloseEditModal}
                className="text-gray-500 hover:text-gray-700"
                disabled={isSubmitting} // Disable when submitting
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                const updatedData = {
                  name: formData.get("name"),
                  category: formData.get("category"),
                  phone: formData.get("phone"),
                  email: formData.get("email"),
                  address: formData.get("address"),
                };
                handleUpdateSupplier(updatedData);
              }}
            >
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">
                  Supplier Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  defaultValue={currentSupplier?.name || ""}
                  placeholder="Enter supplier or shop name"
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
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  name="category"
                  defaultValue={currentSupplier?.category || ""}
                  className={`w-full px-3 py-2 border ${
                    validationErrors.category
                      ? "border-red-500"
                      : "border-gray-300"
                  } rounded-md appearance-none`}
                  required
                  disabled={isSubmitting}
                >
                  <option value="" disabled>
                    Select product category
                  </option>
                  {productCategories.map((category, index) => (
                    <option key={index} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
                {validationErrors.category && (
                  <p className="mt-1 text-sm text-red-500">
                    {validationErrors.category}
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
                  defaultValue={currentSupplier?.phone || ""}
                  placeholder="Enter supplier contact number (e.g., 071 1234567)"
                  className={`w-full px-3 py-2 border ${
                    validationErrors.phone
                      ? "border-red-500"
                      : "border-gray-300"
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
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  defaultValue={currentSupplier?.email || ""}
                  placeholder="Enter supplier Email"
                  className={`w-full px-3 py-2 border ${
                    validationErrors.email
                      ? "border-red-500"
                      : "border-gray-300"
                  } rounded-md`}
                  required
                  disabled={isSubmitting}
                />
                {validationErrors.email && (
                  <p className="mt-1 text-sm text-red-500">
                    {validationErrors.email}
                  </p>
                )}
              </div>

              <div className="mb-6">
                <label className="block text-gray-700 mb-2">
                  Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="address"
                  defaultValue={currentSupplier?.address || ""}
                  placeholder="Enter supplier Address"
                  className={`w-full px-3 py-2 border ${
                    validationErrors.address
                      ? "border-red-500"
                      : "border-gray-300"
                  } rounded-md`}
                  required
                  disabled={isSubmitting}
                />
                {validationErrors.address && (
                  <p className="mt-1 text-sm text-red-500">
                    {validationErrors.address}
                  </p>
                )}
              </div>

              {validationErrors.submit && (
                <p className="mb-4 text-sm text-red-500">
                  {validationErrors.submit}
                </p>
              )}

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
      {showDeleteConfirm && supplierToDelete && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-md p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">Confirm Delete</h2>
            <p className="mb-6">
              Are you sure you want to delete supplier "{supplierToDelete?.name || "Unknown"}"?
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

export default Suppliers;