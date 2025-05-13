import React, { useState, useEffect } from "react";
import axios from "axios";

const AddPurchaseModal = ({
  isOpen,
  onClose,
  onSave
}) => {
  const [formData, setFormData] = useState({
    product_id: '',
    quantity: '',
    warranty: '12 months',
    buying_price: '',
    selling_price: '',
    date: new Date().toISOString().split('T')[0]
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [supplierInfo, setSupplierInfo] = useState(null);

  // API configuration
  const API = axios.create({
    baseURL: 'http://localhost:5000',
    timeout: 10000,
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  });

  // Reset form and fetch products when modal opens
  useEffect(() => {
    if (isOpen) {
      resetForm();
      fetchProducts();
    }
  }, [isOpen]);

  const resetForm = () => {
    setFormData({
      product_id: '',
      quantity: '',
      warranty: '12 months',
      buying_price: '',
      selling_price: '',
      date: new Date().toISOString().split('T')[0]
    });
    setErrors({});
    setIsSubmitting(false);
    setSelectedProduct(null);
    setSearchTerm('');
    setSupplierInfo(null);
  };

  const fetchProducts = async () => {
    try {
      const response = await API.get('/products');
      const productsData = response.data?.data?.products || [];
      console.log("Fetched products:", productsData);
      setProducts(productsData);
      setFilteredProducts(productsData);
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  // MODIFIED: Enhanced product search handler
  const handleProductSearch = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    if (value.trim() === '') {
      setFilteredProducts(products);
    } else {
      const filtered = products.filter(product => 
        product.name?.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredProducts(filtered);
    }
    
    setShowDropdown(true);
  };

  // MODIFIED: Enhanced product selection handler
  const handleProductSelect = async (product) => {
    console.log("Selected product:", product);
    setSelectedProduct(product);
    setSearchTerm(product.name);
    
    // Make sure product_id is set correctly
    setFormData({
      ...formData,
      product_id: product.product_id
    });
    
    console.log("Updated form data with product_id:", product.product_id);
    
    setShowDropdown(false);
    
    // Fetch supplier info for the selected product
    try {
      const response = await API.get(`/suppliers/${product.supplier_id}`);
      setSupplierInfo(response.data?.data?.supplier || null);
    } catch (error) {
      console.error("Error fetching supplier info:", error);
    }
  };

  const validateField = (name, value) => {
    let error = "";
    switch (name) {
      case 'product_id':
        if (!value) {
          error = "Product is required";
        }
        break;
      case 'quantity':
        if (!value) {
          error = "Quantity is required";
        } else if (isNaN(value) || parseInt(value) <= 0) {
          error = "Quantity must be a positive number";
        }
        break;
      case 'buying_price':
        if (!value) {
          error = "Buying price is required";
        } else if (isNaN(value) || parseFloat(value) <= 0) {
          error = "Buying price must be a positive number";
        }
        break;
      case 'selling_price':
        if (!value) {
          error = "Selling price is required";
        } else if (isNaN(value) || parseFloat(value) <= 0) {
          error = "Selling price must be a positive number";
        } else if (parseFloat(value) <= parseFloat(formData.buying_price)) {
          error = "Selling price should be higher than buying price";
        }
        break;
      case 'date':
        if (!value) {
          error = "Date is required";
        }
        break;
      default:
        break;
    }
    
    setErrors(prev => ({
      ...prev,
      [name]: error
    }));
    
    return error === "";
  };

  const validateForm = () => {
    const productValid = validateField('product_id', formData.product_id);
    const quantityValid = validateField('quantity', formData.quantity);
    const buyingPriceValid = validateField('buying_price', formData.buying_price);
    const sellingPriceValid = validateField('selling_price', formData.selling_price);
    const dateValid = validateField('date', formData.date);
    
    return productValid && quantityValid && buyingPriceValid && sellingPriceValid && dateValid;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    if (Object.keys(errors).length > 0) {
      validateField(name, value);
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    validateField(name, value);
  };

  // MODIFIED: Enhanced form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    const isValid = validateForm();

    if (isValid) {
      try {
        setIsSubmitting(true);
        
        // Log data being submitted
        console.log("Submitting purchase form data:", formData);
        console.log("Selected product:", selectedProduct);
        
        const success = await onSave(formData);
        if (success) {
          onClose();
        } else {
          setErrors(prev => ({
            ...prev,
            general: "Failed to create purchase. Please try again."
          }));
        }
      } catch (error) {
        console.error("Error creating purchase:", error);
        setErrors(prev => ({
          ...prev,
          general: "Failed to create purchase. Please try again."
        }));
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-md p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">New Purchase</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            disabled={isSubmitting}
          >
            ✕
          </button>
        </div>
        
        <form onSubmit={handleSubmit} noValidate>
          {errors.general && (
            <div className="mb-4 p-2 bg-red-100 border border-red-400 text-red-700 rounded">
              {errors.general}
            </div>
          )}
          
          {/* Product Selection */}
          <div className="mb-4 relative">
            <label className="block text-gray-700 mb-2">
              Product <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={handleProductSearch}
              onFocus={() => setShowDropdown(true)}
              placeholder="Search for a product"
              className={`w-full px-3 py-2 border ${errors.product_id ? 'border-red-500' : 'border-gray-300'} rounded-md`}
              disabled={isSubmitting}
            />
            {errors.product_id && <p className="mt-1 text-sm text-red-500">{errors.product_id}</p>}
            
            {showDropdown && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                {filteredProducts.length > 0 ? (
                  filteredProducts.map((product) => (
                    <div
                      key={product.product_id}
                      className="px-4 py-2 cursor-pointer hover:bg-gray-100"
                      onClick={() => handleProductSelect(product)}
                    >
                      {product.name}
                    </div>
                  ))
                ) : (
                  <div className="px-4 py-2 text-gray-500">No products found</div>
                )}
              </div>
            )}
          </div>
          
          {/* Hidden product_id field for clarity */}
          <input 
            type="hidden" 
            name="product_id" 
            value={formData.product_id} 
          />
          
          {/* Supplier Info (Auto-filled) */}
          {selectedProduct && (
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Supplier</label>
              <input
                type="text"
                value={supplierInfo?.name || (selectedProduct ? `Supplier ID: ${selectedProduct.supplier_id}` : "Loading supplier info...")}
                className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md"
                disabled
              />
            </div>
          )}
          
          {/* Quantity */}
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">
              Quantity <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="quantity"
              value={formData.quantity}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Enter quantity"
              className={`w-full px-3 py-2 border ${errors.quantity ? 'border-red-500' : 'border-gray-300'} rounded-md`}
              min="1"
              required
              disabled={isSubmitting}
            />
            {errors.quantity && <p className="mt-1 text-sm text-red-500">{errors.quantity}</p>}
          </div>
          
          {/* Warranty */}
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Warranty</label>
            <select
              name="warranty"
              value={formData.warranty}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              disabled={isSubmitting}
            >
              <option value="No Warranty">No Warranty</option>
              <option value="3 months">3 months</option>
              <option value="6 months">6 months</option>
              <option value="12 months">12 months</option>
              <option value="24 months">24 months</option>
              <option value="36 months">36 months</option>
            </select>
          </div>
          
          {/* Buying Price */}
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">
              Buying Price (Rs.) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="buying_price"
              value={formData.buying_price}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Enter buying price"
              className={`w-full px-3 py-2 border ${errors.buying_price ? 'border-red-500' : 'border-gray-300'} rounded-md`}
              min="0"
              step="0.01"
              required
              disabled={isSubmitting}
            />
            {errors.buying_price && <p className="mt-1 text-sm text-red-500">{errors.buying_price}</p>}
          </div>
          
          {/* Selling Price */}
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">
              Selling Price (Rs.) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="selling_price"
              value={formData.selling_price}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Enter selling price"
              className={`w-full px-3 py-2 border ${errors.selling_price ? 'border-red-500' : 'border-gray-300'} rounded-md`}
              min="0"
              step="0.01"
              required
              disabled={isSubmitting}
            />
            {errors.selling_price && <p className="mt-1 text-sm text-red-500">{errors.selling_price}</p>}
          </div>
          
          {/* Purchase Date */}
          <div className="mb-6">
            <label className="block text-gray-700 mb-2">
              Purchase Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`w-full px-3 py-2 border ${errors.date ? 'border-red-500' : 'border-gray-300'} rounded-md`}
              required
              disabled={isSubmitting}
            />
            {errors.date && <p className="mt-1 text-sm text-red-500">{errors.date}</p>}
          </div>
          
          {/* Submit Button */}
          <button
            type="submit"
            className={`w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                Saving...
              </div>
            ) : (
              'Save Purchase'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddPurchaseModal;