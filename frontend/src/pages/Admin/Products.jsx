import React, { useState, useEffect } from "react";
import Button from "../../components/UI/Button";
import SearchInput from "../../components/UI/SearchInput";
import AddProductModal from "./AddProductModal";
import CategoriesManagement from "./CategoriesManagement";
import API from "../../utils/api"; // Import your configured API instance

const Products = () => {
  // State for product categories
  const [categories, setCategories] = useState(["All categories"]);
  
  // State for suppliers list
  const [suppliers, setSuppliers] = useState([]);
  
  // State for products data
  const [products, setProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("All categories");
  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);
  const [isEditProductModalOpen, setIsEditProductModalOpen] = useState(false);
  const [currentProduct, setCurrentProduct] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [showProductDetails, setShowProductDetails] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // API URL
  const API_URL = "/products";
  const SUPPLIERS_URL = "/suppliers";

  // Fetch product categories on component mount
  useEffect(() => {
    fetchCategories();
    fetchSuppliers();
  }, []);
  
  // Fetch products when selectedCategory or searchQuery changes
  useEffect(() => {
    fetchProducts();
  }, [selectedCategory]);
  
  // Fetch product categories - FIXED URL
  const fetchCategories = async () => {
    try {
      const response = await API.get(`${API_URL}/categories`); // Changed from /categories to ${API_URL}/categories
      const fetchedCategories = response.data?.data?.categories || ["All categories"];
      setCategories(fetchedCategories);
    } catch (err) {
      console.error("Error fetching categories:", err);
      setError("Failed to load categories. Please try again.");
    }
  };
  
  // Fetch suppliers
  const fetchSuppliers = async () => {
    try {
      const response = await API.get(SUPPLIERS_URL);
      const data = response.data?.data?.suppliers || [];
      
      // Extract supplier names for the dropdown
      const supplierNames = data.map(supplier => supplier.name);
      setSuppliers(supplierNames);
    } catch (err) {
      console.error("Error fetching suppliers:", err);
      // Fallback to sample suppliers if API fails
      setSuppliers([
        "Selix Computers",
        "Tech Distributors",
        "Global Electronics"
      ]);
    }
  };
  
  // Fetch products with optional category filter and search
  const fetchProducts = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      let url = API_URL;
      const params = [];
      
      if (searchQuery) {
        params.push(`search=${encodeURIComponent(searchQuery)}`);
      }
      
      if (selectedCategory && selectedCategory !== "All categories") {
        params.push(`category=${encodeURIComponent(selectedCategory)}`);
      }
      
      if (params.length > 0) {
        url += `?${params.join('&')}`;
      }
      
      const response = await API.get(url);
      const fetchedProducts = response.data?.data?.products || [];
      setProducts(fetchedProducts);
      setFilteredProducts(fetchedProducts);
    } catch (err) {
      console.error("Error fetching products:", err);
      setError("Failed to load products. Please try again.");
      setProducts([]);
      setFilteredProducts([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Function to perform the search filtering locally
  const performSearch = (query) => {
    if (!Array.isArray(products)) {
      setFilteredProducts([]);
      return;
    }

    if (!query || query.trim() === "") {
      setFilteredProducts([...products]);
    } else {
      const searchLower = query.toLowerCase();
      const filtered = products.filter(product => 
        (product.title && product.title.toLowerCase().includes(searchLower)) ||
        (product.id && product.id.toString().includes(query))
      );
      setFilteredProducts(filtered);
    }
  };

  // Apply search filter when searchQuery changes
  useEffect(() => {
    performSearch(searchQuery);
  }, [searchQuery, products]);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    // Search will be performed by the useEffect
  };

  const handleSearch = () => {
    // Explicitly perform search (for search button click)
    // For server-side search, you might want to call fetchProducts instead
    performSearch(searchQuery);
  };

  // Handler for adding a new product
  const handleSaveProduct = async (productData) => {
    // Validate data before submitting
    const errors = validateProductData(productData);
    
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }
    
    setIsSubmitting(true);
    try {
      const response = await API.post(API_URL, productData);
      
      // Add the new product to the local state
      let newProduct;
      if (response.data?.data?.product) {
        newProduct = response.data.data.product;
      } else if (response.data) {
        newProduct = response.data;
      }
      
      if (newProduct) {
        setProducts(prevProducts => [...prevProducts, newProduct]);
      }
      
      // Close modal and reset validation errors
      setIsAddProductModalOpen(false);
      setValidationErrors({});
    } catch (err) {
      console.error("Error adding product:", err);
      
      // Handle API error responses
      if (err.response?.data?.message) {
        setValidationErrors({
          submit: err.response.data.message
        });
      } else if (err.response?.data?.errors) {
        const apiErrors = err.response.data.errors;
        
        // Map API errors to form fields
        const fieldErrors = {};
        if (apiErrors.title) fieldErrors.title = apiErrors.title;
        if (apiErrors.category) fieldErrors.category = apiErrors.category;
        if (apiErrors.supplier) fieldErrors.supplier = apiErrors.supplier;
        
        if (Object.keys(fieldErrors).length > 0) {
          setValidationErrors(fieldErrors);
        } else {
          setValidationErrors({
            submit: "Failed to add product. Please try again."
          });
        }
      } else {
        setValidationErrors({
          submit: "Failed to add product. Please try again."
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditProduct = (product) => {
    setCurrentProduct(product);
    setValidationErrors({});
    setIsEditProductModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditProductModalOpen(false);
    setCurrentProduct(null);
    setValidationErrors({});
  };

  const handleUpdateProduct = async (updatedData) => {
    // Validate data before submitting
    const errors = validateProductData(updatedData);
    
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }
    
    setIsSubmitting(true);
    try {
      await API.patch(`${API_URL}/${currentProduct.id}`, updatedData);
      
      // Update local state
      const updatedProducts = products.map(product =>
        product.id === currentProduct.id
          ? { ...product, ...updatedData }
          : product
      );
      
      setProducts(updatedProducts);
      setIsEditProductModalOpen(false);
      setCurrentProduct(null);
      setValidationErrors({});
    } catch (err) {
      console.error("Error updating product:", err);
      
      // Handle API error responses
      if (err.response?.data?.message) {
        setValidationErrors({
          submit: err.response.data.message
        });
      } else if (err.response?.data?.errors) {
        const apiErrors = err.response.data.errors;
        
        // Map API errors to form fields
        const fieldErrors = {};
        if (apiErrors.title) fieldErrors.title = apiErrors.title;
        if (apiErrors.category) fieldErrors.category = apiErrors.category;
        if (apiErrors.supplier) fieldErrors.supplier = apiErrors.supplier;
        
        if (Object.keys(fieldErrors).length > 0) {
          setValidationErrors(fieldErrors);
        } else {
          setValidationErrors({
            submit: "Failed to update product. Please try again."
          });
        }
      } else {
        setValidationErrors({
          submit: "Failed to update product. Please try again."
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const validateProductData = (data) => {
    const errors = {};
    
    // Check for empty fields
    if (!data.title || data.title.trim() === "") {
      errors.title = "Product title is required";
    } else if (data.title.trim().length < 3) {
      errors.title = "Product title must be at least 3 characters";
    }
    
    if (!data.category || data.category.trim() === "") {
      errors.category = "Category is required";
    }
    
    if (!data.supplyPrice || data.supplyPrice.trim() === "") {
      errors.supplyPrice = "Supply price is required";
    } else if (isNaN(parseFloat(data.supplyPrice)) || parseFloat(data.supplyPrice) <= 0) {
      errors.supplyPrice = "Supply price must be a positive number";
    }
    
    if (!data.retailPrice || data.retailPrice.trim() === "") {
      errors.retailPrice = "Retail price is required";
    } else if (isNaN(parseFloat(data.retailPrice)) || parseFloat(data.retailPrice) <= 0) {
      errors.retailPrice = "Retail price must be a positive number";
    }
    
    if (!data.quantity || data.quantity.trim() === "") {
      errors.quantity = "Quantity is required";
    } else if (isNaN(parseInt(data.quantity)) || parseInt(data.quantity) < 0) {
      errors.quantity = "Quantity must be a non-negative number";
    }
    
    if (data.warranty && (isNaN(parseInt(data.warranty)) || parseInt(data.warranty) < 0)) {
      errors.warranty = "Warranty must be a non-negative number";
    }
    
    if (!data.supplier || data.supplier.trim() === "") {
      errors.supplier = "Supplier is required";
    }
    
    return errors;
  };

  const handleDeleteClick = (product) => {
    setProductToDelete(product);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (!productToDelete || !productToDelete.id) {
      setShowDeleteConfirm(false);
      return;
    }
    
    setIsSubmitting(true);
    try {
      await API.delete(`${API_URL}/${productToDelete.id}`);
      
      // Update local state
      const updatedProducts = products.filter(
        product => product.id !== productToDelete.id
      );
      setProducts(updatedProducts);
      setShowDeleteConfirm(false);
      setProductToDelete(null);
    } catch (err) {
      console.error("Error deleting product:", err);
      setError("Failed to delete product. It may be in use by other records.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
    setProductToDelete(null);
  };

  const handleViewDetails = (product) => {
    setSelectedProduct(product);
    setShowProductDetails(true);
  };

  const handleCloseDetails = () => {
    setShowProductDetails(false);
    setSelectedProduct(null);
  };

  // Category Management Functions - these will be passed to the CategoriesManagement component
  const handleAddCategory = async (categoryName) => {
    if (!categoryName || categoryName.trim() === '') {
      return false;
    }
    
    // Exclude "All categories" from the comparison
    const filteredCategories = categories.filter(cat => cat !== "All categories");
    
    if (filteredCategories.includes(categoryName)) {
      setError("Category already exists");
      return false;
    }
    
    setIsSubmitting(true);
    try {
      await API.post(`${API_URL}/categories`, { category: categoryName });
      setCategories([...categories, categoryName]);
      return true;
    } catch (err) {
      console.error("Error adding category:", err);
      setError(err.response?.data?.message || "Failed to add category");
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleUpdateCategory = async (oldCategory, newCategory) => {
    if (!newCategory || newCategory.trim() === '' || newCategory === oldCategory) {
      return false;
    }
    
    // Check if new category name already exists
    const filteredCategories = categories.filter(cat => cat !== "All categories");
    if (filteredCategories.includes(newCategory)) {
      setError("Category already exists");
      return false;
    }
    
    setIsSubmitting(true);
    try {
      await API.patch(`${API_URL}/categories`, { oldCategory, newCategory });
      
      const updatedCategories = categories.map(cat => 
        cat === oldCategory ? newCategory : cat
      );
      
      setCategories(updatedCategories);
      
      // If the selected category was edited, update the selection
      if (selectedCategory === oldCategory) {
        setSelectedCategory(newCategory);
      }
      
      return true;
    } catch (err) {
      console.error("Error updating category:", err);
      setError(err.response?.data?.message || "Failed to update category");
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleDeleteCategory = async (category) => {
    if (!category || category === "All categories") {
      return false;
    }
    
    setIsSubmitting(true);
    try {
      await API.delete(`${API_URL}/categories/${encodeURIComponent(category)}`);
      
      const updatedCategories = categories.filter(cat => cat !== category);
      setCategories(updatedCategories);
      
      // If the deleted category was selected, reset to "All categories"
      if (selectedCategory === category) {
        setSelectedCategory("All categories");
      }
      
      return true;
    } catch (err) {
      console.error("Error deleting category:", err);
      setError(err.response?.data?.message || "Failed to delete category");
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper function to display warranty text
  const getWarrantyText = (warranty) => {
    if (!warranty || warranty === 0) {
      return "No warranty";
    }
    return `${warranty} months`;
  };

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="mb-6">
        <h1 className="text-xl font-semibold mb-4">Products and Categories</h1>
        
        <div className="grid grid-cols-4 gap-6">
          {/* Left sidebar with categories management */}
          <div className="col-span-1">
            <CategoriesManagement 
              categories={categories}
              setCategories={setCategories}
              selectedCategory={selectedCategory}
              setSelectedCategory={setSelectedCategory}
              onAddCategory={handleAddCategory}
              onUpdateCategory={handleUpdateCategory}
              onDeleteCategory={handleDeleteCategory}
              isLoading={isSubmitting}
            />
          </div>
          
          {/* Right content with products table */}
          <div className="col-span-3">
            <div className="mb-4 flex items-center justify-between">
              <div className="w-1/2">
                <SearchInput 
                  placeholder="Search by name or ID" 
                  value={searchQuery}
                  onChange={handleSearchChange}
                  onSearch={handleSearch}
                />
              </div>
              <div>
                <Button 
                  variant="primary"
                  onClick={() => setIsAddProductModalOpen(true)}
                  disabled={isSubmitting}
                  className="bg-blue-600 text-white py-2 px-6 rounded hover:bg-blue-700 transition-colors"
                >
                  Add Product
                </Button>
              </div>
            </div>
            
            {/* Error message */}
            {error && (
              <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md flex justify-between items-center">
                <span>{error}</span>
                <button 
                  onClick={() => setError(null)}
                  className="text-red-700 font-bold"
                >
                  ×
                </button>
              </div>
            )}
            
            {/* Loading state */}
            {isLoading ? (
              <div className="flex-1 flex items-center justify-center py-10">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              /* Products table */
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="py-3 px-4 text-left">Product ID</th>
                      <th className="py-3 px-4 text-left">Title</th>
                      <th className="py-3 px-4 text-left">Quantity</th>
                      <th className="py-3 px-4 text-left">Supply Price</th>
                      <th className="py-3 px-4 text-left">Retail Price</th>
                      <th className="py-3 px-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.length > 0 ? (
                      filteredProducts.map((product) => (
                        <tr key={product.id} className="border-b border-gray-200 hover:bg-gray-50">
                          <td className="py-3 px-4">{product.id}</td>
                          <td className="py-3 px-4">{product.title}</td>
                          <td className="py-3 px-4">{product.quantity}</td>
                          <td className="py-3 px-4">{parseFloat(product.supplyPrice).toFixed(2)}</td>
                          <td className="py-3 px-4">{parseFloat(product.retailPrice).toFixed(2)}</td>
                          <td className="py-3 px-4 text-center">
                            <div className="flex justify-center space-x-2">
                              <button
                                onClick={() => handleViewDetails(product)}
                                className="p-1 text-gray-600 hover:text-gray-800"
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
                                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                  />
                                </svg>
                              </button>
                              <button
                                onClick={() => handleEditProduct(product)}
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
                                onClick={() => handleDeleteClick(product)}
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
                        <td colSpan="6" className="py-4 px-4 text-center text-gray-500">
                          No products found matching your search criteria
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Product Modal */}
      <AddProductModal
        isOpen={isAddProductModalOpen}
        onClose={() => setIsAddProductModalOpen(false)}
        onSave={handleSaveProduct}
        categories={categories.filter(cat => cat !== "All categories")}
        suppliers={suppliers}
        isEdit={false}
        validationErrors={validationErrors}
        loading={isSubmitting}
      />

      {/* Edit Product Modal */}
      {isEditProductModalOpen && (
        <AddProductModal
          isOpen={isEditProductModalOpen}
          onClose={handleCloseEditModal}
          onSave={handleUpdateProduct}
          categories={categories.filter(cat => cat !== "All categories")}
          suppliers={suppliers}
          isEdit={true}
          currentProduct={currentProduct}
          validationErrors={validationErrors}
          loading={isSubmitting}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-md p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">Confirm Delete</h2>
            <p className="mb-6">
              Are you sure you want to delete product "{productToDelete?.title}"? 
              This action cannot be undone.
            </p>
            
            {error && (
              <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">
                {error}
              </div>
            )}
            
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

      {/* Product Details Modal */}
      {showProductDetails && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-md p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Product Details</h2>
              <button
                onClick={handleCloseDetails}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div className="text-gray-600">Product ID:</div>
                <div className="font-medium">{selectedProduct.id}</div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="text-gray-600">Title:</div>
                <div className="font-medium">{selectedProduct.title}</div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="text-gray-600">Category:</div>
                <div className="font-medium">{selectedProduct.category}</div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="text-gray-600">Quantity:</div>
                <div className="font-medium">{selectedProduct.quantity}</div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="text-gray-600">Supply Price:</div>
                <div className="font-medium">Rs. {parseFloat(selectedProduct.supplyPrice).toFixed(2)}</div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="text-gray-600">Retail Price:</div>
                <div className="font-medium">Rs. {parseFloat(selectedProduct.retailPrice).toFixed(2)}</div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="text-gray-600">Warranty:</div>
                <div className="font-medium">{getWarrantyText(selectedProduct.warranty)}</div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="text-gray-600">Supplier:</div>
                <div className="font-medium">{selectedProduct.supplier}</div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="text-gray-600">Profit Margin:</div>
                <div className="font-medium">
                  {(((parseFloat(selectedProduct.retailPrice) - parseFloat(selectedProduct.supplyPrice)) / parseFloat(selectedProduct.supplyPrice)) * 100).toFixed(2)}%
                </div>
              </div>
            </div>
            <div className="mt-6">
              <button
                onClick={handleCloseDetails}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;