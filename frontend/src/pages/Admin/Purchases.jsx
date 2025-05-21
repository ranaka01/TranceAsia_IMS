import React, { useState, useEffect } from "react";
import axios from "axios";
import Button from "../../components/UI/Button";
import SearchInput from "../../components/UI/SearchInput";
import AddPurchaseModal from "./AddPurchaseModal";
import { toast } from "react-toastify";

const Purchases = () => {
  const [purchases, setPurchases] = useState([]);
  const [filteredPurchases, setFilteredPurchases] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showUndoConfirm, setShowUndoConfirm] = useState(false);
  const [undoReason, setUndoReason] = useState("");
  const [isUndoSubmitting, setIsUndoSubmitting] = useState(false);

  // API configuration
  const API = axios.create({
    baseURL: 'http://localhost:5000',
    timeout: 10000,
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  });

  // Fetch purchases from backend
  const fetchPurchases = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await API.get("/purchases");
      const purchasesData = response.data?.data?.purchases || [];
      setPurchases(purchasesData);
      setFilteredPurchases(purchasesData);
    } catch (err) {
      console.error("Error fetching purchases:", err);
      setError("Failed to load purchases. Please try again later.");
      setPurchases([]);
      setFilteredPurchases([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial data load
  useEffect(() => {
    fetchPurchases();
  }, []);

  // Search functionality
  const performSearch = (query) => {
    if (!Array.isArray(purchases)) {
      setFilteredPurchases([]);
      return;
    }

    if (!query || query.trim() === "") {
      setFilteredPurchases([...purchases]);
    } else {
      const filtered = purchases.filter(
        (purchase) =>
          purchase.product_name?.toLowerCase().includes(query.toLowerCase()) ||
          purchase.supplier_name?.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredPurchases(filtered);
    }
  };

  // Update filtered purchases when purchases list or search query changes
  useEffect(() => {
    performSearch(searchQuery);
  }, [purchases, searchQuery]);

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleSearchSubmit = () => {
    performSearch(searchQuery);
  };

  // Modal handlers
  const handleOpenAddModal = () => {
    setIsAddModalOpen(true);
  };

  const handleCloseAddModal = () => {
    setIsAddModalOpen(false);
  };

  // Save purchase handler - MODIFIED
  const handleSavePurchase = async (purchaseData) => {
    try {
      console.log("Purchase data before sending to API:", purchaseData);

      // Make sure all numeric fields are properly typed
      const dataToSend = {
        ...purchaseData,
        product_id: parseInt(purchaseData.product_id),
        quantity: parseInt(purchaseData.quantity),
        buying_price: parseFloat(purchaseData.buying_price),
        selling_price: parseFloat(purchaseData.selling_price)
      };

      console.log("Formatted purchase data to send:", dataToSend);

      const response = await API.post("/purchases", dataToSend);

      console.log("API response:", response.data);

      if (response.data?.data?.purchase) {
        // Refresh purchases list after successful add
        fetchPurchases();
        return true;
      }
    } catch (err) {
      console.error("Error adding purchase:", err);
      // If there's a response with error details, log it
      if (err.response && err.response.data) {
        console.error("Server error details:", err.response.data);
      }
      return false;
    }
  };

  // Handle opening the undo confirmation modal
  const handleUndoLastPurchase = () => {
    setShowUndoConfirm(true);
  };

  // Handle canceling the undo action
  const handleCancelUndo = () => {
    setShowUndoConfirm(false);
    setUndoReason("");
  };

  // Handle confirming the undo action
  const handleConfirmUndo = async () => {
    setIsUndoSubmitting(true);
    try {
      const response = await API.post("/purchases/undo-last", {
        reason: undoReason
      });

      if (response.data?.status === 'success') {
        toast.success("Last purchase has been successfully undone");
        fetchPurchases();
        setShowUndoConfirm(false);
        setUndoReason("");
      }
    } catch (err) {
      console.error("Error undoing last purchase:", err);

      // Display appropriate error message based on the response
      if (err.response?.data?.message) {
        const errorMessage = err.response.data.message;

        // Check for specific error conditions and provide user-friendly messages
        if (errorMessage.includes('associated sales')) {
          toast.error(
            <div>
              <strong>Cannot undo this purchase</strong>
              <p>This purchase has already been used in sales transactions. To undo this purchase, you must first undo the associated sales.</p>
              <p className="text-sm mt-1">Error details: Products from this purchase have already been sold.</p>
            </div>
          );
        } else if (errorMessage.includes('Purchase not found')) {
          toast.error(
            <div>
              <strong>Purchase Not Found</strong>
              <p>The purchase you're trying to undo could not be found in the system.</p>
              <p className="text-sm mt-1">It may have been already deleted or modified by another user.</p>
            </div>
          );
        } else if (errorMessage.includes('No recent purchases')) {
          toast.error(
            <div>
              <strong>No Purchases to Undo</strong>
              <p>There are no recent purchases in the system that can be undone.</p>
              <p className="text-sm mt-1">Please make sure there are purchases in the system before trying to undo.</p>
            </div>
          );
        } else if (errorMessage.includes('inventory')) {
          toast.error(
            <div>
              <strong>Inventory Error</strong>
              <p>Cannot undo this purchase due to inventory constraints.</p>
              <p className="text-sm mt-1">Error details: {errorMessage}</p>
            </div>
          );
        } else if (errorMessage.includes('transaction')) {
          toast.error(
            <div>
              <strong>Transaction Error</strong>
              <p>A database transaction error occurred while trying to undo the purchase.</p>
              <p className="text-sm mt-1">Please try again later or contact support if the issue persists.</p>
            </div>
          );
        } else {
          // For any other error messages from the server
          toast.error(
            <div>
              <strong>Unable to Undo Purchase</strong>
              <p>{errorMessage}</p>
              <p className="text-sm mt-1">If this issue persists, please contact support.</p>
            </div>
          );
        }
      } else if (err.response?.status === 401) {
        toast.error(
          <div>
            <strong>Permission Denied</strong>
            <p>You don't have permission to undo purchases.</p>
            <p className="text-sm mt-1">Please contact an administrator for assistance.</p>
          </div>
        );
      } else if (err.response?.status === 403) {
        toast.error(
          <div>
            <strong>Access Forbidden</strong>
            <p>You don't have the necessary role permissions to perform this action.</p>
            <p className="text-sm mt-1">Only administrators can undo purchases.</p>
          </div>
        );
      } else if (err.response?.status === 404) {
        toast.error(
          <div>
            <strong>Resource Not Found</strong>
            <p>The purchase you're trying to undo could not be found.</p>
            <p className="text-sm mt-1">It may have been deleted or never existed.</p>
          </div>
        );
      } else if (err.response?.status === 500) {
        toast.error(
          <div>
            <strong>Server Error</strong>
            <p>A server error occurred while trying to undo the purchase.</p>
            <p className="text-sm mt-1">Please try again later or contact support.</p>
          </div>
        );
      } else if (err.message === 'Network Error') {
        toast.error(
          <div>
            <strong>Network Error</strong>
            <p>Unable to connect to the server. Please check your internet connection.</p>
            <p className="text-sm mt-1">If you're connected to the internet, the server might be down.</p>
          </div>
        );
      } else {
        // Fallback for any other errors
        toast.error(
          <div>
            <strong>Error Undoing Purchase</strong>
            <p>An unexpected error occurred while trying to undo the purchase.</p>
            <p className="text-sm mt-1">Please try again or contact support if the issue persists.</p>
          </div>
        );
      }

      // Close the modal after a delay to allow the user to read the error message
      setTimeout(() => {
        setShowUndoConfirm(false);
      }, 5000);
    } finally {
      setIsUndoSubmitting(false);
    }
  };

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-semibold">Purchase Management</h1>
        <div className="flex space-x-4">
          <button
            onClick={handleUndoLastPurchase}
            className="border border-red-500 text-red-500 px-4 py-2 rounded hover:bg-red-50 transition-colors"
          >
            Undo Last Purchase
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-4 flex">
        <div className="flex-grow">
          <SearchInput
            placeholder="Search by product or supplier"
            value={searchQuery}
            onChange={handleSearchChange}
            onSearch={handleSearchSubmit}
          />
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
          {error}
          <button
            className="ml-2 underline"
            onClick={fetchPurchases}
          >
            Try Again
          </button>
        </div>
      )}

      {/* Purchases table */}
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="flex-1 overflow-auto mb-16">
          <table className="w-full border-collapse">
            <thead className="sticky top-0 bg-white">
              <tr className="border-b border-gray-200">
                <th className="py-3 px-4 text-left">Purchase ID</th>
                <th className="py-3 px-4 text-left">Product</th>
                <th className="py-3 px-4 text-left">Supplier</th>
                <th className="py-3 px-4 text-left">Quantity</th>
                <th className="py-3 px-4 text-left">Warranty</th>
                <th className="py-3 px-4 text-left">Buying Price</th>
                <th className="py-3 px-4 text-left">Selling Price</th>
                <th className="py-3 px-4 text-left">Date</th>
                <th className="py-3 px-4 text-left">Remaining Stock</th>
              </tr>
            </thead>
            <tbody>
              {filteredPurchases.length > 0 ? (
                filteredPurchases.map((purchase, index) => (
                  <tr
                    key={`${purchase.purchase_id || index}-${index}`}
                    className="border-b border-gray-200 hover:bg-gray-50"
                  >
                    <td className="py-3 px-4">{purchase.purchase_id}</td>
                    <td className="py-3 px-4">{purchase.product_name || ""}</td>
                    <td className="py-3 px-4">{purchase.supplier_name || ""}</td>
                    <td className="py-3 px-4">{purchase.quantity || 0}</td>
                    <td className="py-3 px-4">{purchase.warranty || "N/A"}</td>
                    <td className="py-3 px-4">{purchase.buying_price?.toLocaleString() || 0}</td>
                    <td className="py-3 px-4">{purchase.selling_price?.toLocaleString() || 0}</td>
                    <td className="py-3 px-4">
  {purchase.date ? new Date(purchase.date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }) : ""}
</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded text-sm ${
                        purchase.remaining_stock <= 0
                          ? 'bg-red-100 text-red-800'
                          : purchase.remaining_stock < 5
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-green-100 text-green-800'
                      }`}>
                        {purchase.remaining_stock || 0}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="9" className="py-4 px-4 text-center text-gray-500">
                    No purchases found matching your search criteria
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Purchase Button */}
      <div className="fixed bottom-6 right-6">
        <Button
          onClick={handleOpenAddModal}
          className="bg-blue-600 text-white py-2 px-6 rounded hover:bg-blue-700 transition-colors"
        >
          Add Purchase
        </Button>
      </div>

      {/* Add Purchase Modal */}
      <AddPurchaseModal
        isOpen={isAddModalOpen}
        onClose={handleCloseAddModal}
        onSave={handleSavePurchase}
      />

      {/* Undo Confirmation Modal */}
      {showUndoConfirm && (
        <div className="fixed inset-0 bg-gray-100 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-md p-6 w-full max-w-md shadow-lg">
            <h2 className="text-lg font-semibold mb-4">Confirm Undo Last Purchase</h2>
            <p className="mb-4 text-gray-700">
              Are you sure you want to undo the most recent purchase? This action cannot be undone.
            </p>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-medium mb-1">
                Reason (Optional)
              </label>
              <textarea
                value={undoReason}
                onChange={(e) => setUndoReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter reason for undoing this purchase"
                rows="3"
              />
            </div>
            <div className="flex justify-end space-x-4">
              <button
                onClick={handleCancelUndo}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                disabled={isUndoSubmitting}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmUndo}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                disabled={isUndoSubmitting}
              >
                {isUndoSubmitting ? "Processing..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Purchases;