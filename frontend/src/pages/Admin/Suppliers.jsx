import React, { useState, useEffect } from "react";
import Button from "../../components/UI/Button";
import SearchInput from "../../components/UI/SearchInput";
//import AddSupplierModal from "./AddSupplierModal";
import API from "../../utils/api";

const Suppliers = () => {
  // Sample product categories
  const productCategories = [
    "Laptop/Desktop",
    "Hardware",
    "Peripherals",
    "Mobile Devices",
    "Networking",
    "Storage",
    "Accessories",
  ];

  // State management
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // API URL
  const API_URL = "/suppliers";

  // Mobile number validation (Sri Lankan)
  const validateMobileNumber = (phone) => {
    if (!phone || phone.trim() === "") {
      return false;
    }

    const cleanPhone = phone.replace(/\s+/g, "");
    const localPattern = /^07[0-9]{8}$/;
    const intlPattern = /^\+947[0-9]{8}$/;

    return localPattern.test(cleanPhone) || intlPattern.test(cleanPhone);
  };

  // Email validation
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
      const data = response.data?.data?.suppliers || [];

      // Format date for display if needed
      const formattedData = data.map(supplier => ({
        ...supplier,
        formattedDate: supplier.date ? new Date(supplier.date).toLocaleDateString() : 'N/A'
      }));

      setSuppliers(formattedData);
      setFilteredSuppliers(formattedData);
    } catch (err) {
      console.error("Error fetching suppliers:", err);
      setError("Failed to load suppliers. Please try again later.");
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
          supplier.shop_name?.toLowerCase().includes(query.toLowerCase()) ||
          (supplier.phone && supplier.phone.includes(query)) ||
          (supplier.email && supplier.email.toLowerCase().includes(query.toLowerCase())) ||
          (supplier.address && supplier.address.toLowerCase().includes(query.toLowerCase()))
      );
      setFilteredSuppliers(filtered);
    }
  };

  // Update filtered suppliers when suppliers list changes OR search query changes
  useEffect(() => {
    performSearch(searchQuery);
  }, [suppliers, searchQuery]);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
  };

  const handleSearch = () => {
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

    // Basic validation checks
    if (!supplierData.name || supplierData.name.trim() === "") {
      errors.name = "Supplier name is required";
    } else if (supplierData.name.trim().length < 3) {
      errors.name = "Supplier name must be at least 3 characters";
    }

    if (!supplierData.shop_name || supplierData.shop_name.trim() === "") {
      errors.shop_name = "Shop name is required";
    }

    if (!supplierData.phone || supplierData.phone.trim() === "") {
      errors.phone = "Phone number is required";
    } else if (!validateMobileNumber(supplierData.phone)) {
      errors.phone = "Please enter a valid Sri Lankan mobile number (e.g., 071 1234567)";
    } else {
      // Check for duplicate phone
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
    }

    // If there are validation errors, don't save
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    // Add current date
    const formattedData = {
      ...supplierData,
      date: new Date().toISOString().split('T')[0], // YYYY-MM-DD format
      is_active: true
    };

    setIsSubmitting(true);
    try {
      // Send POST request to add new supplier
      const response = await API.post(API_URL, formattedData);

      // Add the new supplier to the local state
      let newSupplier;
      if (response.data?.data?.supplier) {
        newSupplier = response.data.data.supplier;
      } else if (response.data) {
        newSupplier = response.data;
      }

      // Update suppliers state with the new supplier
      if (newSupplier) {
        const formattedSupplier = {
          ...newSupplier,
          formattedDate: new Date(newSupplier.date).toLocaleDateString()
        };
        setSuppliers(prevSuppliers => [...prevSuppliers, formattedSupplier]);
      }

      // Close the modal and reset validation errors
      setIsModalOpen(false);
      setValidationErrors({});
    } catch (err) {
      console.error("Error adding supplier:", err);

      // Handle API error responses
      if (err.response?.data?.errors) {
        const apiErrors = err.response.data.errors;

        // Map API errors to form fields
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
      setIsSubmitting(false);
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

    // Basic validation checks
    if (!updatedData.name || updatedData.name.trim() === "") {
      errors.name = "Supplier name is required";
    } else if (updatedData.name.trim().length < 3) {
      errors.name = "Supplier name must be at least 3 characters";
    }

    if (!updatedData.shop_name || updatedData.shop_name.trim() === "") {
      errors.shop_name = "Shop name is required";
    }

    if (!updatedData.phone || updatedData.phone.trim() === "") {
      errors.phone = "Phone number is required";
    } else if (!validateMobileNumber(updatedData.phone)) {
      errors.phone = "Please enter a valid Sri Lankan mobile number (e.g., 071 1234567)";
    } else {
      // Check for duplicate phone (excluding current supplier)
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
    }

    // If there are validation errors, don't update
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    setIsSubmitting(true);
    try {
      // Send PATCH request to update supplier
      await API.patch(`${API_URL}/${currentSupplier.id}`, updatedData);

      // Update local state
      const updatedSuppliers = suppliers.map((supplier) =>
        supplier.id === currentSupplier.id
          ? {
              ...supplier,
              ...updatedData,
              formattedDate: supplier.formattedDate // Keep the formatted date
            }
          : supplier
      );

      setSuppliers(updatedSuppliers);
      setIsEditModalOpen(false);
      setCurrentSupplier(null);
      setValidationErrors({});
    } catch (err) {
      console.error("Error updating supplier:", err);

      // Handle API error responses
      if (err.response?.data?.errors) {
        const apiErrors = err.response.data.errors;

        // Map API errors to form fields
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
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (supplier) => {
    setIsSubmitting(true);
    try {
      const updatedStatus = { is_active: !supplier.is_active };
      await API.patch(`${API_URL}/${supplier.id}`, updatedStatus);

      // Update local state
      const updatedSuppliers = suppliers.map((s) =>
        s.id === supplier.id
          ? { ...s, is_active: !s.is_active }
          : s
      );

      setSuppliers(updatedSuppliers);
    } catch (err) {
      console.error("Error toggling supplier status:", err);
      // Show error notification if needed
    } finally {
      setIsSubmitting(false);
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

    setIsSubmitting(true);
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
      setIsSubmitting(false);
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
            placeholder="Search by name, shop, phone or email"
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
                <th className="py-3 px-4 text-left">ID</th>
                <th className="py-3 px-4 text-left">Name</th>
                <th className="py-3 px-4 text-left">Shop Name</th>
                <th className="py-3 px-4 text-left">Phone</th>
                <th className="py-3 px-4 text-left">Email</th>
                <th className="py-3 px-4 text-left">Address</th>
                <th className="py-3 px-4 text-center">Date</th>
                <th className="py-3 px-4 text-center">Status</th>
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
                    <td className="py-3 px-4">{supplier.shop_name || ""}</td>
                    <td className="py-3 px-4">{supplier.phone || ""}</td>
                    <td className="py-3 px-4">
                      <div className={`${supplier.email && supplier.email.length > 25 ? 'text-sm' : ''} truncate max-w-[200px]`} title={supplier.email || ""}>
                        {supplier.email || ""}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className={`${supplier.address && supplier.address.length > 30 ? 'text-sm' : ''} truncate max-w-[200px]`} title={supplier.address || ""}>
                        {supplier.address || ""}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">{supplier.formattedDate || supplier.date || "N/A"}</td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          supplier.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {supplier.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex justify-center space-x-2">
                        <button
                          onClick={() => handleEditSupplier(supplier)}
                          className="p-1 text-blue-600 hover:text-blue-800"
                          title="Edit"
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
                          onClick={() => handleToggleStatus(supplier)}
                          className={`p-1 ${
                            supplier.is_active
                              ? 'text-yellow-600 hover:text-yellow-800'
                              : 'text-green-600 hover:text-green-800'
                          }`}
                          title={supplier.is_active ? 'Deactivate' : 'Activate'}
                        >
                          {supplier.is_active ? (
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
                                d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                              />
                            </svg>
                          ) : (
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
                                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                          )}
                        </button>
                        <button
                          onClick={() => handleDeleteClick(supplier)}
                          className="p-1 text-red-600 hover:text-red-800"
                          title="Delete"
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
                  <td colSpan="9" className="py-4 px-4 text-center text-gray-500">
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
          disabled={isSubmitting}
        >
          Add Supplier
        </Button>
      </div>

      {/* Add Supplier Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-100 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-md p-6 w-full max-w-md max-h-screen overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">New Supplier</h2>
              <button
                onClick={handleCloseModal}
                className="text-gray-500 hover:text-gray-700"
                disabled={isSubmitting}
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                const supplierData = {
                  name: formData.get("name"),
                  shop_name: formData.get("shop_name"),
                  phone: formData.get("phone"),
                  email: formData.get("email"),
                  address: formData.get("address"),
                };
                handleSaveSupplier(supplierData);
              }}
            >
              {validationErrors.submit && (
                <div className="mb-4 p-2 bg-red-100 border border-red-400 text-red-700 rounded">
                  {validationErrors.submit}
                </div>
              )}

              {/* Name */}
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">
                  Supplier Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  placeholder="Enter supplier name"
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

              {/* Shop Name */}
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">
                  Shop Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="shop_name"
                  placeholder="Enter shop name"
                  className={`w-full px-3 py-2 border ${
                    validationErrors.shop_name ? "border-red-500" : "border-gray-300"
                  } rounded-md`}
                  required
                  disabled={isSubmitting}
                />
                {validationErrors.shop_name && (
                  <p className="mt-1 text-sm text-red-500">
                    {validationErrors.shop_name}
                  </p>
                )}
              </div>

              {/* Phone */}
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">
                  Mobile Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="phone"
                  placeholder="Enter supplier contact number (e.g., 071 1234567)"
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

              {/* Email */}
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  placeholder="Enter supplier Email"
                  className={`w-full px-3 py-2 border ${
                    validationErrors.email ? "border-red-500" : "border-gray-300"
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

              {/* Address */}
              <div className="mb-6">
                <label className="block text-gray-700 mb-2">
                  Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="address"
                  placeholder="Enter supplier Address"
                  className={`w-full px-3 py-2 border ${
                    validationErrors.address ? "border-red-500" : "border-gray-300"
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

              {/* Submit Button */}
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
                    Saving...
                  </div>
                ) : (
                  "Save"
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Supplier Modal - With validation */}
      {isEditModalOpen && currentSupplier && (
        <div className="fixed inset-0 bg-gray-100 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-md p-6 w-full max-w-md max-h-screen overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Edit Supplier</h2>
              <button
                onClick={handleCloseEditModal}
                className="text-gray-500 hover:text-gray-700"
                disabled={isSubmitting}
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
                  shop_name: formData.get("shop_name"),
                  phone: formData.get("phone"),
                  email: formData.get("email"),
                  address: formData.get("address"),
                };
                handleUpdateSupplier(updatedData);
              }}
            >
              {validationErrors.submit && (
                <div className="mb-4 p-2 bg-red-100 border border-red-400 text-red-700 rounded">
                  {validationErrors.submit}
                </div>
              )}

              {/* Name */}
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">
                  Supplier Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  defaultValue={currentSupplier?.name || ""}
                  placeholder="Enter supplier name"
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

              {/* Shop Name */}
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">
                  Shop Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="shop_name"
                  defaultValue={currentSupplier?.shop_name || ""}
                  placeholder="Enter shop name"
                  className={`w-full px-3 py-2 border ${
                    validationErrors.shop_name ? "border-red-500" : "border-gray-300"
                  } rounded-md`}
                  required
                  disabled={isSubmitting}
                />
                {validationErrors.shop_name && (
                  <p className="mt-1 text-sm text-red-500">
                    {validationErrors.shop_name}
                  </p>
                )}
              </div>

              {/* Phone */}
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

              {/* Email */}
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
                    validationErrors.email ? "border-red-500" : "border-gray-300"
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

              {/* Address */}
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
                    validationErrors.address ? "border-red-500" : "border-gray-300"
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

              {/* Submit Button */}
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
        <div className="fixed inset-0 bg-gray-100 bg-opacity-50 flex items-center justify-center z-50">
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