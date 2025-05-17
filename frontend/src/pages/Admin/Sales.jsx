import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import Button from "../../components/UI/Button";
import SearchInput from "../../components/UI/SearchInput";
import AddSaleModal from "./AddSaleModal";
import API from "../../utils/api";

const Sales = () => {
  const [sales, setSales] = useState([]);
  const [filteredSales, setFilteredSales] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAddSaleModalOpen, setIsAddSaleModalOpen] = useState(false);
  const [currentSale, setCurrentSale] = useState(null);
  

  // Fetch sales from the API
  const fetchSales = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await API.get("sales/");
      const data = response.data?.data?.sales || [];
      setSales(data);
      setFilteredSales(data);
    } catch (err) {
      console.error("Error fetching sales:", err);
      setError("Failed to load sales. Please try again later.");
      setSales([]);
      setFilteredSales([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Load sales when component mounts
  useEffect(() => {
    fetchSales();
  }, []);

  // Filter sales based on search query
  const performSearch = (query) => {
    if (!Array.isArray(sales)) {
      setFilteredSales([]);
      return;
    }

    if (!query || query.trim() === "") {
      setFilteredSales([...sales]);
    } else {
      const filtered = sales.filter(
        (sale) =>
          (sale.bill_no && sale.bill_no.toString().includes(query)) ||
          (sale.customer_name && sale.customer_name.toLowerCase().includes(query.toLowerCase())) ||
          (sale.items && sale.items.toLowerCase().includes(query.toLowerCase()))
      );
      setFilteredSales(filtered);
    }
  };

  // Update filtered sales when sales list or search query changes
  useEffect(() => {
    performSearch(searchQuery);
  }, [sales, searchQuery]);

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleSearch = () => {
    performSearch(searchQuery);
  };

  const handleAddSale = () => {
    setCurrentSale(null);
    setIsAddSaleModalOpen(true);
  };

  const handleViewSale = (sale) => {
    setCurrentSale(sale);
    setIsAddSaleModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsAddSaleModalOpen(false);
    setCurrentSale(null);
  };

  const handleSaleSaved = (newSale) => {
    fetchSales();
    setIsAddSaleModalOpen(false);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-LK', { 
      style: 'currency', 
      currency: 'LKR',
      minimumFractionDigits: 2
    }).format(amount).replace('LKR', '').trim();
  };

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-semibold">Sales</h1>
        <div className="flex items-center">
          <div className="mr-2">
            <label className="text-sm text-gray-600 mr-2">All time</label>
            <input type="checkbox" className="form-checkbox h-4 w-4 text-blue-600" />
          </div>
        </div>
      </div>

      <div className="mb-4 flex">
        <div className="flex-grow">
          <SearchInput
            placeholder="Search by bill no, customer, products..."
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
            onClick={fetchSales}
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
        /* Sales table */
        <div className="flex-1 overflow-auto mb-16">
          <table className="w-full border-collapse">
            <thead className="sticky top-0 bg-white">
              <tr className="border-b border-gray-200">
                <th className="py-3 px-4 text-left">Bill No</th>
                <th className="py-3 px-4 text-left">Date</th>
                <th className="py-3 px-4 text-left">Items</th>
                <th className="py-3 px-4 text-left">Customer</th>
                <th className="py-3 px-4 text-left">User</th>
                <th className="py-3 px-4 text-right">Total, LKR</th>
              </tr>
            </thead>
            <tbody>
              {filteredSales.length > 0 ? (
                filteredSales.map((sale, index) => (
                  <tr
                    key={`${sale.bill_no || index}-${index}`}
                    className="border-b border-gray-200 hover:bg-gray-50 cursor-pointer"
                    onClick={() => handleViewSale(sale)}
                  >
                    <td className="py-3 px-4">{sale.bill_no}</td>
                    <td className="py-3 px-4">{sale.date ? format(new Date(sale.date), 'MM/dd HH:mm') : ''}</td>
                    <td className="py-3 px-4">{sale.items}</td>
                    <td className="py-3 px-4">{sale.customer_name}</td>
                    <td className="py-3 px-4">{sale.user_name}</td>
                    <td className="py-3 px-4 text-right">{formatCurrency(sale.total)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="py-4 px-4 text-center text-gray-500">
                    No sales found matching your search criteria
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Sale button (positioned at bottom right) */}
      <div className="fixed bottom-6 right-6">
        <Button
          variant="primary"
          onClick={handleAddSale}
          className="bg-blue-600 text-white py-2 px-6 rounded hover:bg-blue-700 transition-colors"
        >
          Add Sale
        </Button>
      </div>

      {/* Add Sale Modal */}
      {isAddSaleModalOpen && (
        <AddSaleModal
          isOpen={isAddSaleModalOpen}
          onClose={handleCloseModal}
          onSave={handleSaleSaved}
          currentSale={currentSale}
        />
      )}
    </div>
  );
};

export default Sales;