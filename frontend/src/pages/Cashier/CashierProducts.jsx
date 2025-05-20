import React, { useState, useEffect } from "react";
import Button from "../../components/UI/Button";
import SearchInput from "../../components/UI/SearchInput";
import API from "../../utils/api";
import { format } from "date-fns";

const CashierProducts = () => {
  // State management
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [categories, setCategories] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productDetails, setProductDetails] = useState([]);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isDetailsLoading, setIsDetailsLoading] = useState(false);

  // Fetch products data
  const fetchProducts = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await API.get("/inventory/products");
      
      const data = response.data?.data?.products || [];
      
      setProducts(data);
      setFilteredProducts(data);
      
      // Extract unique categories for the filter dropdown
      const uniqueCategories = [...new Set(data.map(item => item.category))];
      setCategories(uniqueCategories);
    } catch (err) {
      console.error("Error fetching products:", err);
      setError("Failed to load inventory data. Please try again later.");
      setProducts([]);
      setFilteredProducts([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Load inventory when component mounts
  useEffect(() => {
    fetchProducts();
  }, []);

  // Filter and search function that combines all filtering criteria
  const applyFilters = () => {
    if (!Array.isArray(products)) {
      setFilteredProducts([]);
      return;
    }

    let result = [...products];

    // Apply category filter
    if (categoryFilter !== "all") {
      result = result.filter(item => item.category === categoryFilter);
    }

    // Apply search query
    if (searchQuery && searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        item => 
          (item.name && item.name.toLowerCase().includes(query)) ||
          (item.product_code && item.product_code.toLowerCase().includes(query)) ||
          (item.category && item.category.toLowerCase().includes(query))
      );
    }

    setFilteredProducts(result);
  };

  // Run filters when any filtering criterion changes
  useEffect(() => {
    applyFilters();
  }, [products, searchQuery, categoryFilter]);

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleSearch = () => {
    applyFilters();
  };

  // Fetch product purchase details
  const fetchProductDetails = async (productId) => {
    setIsDetailsLoading(true);
    try {
      const response = await API.get(`/inventory/products/${productId}/purchases`);
      setProductDetails(response.data?.data?.purchases || []);
    } catch (err) {
      console.error("Error fetching product details:", err);
      setProductDetails([]);
    } finally {
      setIsDetailsLoading(false);
    }
  };

  // Open product details modal
  const handleViewDetails = (product) => {
    setSelectedProduct(product);
    fetchProductDetails(product.id);
    setIsDetailsModalOpen(true);
  };

  // Close product details modal
  const handleCloseDetailsModal = () => {
    setIsDetailsModalOpen(false);
    setSelectedProduct(null);
    setProductDetails([]);
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
        <h1 className="text-xl font-semibold">Inventory</h1>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-4">
        <div className="flex-grow">
          <SearchInput
            placeholder="Search by product code, name, category..."
            value={searchQuery}
            onChange={handleSearchChange}
            onSearch={handleSearch}
          />
        </div>

        {/* Category Filter */}
        <div className="w-48">
          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-md appearance-none"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="all">All Categories</option>
            {categories.map((category, index) => (
              <option key={index} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
          {error}
          <button
            className="ml-2 underline"
            onClick={fetchProducts}
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
        /* Inventory table */
        <div className="flex-1 overflow-auto mb-6 bg-white rounded-lg shadow">
          <table className="w-full border-collapse">
            <thead className="sticky top-0 bg-white">
              <tr className="border-b border-gray-200">
                <th className="py-3 px-4 text-left font-medium text-gray-700">Product Code</th>
                <th className="py-3 px-4 text-left font-medium text-gray-700">Name</th>
                <th className="py-3 px-4 text-left font-medium text-gray-700">Category</th>
                <th className="py-3 px-4 text-right font-medium text-gray-700">Remaining Qty</th>
                <th className="py-3 px-4 text-center font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.length > 0 ? (
                filteredProducts.map((product, index) => (
                  <tr
                    key={`${product.id || index}-${index}`}
                    className="border-b border-gray-200 hover:bg-gray-50"
                  >
                    <td className="py-3 px-4">{product.product_code || product.id}</td>
                    <td className="py-3 px-4 font-medium">{product.name}</td>
                    <td className="py-3 px-4">{product.category}</td>
                    <td className={`py-3 px-4 text-right font-medium ${
                      product.remaining_quantity === 0 ? 'text-red-600' : 
                      product.remaining_quantity < 5 ? 'text-orange-500' : 'text-green-600'
                    }`}>
                      {product.remaining_quantity}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleViewDetails(product)}
                        className="p-1 text-blue-600 hover:text-blue-800 transition-colors"
                        title="View Product Details"
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
                            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="py-4 px-4 text-center text-gray-500">
                    No inventory items found matching your search criteria
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Product Details Modal */}
      {isDetailsModalOpen && selectedProduct && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-screen overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">
                 {selectedProduct.name}
              </h2>
              <button
                onClick={handleCloseDetailsModal}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="mb-6 grid grid-cols-2 gap-4">
              <div>
                <p className="text-gray-600">Product Code:</p>
                <p className="font-medium">{selectedProduct.product_code || selectedProduct.id}</p>
              </div>
              <div>
                <p className="text-gray-600">Category:</p>
                <p className="font-medium">{selectedProduct.category}</p>
              </div>
              <div>
                <p className="text-gray-600">Total Remaining Quantity:</p>
                <p className="font-medium">{selectedProduct.remaining_quantity}</p>
              </div>
              <div>
                <p className="text-gray-600">Product Details:</p>
                <p className="font-medium">{selectedProduct.details || 'No details available'}</p>
              </div>
            </div>

            <h3 className="text-lg font-medium mb-4">Purchase History</h3>

            {isDetailsLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : productDetails.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="py-2 px-4 text-left font-medium text-gray-700">Purchase ID</th>
                      <th className="py-2 px-4 text-left font-medium text-gray-700">Date</th>
                      <th className="py-2 px-4 text-right font-medium text-gray-700">Quantity</th>
                      <th className="py-2 px-4 text-right font-medium text-gray-700">Remaining</th>
                      <th className="py-2 px-4 text-right font-medium text-gray-700">Buy Price</th>
                      <th className="py-2 px-4 text-right font-medium text-gray-700">Sell Price</th>
                      <th className="py-2 px-4 text-left font-medium text-gray-700">Warranty</th>
                    </tr>
                  </thead>
                  <tbody>
                    {productDetails.map((purchase, index) => (
                      <tr key={index} className="border-b border-gray-200 hover:bg-gray-50">
                        <td className="py-2 px-4">{purchase.purchase_id}</td>
                        <td className="py-2 px-4">
                          {purchase.date ? format(new Date(purchase.date), 'dd/MM/yyyy') : '-'}
                        </td>
                        <td className="py-2 px-4 text-right">{purchase.quantity}</td>
                        <td className={`py-2 px-4 text-right font-medium ${
                          purchase.remaining_quantity === 0 ? 'text-red-600' : 
                          purchase.remaining_quantity < 5 ? 'text-orange-500' : 'text-green-600'
                        }`}>
                          {purchase.remaining_quantity}
                        </td>
                        <td className="py-2 px-4 text-right">{formatCurrency(purchase.buying_price)}</td>
                        <td className="py-2 px-4 text-right">{formatCurrency(purchase.selling_price)}</td>
                        <td className="py-2 px-4">{purchase.warranty || 'No Warranty'}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50">
                    <tr>
                      <td colSpan="2" className="py-2 px-4 font-medium text-right">Total:</td>
                      <td className="py-2 px-4 text-right font-medium">
                        {productDetails.reduce((sum, purchase) => sum + purchase.quantity, 0)}
                      </td>
                      <td className="py-2 px-4 text-right font-medium">
                        {productDetails.reduce((sum, purchase) => sum + purchase.remaining_quantity, 0)}
                      </td>
                      <td colSpan="3"></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            ) : (
              <p className="text-center text-gray-500 py-4">No purchase history found for this product.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CashierProducts;

