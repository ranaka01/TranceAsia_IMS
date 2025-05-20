import React, { useState, useEffect, useRef } from "react";
import Button from "../../components/UI/Button";
import SearchInput from "../../components/UI/SearchInput";
import AddRepairModal from "./AddRepairModal";
import ViewRepairModal from "./ViewRepairModal";
import StatusChangeModal from "./StatusChangeModal";
import RepairReceiptModal from "./RepairReceiptModal";
import { getAllRepairs, createRepair, updateRepair, updateRepairStatus, deleteRepair } from "../../services/repairService";
import { getAllTechnicians } from "../../services/userService";
import { toast } from "react-toastify";
import { formatDeadlineDate } from "../../utils/dateUtils";
import { FaCalendarAlt, FaTimes } from "react-icons/fa";
// NOTE: You need to install react-datepicker package:
// npm install react-datepicker --save
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "../../styles/calendar.css";
import "../../styles/pdfStyles.css";
import {
  isValidStatusTransition,
  getInvalidTransitionMessage,
  getValidNextStatuses
} from "../../utils/repairStatusUtils";

const RepairManagement = () => {
  // Get all repair status options from the utility function
  const repairStatusOptions = getValidNextStatuses();

  // State for technicians
  const [technicians, setTechnicians] = useState([]);

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
      extraExpenses: "300.00",
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
      extraExpenses: "500.00",
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
      extraExpenses: "200.00",
      products: ["Roller kit", "Toner cartridge"],
      password: "",
      additionalNotes: "Under warranty, no charge to customer",
      isUnderWarranty: true
    }
  ]);

  const [filteredRepairs, setFilteredRepairs] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDate, setSelectedDate] = useState(null);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [currentRepair, setCurrentRepair] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [repairToDelete, setRepairToDelete] = useState(null);

  // Reference for the date picker container to handle clicks outside
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

  // Fetch repairs and technicians from API when component mounts
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch repairs
        const repairsData = await getAllRepairs();

        // Sort repairs by ID in descending order (newest to oldest)
        const sortedRepairs = [...(repairsData || [])].sort((a, b) => {
          const idA = parseInt(a.id, 10);
          const idB = parseInt(b.id, 10);
          return idB - idA; // Descending order
        });

        setRepairs(sortedRepairs);
        setFilteredRepairs(sortedRepairs);

        // Fetch technicians
        console.log('Fetching technicians for Repairs component...');
        const technicianData = await getAllTechnicians();
        console.log('Technician data received:', technicianData);

        if (technicianData && technicianData.length > 0) {
          console.log('Setting technicians from API:', technicianData);
          setTechnicians(technicianData);
          toast.success(`Loaded ${technicianData.length} technicians from database`);
        } else {
          console.warn('No technicians found in API response, using fallback data');
          // Fallback to default technicians if none found
          const fallbackTechnicians = [
            { User_ID: 1, first_name: "Pavithra", last_name: "" },
            { User_ID: 2, first_name: "Samith", last_name: "" },
            { User_ID: 3, first_name: "Kasun", last_name: "" },
            { User_ID: 4, first_name: "Nimal", last_name: "" }
          ];
          setTechnicians(fallbackTechnicians);
          toast.warning('Using default technician data - no technicians found in database');
        }
      } catch (error) {
        console.error('Error in fetchData:', error);
        toast.error("Failed to fetch data: " + (error.response?.data?.message || error.message));

        // Set default technicians if fetch fails
        const fallbackTechnicians = [
          { User_ID: 1, first_name: "Pavithra", last_name: "" },
          { User_ID: 2, first_name: "Samith", last_name: "" },
          { User_ID: 3, first_name: "Kasun", last_name: "" },
          { User_ID: 4, first_name: "Nimal", last_name: "" }
        ];
        console.log('Setting fallback technicians due to error:', fallbackTechnicians);
        setTechnicians(fallbackTechnicians);
      }
    };

    fetchData();
  }, []);

  // Update filtered repairs when repair list changes, search query changes, or date selection changes
  useEffect(() => {
    filterRepairs();
  }, [repairs, searchQuery, selectedDate]);

  // Function to filter repairs based on search query and selected date
  const filterRepairs = () => {
    let filtered = [...repairs];

    // Apply search query filter if exists
    if (searchQuery && searchQuery.trim() !== "") {
      filtered = filtered.filter(
        (repair) =>
          repair.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
          repair.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
          repair.phone.includes(searchQuery) ||
          repair.deviceModel.toLowerCase().includes(searchQuery.toLowerCase()) ||
          repair.status.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply date filter if a date is selected
    if (selectedDate) {
      filtered = filtered.filter((repair) => {
        if (!repair.deadline) return false;

        const deadlineDate = new Date(repair.deadline);
        return (
          deadlineDate.getFullYear() === selectedDate.getFullYear() &&
          deadlineDate.getMonth() === selectedDate.getMonth() &&
          deadlineDate.getDate() === selectedDate.getDate()
        );
      });
    }

    // Sort repairs by ID in descending order (newest to oldest)
    filtered.sort((a, b) => {
      const idA = parseInt(a.id, 10);
      const idB = parseInt(b.id, 10);
      return idB - idA; // Descending order
    });

    setFilteredRepairs(filtered);
  };

  // Function to perform the search filtering (kept for backward compatibility)
  const performSearch = (query) => {
    setSearchQuery(query);
    // The actual filtering is now handled by filterRepairs() via the useEffect
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
  };

  const handleSearch = () => {
    performSearch(searchQuery);
  };

  // Toggle date picker visibility
  const toggleDatePicker = () => {
    setIsDatePickerOpen(prev => !prev);
  };

  // Function to handle date selection from calendar
  const handleDateSelect = (date) => {
    setSelectedDate(date);
    setIsDatePickerOpen(false); // Close the date picker after selection
    // The filtering will be handled by the useEffect
  };

  // Function to clear date filter
  const handleClearDateFilter = () => {
    setSelectedDate(null);
    // The filtering will be handled by the useEffect
  };

  const handleAddRepair = () => {
    setIsAddModalOpen(true);
  };

  const handleCloseAddModal = () => {
    setIsAddModalOpen(false);
  };

  const handleSaveRepair = async (repairData) => {
    try {
      await createRepair(repairData);
      toast.success("Repair created successfully");

      // Refresh the repairs list
      const repairsData = await getAllRepairs();

      // Sort repairs by ID in descending order (newest to oldest)
      const sortedRepairs = [...(repairsData || [])].sort((a, b) => {
        const idA = parseInt(a.id, 10);
        const idB = parseInt(b.id, 10);
        return idB - idA; // Descending order
      });

      setRepairs(sortedRepairs);

      setIsAddModalOpen(false);
    } catch (error) {
      toast.error("Failed to create repair: " + (error.response?.data?.message || error.message));
    }
  };

  const handleViewRepair = (repair) => {
    setCurrentRepair(repair);
    setIsViewModalOpen(true);
  };

  const handleCloseViewModal = () => {
    setIsViewModalOpen(false);
    setCurrentRepair(null);
  };

  const handleUpdateRepair = async (updatedData) => {
    try {
      console.log("Updating repair with ID:", currentRepair.id);
      console.log("Updated repair data:", updatedData);

      await updateRepair(currentRepair.id, updatedData);
      toast.success("Repair updated successfully");

      // Refresh the repairs list
      const repairsData = await getAllRepairs();

      // Sort repairs by ID in descending order (newest to oldest)
      const sortedRepairs = [...(repairsData || [])].sort((a, b) => {
        const idA = parseInt(a.id, 10);
        const idB = parseInt(b.id, 10);
        return idB - idA; // Descending order
      });

      setRepairs(sortedRepairs);

      setIsViewModalOpen(false);
      setCurrentRepair(null);
    } catch (error) {
      console.error("Error updating repair:", error);
      toast.error("Failed to update repair: " + (error.response?.data?.message || error.message));
    }
  };

  const handleStatusChange = (repair) => {
    setCurrentRepair(repair);
    setIsStatusModalOpen(true);
  };

  const handleCloseStatusModal = () => {
    setIsStatusModalOpen(false);
  };

  const handleUpdateStatus = async (newStatus, previousStatus) => {
    try {
      console.log(`Updating repair #${currentRepair.id} status from "${previousStatus}" to "${newStatus}"`);

      // Validate the status transition
      if (!isValidStatusTransition(previousStatus, newStatus)) {
        const errorMessage = getInvalidTransitionMessage(previousStatus, newStatus);
        console.error("Invalid status transition:", errorMessage);
        toast.error(errorMessage);
        return;
      }

      try {
        // Call the API to update the status with previous status
        const response = await updateRepairStatus(currentRepair.id, newStatus, previousStatus);

        // The toast notification is now handled in the StatusChangeModal component
        // based on the email sending status

        // Refresh the repairs list
        const repairsData = await getAllRepairs();

        // Sort repairs by ID in descending order (newest to oldest)
        const sortedRepairs = [...(repairsData || [])].sort((a, b) => {
          const idA = parseInt(a.id, 10);
          const idB = parseInt(b.id, 10);
          return idB - idA; // Descending order
        });

        setRepairs(sortedRepairs);

        setIsStatusModalOpen(false);
        setCurrentRepair(null);

        // Return the response so StatusChangeModal can handle notifications
        return response;
      } catch (apiError) {
        console.error("API Error updating repair status:", apiError);
        toast.error("Failed to update repair status: " + (apiError.response?.data?.message || apiError.message));
        throw apiError; // Re-throw to let StatusChangeModal handle the error
      }
    } catch (validationError) {
      console.error("Validation error in handleUpdateStatus:", validationError);
      toast.error("Validation error: " + validationError.message);
      throw validationError; // Re-throw to let StatusChangeModal handle the error
    }
  };

  const handleDeleteClick = (repair) => {
    setRepairToDelete(repair);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    try {
      await deleteRepair(repairToDelete.id);
      toast.success("Repair deleted successfully");

      // Refresh the repairs list
      const repairsData = await getAllRepairs();

      // Sort repairs by ID in descending order (newest to oldest)
      const sortedRepairs = [...(repairsData || [])].sort((a, b) => {
        const idA = parseInt(a.id, 10);
        const idB = parseInt(b.id, 10);
        return idB - idA; // Descending order
      });

      setRepairs(sortedRepairs);

      setShowDeleteConfirm(false);
      setRepairToDelete(null);
    } catch (error) {
      toast.error("Failed to delete repair: " + (error.response?.data?.message || error.message));
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
    setRepairToDelete(null);
  };

  // Function to generate PDF for repair bill
  const handlePrintBill = (repair) => {
    // Only generate PDF for repairs with "Picked Up" status
    if (repair.status !== "Picked Up") {
      toast.info("PDF receipts can only be generated for repairs with 'Picked Up' status");
      return;
    }

    // Set the current repair and open the receipt modal
    setCurrentRepair(repair);
    setIsReceiptModalOpen(true);
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

  // Format currency values with LKR symbol and thousand separators
  const formatCurrency = (amount) => {
    // Parse the amount if it's a string
    let numericAmount = amount;
    if (typeof amount === 'string') {
      numericAmount = parseFloat(amount.replace(/,/g, ''));
    }

    // Ensure amount is a valid number
    const validAmount = typeof numericAmount === 'number' && !isNaN(numericAmount) ? numericAmount : 0;

    return new Intl.NumberFormat("en-LK", {
      style: "currency",
      currency: "LKR",
      minimumFractionDigits: 2,
    })
      .format(validAmount)
      .replace("LKR", "")
      .trim();
  };

  // Calculate due amount: estimatedCost + extraExpenses - advancePayment
  const calculateDueAmount = (repair) => {
    // Parse values, removing commas
    const estimatedCost = parseFloat(repair.estimatedCost?.replace(/,/g, '') || 0);
    const extraExpenses = parseFloat(repair.extraExpenses?.replace(/,/g, '') || 0);
    const advancePayment = parseFloat(repair.advancePayment?.replace(/,/g, '') || 0);

    // Calculate due amount
    return estimatedCost + extraExpenses - advancePayment;
  };

  // Helper function to get dates with repairs due for highlighting in calendar
  const getRepairDueDates = () => {
    return repairs
      .map(repair => repair.deadline ? new Date(repair.deadline) : null)
      .filter(Boolean);
  };

  // Helper function to check if a date has repairs due
  const hasRepairsDueOnDate = (date) => {
    return repairs.some(repair => {
      if (!repair.deadline) return false;
      const deadlineDate = new Date(repair.deadline);
      return (
        deadlineDate.getFullYear() === date.getFullYear() &&
        deadlineDate.getMonth() === date.getMonth() &&
        deadlineDate.getDate() === date.getDate()
      );
    });
  };

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-semibold">Repair Management</h1>

        {/* Date filter section */}
        <div className="flex items-center relative" ref={datePickerRef}>
          {/* Date filter indicator */}
          {selectedDate && (
            <div className="flex items-center mr-3 bg-blue-50 px-3 py-1 rounded-md">
              <span className="text-sm text-blue-700">
                Deadline: {selectedDate.toLocaleDateString()}
              </span>
              <button
                onClick={handleClearDateFilter}
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
            title="Filter by deadline date"
          >
            <FaCalendarAlt className="text-gray-600" />
          </button>

          {/* Date picker dropdown */}
          {isDatePickerOpen && (
            <div className="absolute right-0 top-full mt-1 z-10 bg-white shadow-lg rounded-md p-4 border border-gray-200">
              <DatePicker
                selected={selectedDate}
                onChange={handleDateSelect}
                inline
                highlightDates={getRepairDueDates()}
                dayClassName={date =>
                  hasRepairsDueOnDate(date) ? "bg-yellow-100 hover:bg-yellow-200" : undefined
                }
              />
            </div>
          )}
        </div>
      </div>

      <div className="mb-4">
        <SearchInput
          placeholder="Search by ID, customer name, phone, device model or status"
          value={searchQuery}
          onChange={handleSearchChange}
          onSearch={handleSearch}
        />
      </div>

      {/* Filter info */}
      <div className="mb-2 text-sm text-gray-500 flex flex-wrap items-center">
        {(searchQuery || selectedDate) && (
          <>
            {searchQuery && (
              <span className="mr-4">
                Searching for: "{searchQuery}"
              </span>
            )}
            <span>
              Found {filteredRepairs.length} results
            </span>
          </>
        )}
      </div>

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
              <th className="py-3 px-4 text-left">Due Amount</th>
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
                  <td className="py-3 px-4">{formatDeadlineDate(repair.deadline)}</td>
                  <td className="py-3 px-4">
                    {(() => {
                      // Try to find the technician in the technicians array
                      if (Array.isArray(technicians)) {
                        const techId = repair.technician;
                        const foundTech = technicians.find(t =>
                          (typeof t === 'object' && `${t.User_ID}` === techId) || t === techId
                        );

                        if (foundTech) {
                          const displayName = typeof foundTech === 'object' ?
                            `${foundTech.first_name} ${foundTech.last_name || ''}`.trim() || foundTech.Username || `Technician ${foundTech.User_ID}` :
                            foundTech;

                          return displayName;
                        }
                      }

                      // Fallback to the stored technician value
                      return repair.technician;
                    })()}
                  </td>
                  <td className="py-3 px-4">{repair.customer}</td>
                  <td className="py-3 px-4">{repair.deviceModel}</td>
                  <td className="py-3 px-4">Rs. {formatCurrency(calculateDueAmount(repair))}</td>
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
                      {repair.status === "Picked Up" ? (
                        <button
                          className="p-1 text-gray-500 cursor-not-allowed"
                          title="Status cannot be changed after pickup"
                          disabled
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="#6B7280"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                        </button>
                      ) : (
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
                      )}
                      <button
                        onClick={() => handlePrintBill(repair)}
                        className={`p-1 ${repair.status === "Picked Up" ? "text-purple-600 hover:text-purple-800" : "text-purple-400 hover:text-purple-600"}`}
                        title={repair.status === "Picked Up" ? "Generate Receipt PDF" : "PDF receipts can only be generated for repairs with 'Picked Up' status"}
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

      {/* Receipt Modal */}
      {isReceiptModalOpen && currentRepair && (
        <RepairReceiptModal
          isOpen={isReceiptModalOpen}
          onClose={() => setIsReceiptModalOpen(false)}
          repair={currentRepair}
          technicians={technicians}
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