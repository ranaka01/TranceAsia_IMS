import React, { useState, useEffect } from "react";
import Button from "../../components/UI/Button";
import SearchInput from "../../components/UI/SearchInput";
import API from "../../utils/api";
import { format } from "date-fns";

const Warranty = () => {
  // State management
  const [warrantyClaims, setWarrantyClaims] = useState([]);
  const [filteredClaims, setFilteredClaims] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentClaim, setCurrentClaim] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");

  // Fetch warranty claims from API
  const fetchWarrantyClaims = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Adjust this endpoint based on your actual API
      const response = await API.get("/warranty-claims");
      
      // Extract data from the response
      const data = response.data?.data?.claims || [];
      
      setWarrantyClaims(data);
      setFilteredClaims(data);
    } catch (err) {
      console.error("Error fetching warranty claims:", err);
      setError("Failed to load warranty claims. Please try again later.");
      setWarrantyClaims([]);
      setFilteredClaims([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Load warranty claims when component mounts
  useEffect(() => {
    fetchWarrantyClaims();
  }, []);

  // Apply filters to warranty claims
  const applyFilters = () => {
    if (!Array.isArray(warrantyClaims)) {
      setFilteredClaims([]);
      return;
    }

    let result = [...warrantyClaims];

    // Apply status filter
    if (statusFilter !== "all") {
      result = result.filter(claim => claim.status === statusFilter);
    }

    // Apply date filter
    if (dateFilter === "today") {
      const today = new Date().toISOString().split('T')[0];
      result = result.filter(claim => claim.claimed_date === today);
    } else if (dateFilter === "week") {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      result = result.filter(claim => new Date(claim.claimed_date) >= oneWeekAgo);
    } else if (dateFilter === "month") {
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
      result = result.filter(claim => new Date(claim.claimed_date) >= oneMonthAgo);
    }

    // Apply search query
    if (searchQuery && searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        claim => 
          (claim.customer_name && claim.customer_name.toLowerCase().includes(query)) ||
          (claim.claim_id && claim.claim_id.toString().includes(query)) ||
          (claim.product_name && claim.product_name.toLowerCase().includes(query)) ||
          (claim.issue_description && claim.issue_description.toLowerCase().includes(query))
      );
    }

    setFilteredClaims(result);
  };

  // Run filters when any filtering criterion changes
  useEffect(() => {
    applyFilters();
  }, [warrantyClaims, searchQuery, statusFilter, dateFilter]);

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleSearch = () => {
    applyFilters();
  };

  const handleAddClaim = () => {
    setCurrentClaim(null);
    setIsModalOpen(true);
  };

  const handleViewClaim = (claim) => {
    setCurrentClaim(claim);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentClaim(null);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return format(new Date(dateString), 'MMM dd, yyyy');
  };

  // Get status badge class based on status
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'In Progress':
        return 'bg-blue-100 text-blue-800';
      case 'Completed':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-semibold">Warranty Claims</h1>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-4">
        <div className="flex-grow">
          <SearchInput
            placeholder="Search by customer, product, issue..."
            value={searchQuery}
            onChange={handleSearchChange}
            onSearch={handleSearch}
          />
        </div>

        {/* Status Filter */}
        <div className="w-44">
          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-md appearance-none"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
          </select>
        </div>

        {/* Date Filter */}
        <div className="w-44">
          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-md appearance-none"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">Past Week</option>
            <option value="month">Past Month</option>
          </select>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
          {error}
          <button
            className="ml-2 underline"
            onClick={fetchWarrantyClaims}
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
        /* Warranty claims table */
        <div className="flex-1 overflow-auto mb-16 bg-white rounded-lg shadow">
          <table className="w-full border-collapse">
            <thead className="sticky top-0 bg-white">
              <tr className="border-b border-gray-200">
                <th className="py-3 px-4 text-left font-medium text-gray-700">Claim ID</th>
                <th className="py-3 px-4 text-left font-medium text-gray-700">Product</th>
                <th className="py-3 px-4 text-left font-medium text-gray-700">Customer</th>
                <th className="py-3 px-4 text-left font-medium text-gray-700">Issue</th>
                <th className="py-3 px-4 text-center font-medium text-gray-700">Status</th>
                <th className="py-3 px-4 text-left font-medium text-gray-700">Claimed Date</th>
                <th className="py-3 px-4 text-left font-medium text-gray-700">Resolved Date</th>
              </tr>
            </thead>
            <tbody>
              {filteredClaims.length > 0 ? (
                filteredClaims.map((claim, index) => (
                  <tr
                    key={`${claim.claim_id || index}-${index}`}
                    className="border-b border-gray-200 hover:bg-gray-50 cursor-pointer"
                    onClick={() => handleViewClaim(claim)}
                  >
                    <td className="py-3 px-4">{claim.claim_id}</td>
                    <td className="py-3 px-4">{claim.product_name}</td>
                    <td className="py-3 px-4">{claim.customer_name}</td>
                    <td className="py-3 px-4 max-w-xs truncate" title={claim.issue_description}>
                      {claim.issue_description}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center justify-center px-2 py-1 text-xs font-medium rounded-full ${getStatusBadgeClass(claim.status)}`}>
                        {claim.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">{formatDate(claim.claimed_date)}</td>
                    <td className="py-3 px-4">{formatDate(claim.resolved_date)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="py-4 px-4 text-center text-gray-500">
                    No warranty claims found matching your search criteria
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Warranty Claim button (positioned at bottom right) */}
      <div className="fixed bottom-6 right-6">
        <Button
          variant="primary"
          onClick={handleAddClaim}
          className="bg-blue-600 text-white py-2 px-6 rounded-md hover:bg-blue-700 transition-colors shadow-md"
        >
          Add Warranty Claim
        </Button>
      </div>

      {/* Warranty Claim Modal */}
      {isModalOpen && (
        <WarrantyClaimModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onSave={(claimData) => {
            // Handle save logic
            fetchWarrantyClaims(); // Refresh data after save
            handleCloseModal();
          }}
          claim={currentClaim}
        />
      )}
    </div>
  );
};

// Placeholder for the Warranty Claim Modal component
const WarrantyClaimModal = ({ isOpen, onClose, onSave, claim }) => {
  const [formData, setFormData] = useState({
    customer_id: '',
    customer_name: '',
    product_id: '',
    product_name: '',
    sale_id: '',
    issue_description: '',
    status: 'Pending'
  });
  
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isViewMode, setIsViewMode] = useState(false);
  
  useEffect(() => {
    if (claim) {
      setFormData({
        customer_id: claim.customer_id || '',
        customer_name: claim.customer_name || '',
        product_id: claim.product_id || '',
        product_name: claim.product_name || '',
        sale_id: claim.sale_id || '',
        issue_description: claim.issue_description || '',
        status: claim.status || 'Pending'
      });
      
      // If the claim is being viewed and not created, set to view mode
      if (claim.claim_id) {
        setIsViewMode(true);
      }
    }
  }, [claim]);
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-md p-6 w-full max-w-lg max-h-screen overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">
            {isViewMode 
              ? `Warranty Claim #${claim.claim_id}` 
              : claim 
                ? 'Edit Warranty Claim' 
                : 'New Warranty Claim'
            }
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>
        
        <div className="space-y-4">
          {/* Modal form would be fully implemented here */}
          {isViewMode ? (
            // View mode - display claim details
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Customer</p>
                  <p className="font-medium">{formData.customer_name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Product</p>
                  <p className="font-medium">{formData.product_name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Sale ID</p>
                  <p className="font-medium">{formData.sale_id}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <p className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${getStatusBadgeClass(formData.status)}`}>
                    {formData.status}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-gray-500">Issue Description</p>
                  <p>{formData.issue_description}</p>
                </div>
                
                {claim.claimed_date && (
                  <div>
                    <p className="text-sm text-gray-500">Claimed Date</p>
                    <p>{formatDate(claim.claimed_date)}</p>
                  </div>
                )}
                
                {claim.resolved_date && (
                  <div>
                    <p className="text-sm text-gray-500">Resolved Date</p>
                    <p>{formatDate(claim.resolved_date)}</p>
                  </div>
                )}
              </div>
              
              {/* Action buttons for view mode */}
              <div className="flex justify-end space-x-2 mt-6">
                {claim.status !== 'Completed' && (
                  <Button
                    variant="primary"
                    onClick={() => {
                      // Logic to update status would go here
                      const nextStatus = claim.status === 'Pending' ? 'In Progress' : 'Completed';
                      // Example: updateWarrantyStatus(claim.claim_id, nextStatus)
                      onClose();
                    }}
                    className="bg-blue-600 text-white py-2 px-6 rounded-md hover:bg-blue-700"
                  >
                    {claim.status === 'Pending' ? 'Start Processing' : 'Mark Completed'}
                  </Button>
                )}
              </div>
            </div>
          ) : (
            // Edit/Create mode
            <div className="space-y-4">
              <p className="text-center py-4">
                Warranty claim form would be implemented here with fields for:
              </p>
              <ul className="list-disc pl-6 text-gray-600">
                <li>Customer lookup/selection</li>
                <li>Product lookup/selection (from previous sales records)</li>
                <li>Issue description textarea</li>
                <li>Status dropdown</li>
                <li>Date selectors</li>
              </ul>
              
              <div className="flex justify-end space-x-2 mt-6">
                <Button
                  variant="secondary"
                  onClick={onClose}
                  className="border border-gray-300 py-2 px-6 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={() => onSave(formData)}
                  className="bg-blue-600 text-white py-2 px-6 rounded-md hover:bg-blue-700"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                      Saving...
                    </div>
                  ) : (
                    'Save'
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
  
  // Helper function for status badge classes
  function getStatusBadgeClass(status) {
    switch (status) {
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'In Progress':
        return 'bg-blue-100 text-blue-800';
      case 'Completed':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }
  
  // Helper function for date formatting
  function formatDate(dateString) {
    if (!dateString) return '';
    return format(new Date(dateString), 'MMM dd, yyyy');
  }
};

export default Warranty;