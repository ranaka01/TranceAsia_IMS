import React, { useState, useEffect } from "react";
import Button from "../../components/UI/Button";
import SearchInput from "../../components/UI/SearchInput";
import AddCustomerModal from "./AddCustomerModal";

const Customers = () => {
  // Sample customers data
  const [customers, setCustomers] = useState([
    {
      id: "1011",
      name: "Pasindu Dulanjaya",
      phone: "077 0093285",
      email: "Pasindu@gmail.com",
      dateCreated: "03/11 10:52"
    },
    {
      id: "1012",
      name: "Sanith Mendis",
      phone: "071 5553421",
      email: "sanith@example.com",
      dateCreated: "05/11 09:30"
    },
    {
      id: "1013",
      name: "Thilini Perera",
      phone: "076 8842109",
      email: "thilini@example.com",
      dateCreated: "08/11 14:15"
    }
  ]);

  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentCustomer, setCurrentCustomer] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});

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

  // Initialize with all customers when component mounts
  useEffect(() => {
    setFilteredCustomers([...customers]);
  }, []);

  // Update filtered customers when customers list changes OR search query changes
  useEffect(() => {
    performSearch(searchQuery);
  }, [customers, searchQuery]); // Added searchQuery as a dependency

  // Function to perform the search filtering
  const performSearch = (query) => {
    if (!query || query.trim() === "") {
      setFilteredCustomers([...customers]);
    } else {
      const filtered = customers.filter(
        (customer) =>
          customer.name.toLowerCase().includes(query.toLowerCase()) ||
          (customer.phone && customer.phone.includes(query)) ||
          (customer.email &&
            customer.email.toLowerCase().includes(query.toLowerCase()))
      );
      setFilteredCustomers(filtered);
    }
  };

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

  const handleSaveCustomer = (customerData) => {
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

    // Generate a new ID (in a real app, this might come from the backend)
    const lastId =
      customers.length > 0
        ? parseInt(customers[customers.length - 1].id)
        : 1010;
    const newId = `${lastId + 1}`;

    // Get current date and time for dateCreated
    const now = new Date();
    const dateCreated = `${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    // Add the new customer to the list
    const newCustomer = {
      id: newId,
      dateCreated: dateCreated,
      name: customerData.name,
      phone: customerData.phone,
      email: customerData.email
    };

    setCustomers([...customers, newCustomer]);
    setIsModalOpen(false);
    setValidationErrors({});
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

  const handleUpdateCustomer = (updatedData) => {
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

    const updatedCustomers = customers.map((customer) =>
      customer.id === currentCustomer.id
        ? { ...customer, ...updatedData }
        : customer
    );

    setCustomers(updatedCustomers);
    setIsEditModalOpen(false);
    setCurrentCustomer(null);
    setValidationErrors({});
  };

  const handleDeleteClick = (customer) => {
    setCustomerToDelete(customer);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = () => {
    const updatedCustomers = customers.filter(
      (customer) => customer.id !== customerToDelete.id
    );
    setCustomers(updatedCustomers);
    setShowDeleteConfirm(false);
    setCustomerToDelete(null);
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
    setCustomerToDelete(null);
  };

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

      {/* Debug info - can be removed in production */}
      {searchQuery && (
        <div className="mb-2 text-sm text-gray-500">
          Searching for: "{searchQuery}" - Found {filteredCustomers.length}{" "}
          results
        </div>
      )}

      {/* Customers table - with scrollable container */}
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
            {filteredCustomers.length > 0 ? (
              filteredCustomers.map((customer, index) => (
                <tr
                  key={`${customer.id}-${index}`}
                  className="border-b border-gray-200 hover:bg-gray-50"
                >
                  <td className="py-3 px-4">{customer.id}</td>
                  <td className="py-3 px-4">{customer.dateCreated}</td>
                  <td className="py-3 px-4">{customer.name}</td>
                  <td className="py-3 px-4">{customer.phone}</td>
                  <td className="py-3 px-4">{customer.email || "-"}</td>

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
                <td colSpan="7" className="py-4 px-4 text-center text-gray-500">
                  No customers found matching your search criteria
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add Customer button (positioned at bottom right) */}
      <div className="fixed bottom-6 right-6">
        <Button
          variant="primary"
          onClick={handleAddCustomer}
          className="bg-blue-600 text-white py-2 px-6 rounded hover:bg-blue-700 transition-colors"
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
      />

      {/* Edit Customer Modal - With validation */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-md p-6 w-full max-w-md max-h-screen overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Edit Customer</h2>
              <button
                onClick={handleCloseEditModal}
                className="text-gray-500 hover:text-gray-700"
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
                  phone: formData.get("phone"),
                  email: formData.get("email")
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
                  defaultValue={currentCustomer?.name}
                  placeholder="Enter customer name"
                  className={`w-full px-3 py-2 border ${
                    validationErrors.name ? "border-red-500" : "border-gray-300"
                  } rounded-md`}
                  required
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
                  defaultValue={currentCustomer?.phone}
                  placeholder="Enter customer mobile number (e.g., 071 1234567)"
                  className={`w-full px-3 py-2 border ${
                    validationErrors.phone ? "border-red-500" : "border-gray-300"
                  } rounded-md`}
                  required
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
                  defaultValue={currentCustomer?.email}
                  placeholder="Enter customer email"
                  className={`w-full px-3 py-2 border ${
                    validationErrors.email ? "border-red-500" : "border-gray-300"
                  } rounded-md`}
                />
                {validationErrors.email && (
                  <p className="mt-1 text-sm text-red-500">
                    {validationErrors.email}
                  </p>
                )}
              </div>



              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
              >
                Update
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-md p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">Confirm Delete</h2>
            <p className="mb-6">
              Are you sure you want to delete customer "{customerToDelete?.name}
              "? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={handleCancelDelete}
                className="px-4 py-2 border border-gray-300 rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Customers;