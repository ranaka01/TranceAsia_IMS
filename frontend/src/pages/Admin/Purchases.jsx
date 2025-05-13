import React, { useState, useEffect } from "react";
import axios from "axios"; 
import Button from "../../components/UI/Button";
import SearchInput from "../../components/UI/SearchInput";
import AddPurchaseModal from "./AddPurchaseModal";

const Purchases = () => {
  const [purchases, setPurchases] = useState([]);
  const [filteredPurchases, setFilteredPurchases] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
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

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-semibold">Purchase Management</h1>
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
    </div>
  );
};

export default Purchases;