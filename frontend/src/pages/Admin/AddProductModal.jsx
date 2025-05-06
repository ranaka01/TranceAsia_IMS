import React, { useState, useEffect } from "react";

const AddProductModal = ({ 
  isOpen, 
  onClose, 
  onSave, 
  categories, 
  suppliers, 
  isEdit = false, 
  currentProduct = null,
  validationErrors = {},
  loading = false
}) => {
  const [formData, setFormData] = useState({
    title: "",
    category: "",
    supplyPrice: "",
    retailPrice: "",
    quantity: "",
    warranty: "",
    supplier: ""
  });

  const [errors, setErrors] = useState({});
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Reset form when modal opens/closes or when editing mode changes
  useEffect(() => {
    if (isOpen) {
      if (isEdit && currentProduct) {
        // If in edit mode, populate form with current product data
        setFormData({
          title: currentProduct.title || "",
          category: currentProduct.categoryId || "",
          supplyPrice: currentProduct.supplyPrice?.toString() || "",
          retailPrice: currentProduct.retailPrice?.toString() || "",
          quantity: currentProduct.quantity?.toString() || "",
          warranty: currentProduct.warranty?.toString() || "",
          supplier: currentProduct.supplier || ""
        });
      } else {
        // If in add mode, reset form
        setFormData({
          title: "",
          category: "",
          supplyPrice: "",
          retailPrice: "",
          quantity: "",
          warranty: "",
          supplier: ""
        });
      }
      setErrors({});
      setIsSubmitted(false);
    }
  }, [isOpen, isEdit, currentProduct]);

  // Update local errors when validation errors props change
  useEffect(() => {
    if (Object.keys(validationErrors).length > 0) {
      setErrors(prev => ({ ...prev, ...validationErrors }));
    }
  }, [validationErrors]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });

    // If form was already submitted once, validate on change 
    // to give immediate feedback
    if (isSubmitted) {
      validateField(name, value);
    }
  };

  // Validate a specific field
  const validateField = (name, value) => {
    let error = "";
    
    switch (name) {
      case 'title':
        if (!value || value.trim() === '') {
          error = "Product title is required";
        } else if (value.trim().length < 3) {
          error = "Product title must be at least 3 characters";
        }
        break;
        
      case 'category':
        if (!value || value.trim() === '') {
          error = "Category is required";
        }
        break;
        
      case 'supplyPrice':
        if (!value || value.trim() === '') {
          error = "Supply price is required";
        } else if (isNaN(parseFloat(value)) || parseFloat(value) <= 0) {
          error = "Supply price must be a positive number";
        }
        break;
        
      case 'retailPrice':
        if (!value || value.trim() === '') {
          error = "Retail price is required";
        } else if (isNaN(parseFloat(value)) || parseFloat(value) <= 0) {
          error = "Retail price must be a positive number";
        }
        break;
        
      case 'quantity':
        if (!value || value.trim() === '') {
          error = "Quantity is required";
        } else if (isNaN(parseInt(value)) || parseInt(value) < 0) {
          error = "Quantity must be a non-negative number";
        }
        break;
        
      case 'warranty':
        if (value && (isNaN(parseInt(value)) || parseInt(value) < 0)) {
          error = "Warranty must be a non-negative number";
        }
        break;
        
      case 'supplier':
        if (!value || value.trim() === '') {
          error = "Supplier is required";
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
    // Validate all required fields
    const titleValid = validateField('title', formData.title);
    const categoryValid = validateField('category', formData.category);
    const supplyPriceValid = validateField('supplyPrice', formData.supplyPrice);
    const retailPriceValid = validateField('retailPrice', formData.retailPrice);
    const quantityValid = validateField('quantity', formData.quantity);
    const warrantyValid = validateField('warranty', formData.warranty);
    const supplierValid = validateField('supplier', formData.supplier);
    
    return titleValid && categoryValid && supplyPriceValid && 
           retailPriceValid && quantityValid && warrantyValid && supplierValid;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Set form as submitted to show all errors
    setIsSubmitted(true);
    
    const isValid = validateForm();
    
    if (isValid) {
      // Pass the data to the parent component's onSave handler
      onSave(formData);
    }
  };

  // Handle blur event to show validation immediately when field loses focus
  const handleBlur = (e) => {
    const { name, value } = e.target;
    validateField(name, value);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-md p-5 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-semibold">{isEdit ? "Edit Product" : "Add Product"}</h2>
          <button 
            onClick={onClose} 
            className="text-gray-500 hover:text-gray-700"
            disabled={loading}
          >
            ✕
          </button>
        </div>
        
        <form onSubmit={handleSubmit} noValidate className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2">
          {/* General error message */}
          {errors.submit && (
            <div className="col-span-1 md:col-span-2 mb-3 p-2 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
              {errors.submit}
            </div>
          )}
          
          {/* Left Column */}
          <div className="space-y-2">
            {/* Product Title */}
            <div>
              <label className="block text-gray-700 text-sm mb-1">
                Product Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Enter product title"
                className={`w-full px-3 py-2 border ${errors.title ? 'border-red-500' : 'border-gray-300'} rounded-md text-sm`}
                required
                disabled={loading}
              />
              {errors.title && (
                <p className="mt-1 text-xs text-red-500">{errors.title}</p>
              )}
            </div>
            
            {/* Category - Updated to work with category objects */}
            <div>
              <label className="block text-gray-700 text-sm mb-1">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`w-full px-3 py-2 border ${errors.category ? 'border-red-500' : 'border-gray-300'} rounded-md text-sm appearance-none`}
                required
                disabled={loading}
              >
                <option value="" disabled>Select category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              {errors.category && (
                <p className="mt-1 text-xs text-red-500">{errors.category}</p>
              )}
            </div>
            
            {/* Supply Price */}
            <div>
              <label className="block text-gray-700 text-sm mb-1">
                Supply Price <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="supplyPrice"
                value={formData.supplyPrice}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Enter supply price"
                className={`w-full px-3 py-2 border ${errors.supplyPrice ? 'border-red-500' : 'border-gray-300'} rounded-md text-sm`}
                min="0"
                step="0.01"
                required
                disabled={loading}
              />
              {errors.supplyPrice && (
                <p className="mt-1 text-xs text-red-500">{errors.supplyPrice}</p>
              )}
            </div>
            
            {/* Retail Price */}
            <div>
              <label className="block text-gray-700 text-sm mb-1">
                Retail Price <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="retailPrice"
                value={formData.retailPrice}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Enter retail price"
                className={`w-full px-3 py-2 border ${errors.retailPrice ? 'border-red-500' : 'border-gray-300'} rounded-md text-sm`}
                min="0"
                step="0.01"
                required
                disabled={loading}
              />
              {errors.retailPrice && (
                <p className="mt-1 text-xs text-red-500">{errors.retailPrice}</p>
              )}
            </div>
          </div>
          
          {/* Right Column */}
          <div className="space-y-2">
            {/* Quantity */}
            <div>
              <label className="block text-gray-700 text-sm mb-1">
                Quantity <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="quantity"
                value={formData.quantity}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Enter quantity"
                className={`w-full px-3 py-2 border ${errors.quantity ? 'border-red-500' : 'border-gray-300'} rounded-md text-sm`}
                min="0"
                required
                disabled={loading}
              />
              {errors.quantity && (
                <p className="mt-1 text-xs text-red-500">{errors.quantity}</p>
              )}
            </div>
            
            {/* Warranty */}
            <div>
              <label className="block text-gray-700 text-sm mb-1">
                Warranty
              </label>
              <input
                type="number"
                name="warranty"
                value={formData.warranty}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Period in months"
                className={`w-full px-3 py-2 border ${errors.warranty ? 'border-red-500' : 'border-gray-300'} rounded-md text-sm`}
                min="0"
                disabled={loading}
              />
              {errors.warranty && (
                <p className="mt-1 text-xs text-red-500">{errors.warranty}</p>
              )}
            </div>
            
            {/* Supplier - Updated for supplier objects */}
            <div>
              <label className="block text-gray-700 text-sm mb-1">
                Supplier <span className="text-red-500">*</span>
              </label>
              <select
                name="supplier"
                value={formData.supplier}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`w-full px-3 py-2 border ${errors.supplier ? 'border-red-500' : 'border-gray-300'} rounded-md text-sm appearance-none`}
                required
                disabled={loading}
              >
                <option value="" disabled>Select supplier</option>
                {suppliers.map((supplier) => (
                  <option key={supplier.id} value={supplier.name}>
                    {supplier.name}
                  </option>
                ))}
              </select>
              {errors.supplier && (
                <p className="mt-1 text-xs text-red-500">{errors.supplier}</p>
              )}
            </div>
          </div>
          
          {/* Submit Button - Full Width */}
          <div className="col-span-1 md:col-span-2 mt-4">
            <button
              type="submit"
              className={`w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                  {isEdit ? "Updating..." : "Saving..."}
                </div>
              ) : (
                isEdit ? "Update" : "Save"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddProductModal;