import React, { useState, useEffect } from "react";
import Button from "./Button";
import SearchInput from "./SearchInput";
import AddRepairModal from "./AddRepairModal";
import ViewRepairModal from "./ViewRepairModal";
import StatusChangeModal from "./StatusChangeModal";

const RepairManagement = () => {
  // Sample repair status options
  const repairStatusOptions = [
    "Pending",
    "In Progress",
    "Waiting for Parts",
    "Completed",
    "Cannot Repair",
    "Picked Up"
  ];

  // Sample technicians
  const technicians = [
    "Pavithra",
    "Samith",
    "Kasun",
    "Nimal"
  ];

  // Sample repair data
  const [repairs, setRepairs] = useState([
    {
      id: "3225",
      customer: "Sachintha",
      phone: "071 2345678",
      email: "sachintha@gmail.com",
      deviceType: "Laptop",
      deviceModel: "ASUS TUF F15",
      serialNumber: "AST45678901",
      issue: "Screen flickering, keyboard not working properly",
      technician: "Pavithra",
      status: "In Progress",
      dateReceived: "2025-04-18",
      deadline: "2025-04-25",
      estimatedCost: "2,000.00",
      advancePayment: "500.00",
      products: ["Screen replacement", "Keyboard"],
      password: "1234",
      additionalNotes: "Customer needs urgent repair",
      isUnderWarranty: false
    },
    {
      id: "3226",
      customer: "Malith",
      phone: "077 8765432",
      email: "malith@gmail.com",
      deviceType: "Desktop",
      deviceModel: "Custom Build",
      serialNumber: "N/A",
      issue: "Not powering on, possible PSU failure",
      technician: "Kasun",
      status: "Waiting for Parts",
      dateReceived: "2025-04-19",
      deadline: "2025-04-28",
      estimatedCost: "3,500.00",
      advancePayment: "1,000.00",
      products: ["Power Supply Unit"],
      password: "",
      additionalNotes: "Customer will bring in missing cables tomorrow",
      isUnderWarranty: false
    },
    {
      id: "3227",
      customer: "Nayana",
      phone: "076 5432198",
      email: "nayana@gmail.com",
      deviceType: "Printer",
      deviceModel: "HP LaserJet Pro",
      serialNumber: "HP7654321",
      issue: "Paper jam and print quality issues",
      technician: "Samith",
      status: "Completed",
      dateReceived: "2025-04-15",
      deadline: "2025-04-22",
      estimatedCost: "1,500.00",
      advancePayment: "0.00",
      products: ["Roller kit", "Toner cartridge"],
      password: "",
      additionalNotes: "Under warranty, no charge to customer",
      isUnderWarranty: true
    }
  ]);

  const [filteredRepairs, setFilteredRepairs] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [currentRepair, setCurrentRepair] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [repairToDelete, setRepairToDelete] = useState(null);
  
  // Initialize with all repairs when component mounts
  useEffect(() => {
    setFilteredRepairs([...repairs]);
  }, []);

  // Update filtered repairs when repair list changes OR search query changes
  useEffect(() => {
    performSearch(searchQuery);
  }, [repairs, searchQuery]);

  // Function to perform the search filtering
  const performSearch = (query) => {
    if (!query || query.trim() === "") {
      setFilteredRepairs([...repairs]);
    } else {
      const filtered = repairs.filter(
        (repair) =>
          repair.id.toLowerCase().includes(query.toLowerCase()) ||
          repair.customer.toLowerCase().includes(query.toLowerCase()) ||
          repair.phone.includes(query) ||
          repair.deviceModel.toLowerCase().includes(query.toLowerCase()) ||
          repair.status.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredRepairs(filtered);
    }
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
  };

  const handleSearch = () => {
    performSearch(searchQuery);
  };

  const handleAddRepair = () => {
    setIsAddModalOpen(true);
  };

  const handleCloseAddModal = () => {
    setIsAddModalOpen(false);
  };

  const handleSaveRepair = (repairData) => {
    // Generate a new ID
    const lastId = repairs.length > 0
      ? parseInt(repairs[repairs.length - 1].id)
      : 3224;
    const newId = (lastId + 1).toString();

    // Add the new repair to the list
    const newRepair = {
      id: newId,
      ...repairData,
      dateReceived: new Date().toISOString().split('T')[0]
    };

    setRepairs([...repairs, newRepair]);
    setIsAddModalOpen(false);
  };

  const handleViewRepair = (repair) => {
    setCurrentRepair(repair);
    setIsViewModalOpen(true);
  };

  const handleCloseViewModal = () => {
    setIsViewModalOpen(false);
    setCurrentRepair(null);
  };

  const handleUpdateRepair = (updatedData) => {
    const updatedRepairs = repairs.map((repair) =>
      repair.id === currentRepair.id
        ? { ...repair, ...updatedData }
        : repair
    );

    setRepairs(updatedRepairs);
    setIsViewModalOpen(false);
    setCurrentRepair(null);
  };

  const handleStatusChange = (repair) => {
    setCurrentRepair(repair);
    setIsStatusModalOpen(true);
  };

  const handleCloseStatusModal = () => {
    setIsStatusModalOpen(false);
  };

  const handleUpdateStatus = (newStatus) => {
    const updatedRepairs = repairs.map((repair) =>
      repair.id === currentRepair.id
        ? { ...repair, status: newStatus }
        : repair
    );

    setRepairs(updatedRepairs);
    setIsStatusModalOpen(false);
    setCurrentRepair(null);
  };

  const handleDeleteClick = (repair) => {
    setRepairToDelete(repair);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = () => {
    const updatedRepairs = repairs.filter(
      (repair) => repair.id !== repairToDelete.id
    );
    setRepairs(updatedRepairs);
    setShowDeleteConfirm(false);
    setRepairToDelete(null);
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
    setRepairToDelete(null);
  };

  // Function to generate PDF for repair bill
  const handlePrintBill = (repair) => {
    alert(`Generating bill for repair ID: ${repair.id}`);
    // In a real implementation, this would generate and download a PDF
  };

  // Function to generate work order PDF
  const handlePrintWorkOrder = (repair) => {
    alert(`Generating work order for repair ID: ${repair.id}`);
    // In a real implementation, this would generate and download a PDF
  };

  // Helper function to style status badges
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "Pending":
        return "bg-yellow-100 text-yellow-800";
      case "In Progress":
        return "bg-blue-100 text-blue-800";
      case "Waiting for Parts":
        return "bg-purple-100 text-purple-800";
      case "Completed":
        return "bg-green-100 text-green-800";
      case "Cannot Repair":
        return "bg-red-100 text-red-800";
      case "Picked Up":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-semibold">Repair Management</h1>
      </div>

      <div className="mb-4 flex">
        <div className="flex-grow">
          <SearchInput
            placeholder="Search by ID, customer name, phone, device model or status"
            value={searchQuery}
            onChange={handleSearchChange}
            onSearch={handleSearch}
          />
        </div>
      </div>

      {/* Debug info - can be removed in production */}
      {searchQuery && (
        <div className="mb-2 text-sm text-gray-500">
          Searching for: "{searchQuery}" - Found {filteredRepairs.length} results
        </div>
      )}

      {/* Repairs table - with scrollable container */}
      <div className="flex-1 overflow-auto mb-16">
        <table className="w-full border-collapse">
          <thead className="sticky top-0 bg-white">
            <tr className="border-b border-gray-200">
              <th className="py-3 px-4 text-left">Repair ID</th>
              <th className="py-3 px-4 text-left">Status</th>
              <th className="py-3 px-4 text-left">Deadline</th>
              <th className="py-3 px-4 text-left">Technician</th>
              <th className="py-3 px-4 text-left">Customer</th>
              <th className="py-3 px-4 text-left">Device Model</th>
              <th className="py-3 px-4 text-left">Total Cost</th>
              <th className="py-3 px-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredRepairs.length > 0 ? (
              filteredRepairs.map((repair) => (
                <tr key={repair.id} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="py-3 px-4">{repair.id}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(repair.status)}`}>
                      {repair.status}
                    </span>
                  </td>
                  <td className="py-3 px-4">{repair.deadline.split('-')[1]}/{repair.deadline.split('-')[2]}</td>
                  <td className="py-3 px-4">{repair.technician}</td>
                  <td className="py-3 px-4">{repair.customer}</td>
                  <td className="py-3 px-4">{repair.deviceModel}</td>
                  <td className="py-3 px-4">{repair.estimatedCost}</td>
                  <td className="py-3 px-4">
                    <div className="flex justify-center space-x-2">
                      <button
                        onClick={() => handleViewRepair(repair)}
                        className="p-1 text-blue-600 hover:text-blue-800"
                        title="View Details"
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
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleStatusChange(repair)}
                        className="p-1 text-green-600 hover:text-green-800"
                        title="Update Status"
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
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      </button>
                      <button
                        onClick={() => handlePrintBill(repair)}
                        className="p-1 text-purple-600 hover:text-purple-800"
                        title="Print Bill"
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
                            d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                          />
                        </svg>
                      </button>
                      <button
                        onClick={() => handlePrintWorkOrder(repair)}
                        className="p-1 text-indigo-600 hover:text-indigo-800"
                        title="Print Work Order"
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
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDeleteClick(repair)}
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
                <td colSpan="8" className="py-4 px-4 text-center text-gray-500">
                  No repairs found matching your search criteria
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add Repair button (positioned at bottom right) */}
      <div className="fixed bottom-6 right-6">
        <Button
          variant="primary"
          onClick={handleAddRepair}
          className="bg-blue-600 text-white py-2 px-6 rounded hover:bg-blue-700 transition-colors"
        >
          Add Repair
        </Button>
      </div>

      {/* Add Repair Modal */}
      <AddRepairModal
        isOpen={isAddModalOpen}
        onClose={handleCloseAddModal}
        onSave={handleSaveRepair}
        technicians={technicians}
        statusOptions={repairStatusOptions}
      />

      {/* View/Edit Repair Modal */}
      {isViewModalOpen && currentRepair && (
        <ViewRepairModal
          isOpen={isViewModalOpen}
          onClose={handleCloseViewModal}
          onUpdate={handleUpdateRepair}
          repair={currentRepair}
          technicians={technicians}
          statusOptions={repairStatusOptions}
        />
      )}

      {/* Status Change Modal */}
      {isStatusModalOpen && currentRepair && (
        <StatusChangeModal
          isOpen={isStatusModalOpen}
          onClose={handleCloseStatusModal}
          onUpdate={handleUpdateStatus}
          repair={currentRepair}
          statusOptions={repairStatusOptions}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-md p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">Confirm Delete</h2>
            <p className="mb-6">
              Are you sure you want to delete repair #{repairToDelete?.id} for {repairToDelete?.customer}? 
              This action cannot be undone.
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

export default RepairManagement;