import React, { useState, useEffect } from "react";
import Button from "../../components/UI/Button";
import SearchInput from "../../components/UI/SearchInput";
import AddProductModal from "./AddProductModal";
import CategoriesManagement from "./CategoriesManagement";
import API from "../../utils/api"; // Import your configured API instance

const Products = () => {
  // State for product categories
  const [categories, setCategories] = useState([{ id: 'all', name: 'All categories' }]);
  
  // State for suppliers list
  const [suppliers, setSuppliers] = useState([]);
  
  // State for products data
  const [products, setProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState({ id: 'all', name: 'All categories' });
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
  
  // Fetch product categories
  const fetchCategories = async () => {
    try {
      const response = await API.get(`${API_URL}/categories/all`);
      const fetchedCategories = response.data?.data?.categories || [{ id: 'all', name: 'All categories' }];
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
      
      // Extract supplier data for the dropdown
      const supplierData = data.map(supplier => ({
        id: supplier.id,
        name: supplier.name,
        shopName: supplier.shop_name || supplier.shopName || "" // Handle both formats
      }));
      
      setSuppliers(supplierData);
    } catch (err) {
      console.error("Error fetching suppliers:", err);
      // Fallback to sample suppliers if API fails
      setSuppliers([
        { id: 1, name: "Selix Computers", shopName: "Tech Store" },
        { id: 2, name: "Tech Distributors", shopName: "Distribution Inc" },
        { id: 3, name: "Global Electronics", shopName: "Global Tech" }
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
      
      if (selectedCategory && selectedCategory.id !== 'all') {
        params.push(`categoryId=${encodeURIComponent(selectedCategory.id)}`);
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
    performSearch(searchQuery);
  };

  // Category Management Functions
  const handleAddCategory = async (categoryName) => {
    if (!categoryName || categoryName.trim() === '') {
      return false;
    }
    
    // Check if category already exists
    const categoryExists = categories.some(cat => 
      cat.name.toLowerCase() === categoryName.toLowerCase()
    );
    
    if (categoryExists) {
      setError("Category already exists");
      return false;
    }
    
    setIsSubmitting(true);
    try {
      const response = await API.post(`${API_URL}/categories/add`, { category: categoryName });
      
      // Get the new category from the response
      const newCategory = response.data?.data?.category;
      
      // Update categories state
      setCategories(prevCategories => [...prevCategories, newCategory]);
      return true;
    } catch (err) {
      console.error("Error adding category:", err);
      setError(err.response?.data?.message || "Failed to add category");
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleUpdateCategory = async (categoryId, newCategoryName) => {
    if (!newCategoryName || newCategoryName.trim() === '') {
      return false;
    }
    
    // Find the category to update
    const categoryToUpdate = categories.find(cat => cat.id === categoryId);
    if (!categoryToUpdate) {
      setError("Category not found");
      return false;
    }
    
    // Check if new name already exists
    const categoryExists = categories.some(cat => 
      cat.id !== categoryId && cat.name.toLowerCase() === newCategoryName.toLowerCase()
    );
    
    if (categoryExists) {
      setError("Category with this name already exists");
      return false;
    }
    
    setIsSubmitting(true);
    try {
      const response = await API.patch(`${API_URL}/categories/update`, {
        oldCategory: categoryToUpdate.name,
        newCategory: newCategoryName
      });
      
      // Get the updated category info
      const updatedCategory = response.data?.data?.category;
      
      // Update the categories state
      setCategories(prevCategories => prevCategories.map(cat => 
        cat.id === categoryId ? { ...cat, name: newCategoryName } : cat
      ));
      
      // If the selected category was updated, update the selection
      if (selectedCategory.id === categoryId) {
        setSelectedCategory(prev => ({ ...prev, name: newCategoryName }));
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
  
  const handleDeleteCategory = async (categoryId) => {
    // Find the category name for the API call
    const categoryToDelete = categories.find(cat => cat.id === categoryId);
    
    if (!categoryToDelete || categoryToDelete.id === 'all') {
      return false;
    }
    
    setIsSubmitting(true);
    try {
      await API.delete(`${API_URL}/categories/delete/${encodeURIComponent(categoryToDelete.name)}`);
      
      // Update the categories state
      setCategories(prevCategories => prevCategories.filter(cat => cat.id !== categoryId));
      
      // If the deleted category was selected, reset to "All categories"
      if (selectedCategory.id === categoryId) {
        setSelectedCategory({ id: 'all', name: 'All categories' });
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
      handleApiValidationErrors(err);
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

  // Updated handleUpdateProduct to support partial updates
  const handleUpdateProduct = async (updatedData) => {
    // Create a deep copy of the data to avoid mutation issues
    const formattedData = JSON.parse(JSON.stringify(updatedData));
    
    // Get the touched fields from the form data
    const touchedFields = formattedData._touchedFields || {};
    delete formattedData._touchedFields;
    
    // Log the update data before processing
    console.log("Update starting data:", { 
      updateData: formattedData, 
      touchedFields: touchedFields,
      currentProduct: currentProduct 
    });
    
    // Create a patch object that only includes fields that have been modified
    const patchData = {};
    
    // Only include fields that are different from the current product and have been touched
    if (touchedFields.title && formattedData.title !== currentProduct.title) {
      patchData.title = formattedData.title;
    }
    
    if (touchedFields.category && formattedData.category !== currentProduct.categoryId) {
      patchData.category = formattedData.category;
    }
    
    if (touchedFields.supplier && formattedData.supplier !== currentProduct.supplierId) {
      patchData.supplier = formattedData.supplier;
    }
    
    // Only include details if it was modified
    if (touchedFields.details && formattedData.details !== currentProduct.details) {
      patchData.details = formattedData.details;
    }
    
    // Clean up data - remove any undefined or null values
    Object.keys(patchData).forEach(key => {
      if (patchData[key] === undefined || patchData[key] === null) {
        delete patchData[key];
      }
    });
    
    // Only proceed if there are actually changes to update
    if (Object.keys(patchData).length === 0) {
      console.log("No changes detected, skipping update");
      // Close modal and reset state since there's nothing to update
      setIsEditProductModalOpen(false);
      setCurrentProduct(null);
      setValidationErrors({});
      return;
    }
    
    // Log the final data being sent to the API
    console.log("Sending patch data to API:", patchData);
    
    setIsSubmitting(true);
    try {
      // Send the update request with only the changed fields
      const response = await API.patch(`${API_URL}/${currentProduct.id}`, patchData);
      console.log("Update response:", response.data);
      
      // Refresh products to get updated data
      fetchProducts();
      
      // Close modal and reset state
      setIsEditProductModalOpen(false);
      setCurrentProduct(null);
      setValidationErrors({});
    } catch (err) {
      console.error("Error updating product:", err);
      handleApiValidationErrors(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Simplified to only validate title, category, and supplier
  const validateProductData = (data) => {
    const errors = {};
    
    // Check for empty fields (only title, category, and supplier are required)
    if (!data.title || data.title.trim() === "") {
      errors.title = "Product title is required";
    } else if (data.title.trim().length < 3) {
      errors.title = "Product title must be at least 3 characters";
    }
    
    if (!data.category) {
      errors.category = "Category is required";
    }
    
    if (!data.supplier) {
      errors.supplier = "Supplier is required";
    }
    
    return errors;
  };

  const handleApiValidationErrors = (err) => {
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
          submit: "Failed to process product. Please try again."
        });
      }
    } else {
      setValidationErrors({
        submit: "Failed to process product. Please try again."
      });
    }
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
                      <th className="py-3 px-4 text-left">Product Name</th>
                      <th className="py-3 px-4 text-left">Category</th>
                      <th className="py-3 px-4 text-left">Supplier</th>
                      <th className="py-3 px-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.length > 0 ? (
                      filteredProducts.map((product) => (
                        <tr key={product.id} className="border-b border-gray-200 hover:bg-gray-50">
                          <td className="py-3 px-4">{product.id}</td>
                          <td className="py-3 px-4">{product.title}</td>
                          <td className="py-3 px-4">{product.category}</td>
                          <td className="py-3 px-4">
                            {product.supplier}
                            {product.shopName && ` - ${product.shopName}`}
                          </td>
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
                        <td colSpan="5" className="py-4 px-4 text-center text-gray-500">
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
        categories={categories.filter(cat => cat.id !== 'all')}
        suppliers={suppliers}
        isEdit={false}
        validationErrors={validationErrors}
        loading={isSubmitting}
      />

      {/* Edit Product Modal */}
      {isEditProductModalOpen && currentProduct && (
        <AddProductModal
          isOpen={isEditProductModalOpen}
          onClose={handleCloseEditModal}
          onSave={handleUpdateProduct}
          categories={categories.filter(cat => cat.id !== 'all')}
          suppliers={suppliers}
          isEdit={true}
          currentProduct={currentProduct}
          validationErrors={validationErrors}
          loading={isSubmitting}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && productToDelete && (
        <div className="fixed inset-0 bg-gray-100 bg-opacity-50 flex items-center justify-center z-50">
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
                className={`px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors ${
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
      {showProductDetails && selectedProduct && (
        <div className="fixed inset-0 bg-gray-100 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-md p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
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
                <div className="text-gray-600">Product Name:</div>
                <div className="font-medium">{selectedProduct.title}</div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="text-gray-600">Category:</div>
                <div className="font-medium">{selectedProduct.category}</div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="text-gray-600">Supplier:</div>
                <div className="font-medium">
                  {selectedProduct.supplier}
                  {selectedProduct.shopName && ` - ${selectedProduct.shopName}`}
                </div>
              </div>
              
              {/* Product Details Section */}
              {selectedProduct.details && (
                <div className="mt-4">
                  <div className="text-gray-600 mb-1">Details:</div>
                  <div className="bg-gray-50 p-3 rounded text-sm">
                    {selectedProduct.details}
                  </div>
                </div>
              )}
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