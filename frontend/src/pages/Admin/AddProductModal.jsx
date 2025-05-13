import React, { useState, useEffect, useRef } from "react";

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
    supplier: "",
    details: ""
  });

  const [errors, setErrors] = useState({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [touchedFields, setTouchedFields] = useState({}); // Track modified fields
  const modalRef = useRef(null);

  // Reset form when modal opens/closes or when editing mode changes
  useEffect(() => {
    if (isOpen) {
      if (isEdit && currentProduct) {
        // Find the matching category name or ID - improved handling for edit mode
        let categoryValue = currentProduct.categoryId;
        
        // If categoryId is not available, try to find the category by name
        if (!categoryValue && currentProduct.category) {
          const matchingCategory = categories.find(cat => 
            cat.name === currentProduct.category
          );
          if (matchingCategory) {
            categoryValue = matchingCategory.id;
          }
        }
        
        // If in edit mode, populate form with current product data
        setFormData({
          title: currentProduct.title || "",
          category: categoryValue || "",
          supplier: currentProduct.supplierId || currentProduct.supplier || "",
          details: currentProduct.details || ""
        });
        
        console.log("Editing product:", {
          original: currentProduct,
          formData: {
            title: currentProduct.title || "",
            category: categoryValue || "",
            supplier: currentProduct.supplierId || currentProduct.supplier || "",
            details: currentProduct.details || ""
          }
        });
      } else {
        // If in add mode, reset form
        setFormData({
          title: "",
          category: "",
          supplier: "",
          details: ""
        });
      }
      setErrors({});
      setTouchedFields({}); // Reset touched fields tracker
      setIsSubmitted(false);
    }
  }, [isOpen, isEdit, currentProduct, categories]);

  // Handle click outside modal to close it
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    };

    // Only add the event listener if the modal is open
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

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

    // Mark this field as touched/modified
    setTouchedFields(prev => ({
      ...prev,
      [name]: true
    }));

    // If form was already submitted once, validate on change 
    // to give immediate feedback
    if (isSubmitted) {
      validateField(name, value);
    }
  };

  // Validate a specific field - With different rules for add vs edit mode
  const validateField = (name, value) => {
    let error = "";
    
    // In edit mode, we only validate fields that have been modified
    if (!isEdit || (isEdit && touchedFields[name])) {
      switch (name) {
        case 'title':
          if (!value || value.trim() === '') {
            error = "Product title is required";
          } else if (value.trim().length < 3) {
            error = "Product title must be at least 3 characters";
          }
          break;
          
        case 'category':
          if (!isEdit && (!value || value.trim() === '')) {
            error = "Category is required";
          }
          break;
          
        case 'supplier':
          if (!isEdit && (!value || value.trim() === '')) {
            error = "Supplier is required";
          }
          break;
          
        default:
          break;
      }
    }
    
    setErrors(prev => ({
      ...prev,
      [name]: error
    }));
    
    return error === "";
  };

  // Validate the form with different rules for add vs edit
  const validateForm = () => {
    // Always validate title
    const titleValid = validateField('title', formData.title);
    
    // For new products, validate all required fields
    if (!isEdit) {
      const categoryValid = validateField('category', formData.category);
      const supplierValid = validateField('supplier', formData.supplier);
      return titleValid && categoryValid && supplierValid;
    } else {
      // For editing, only validate the fields that were changed
      let isValid = titleValid;
      
      if (touchedFields.category) {
        isValid = isValid && validateField('category', formData.category);
      }
      
      if (touchedFields.supplier) {
        isValid = isValid && validateField('supplier', formData.supplier);
      }
      
      return isValid;
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Set form as submitted to show all errors
    setIsSubmitted(true);
    
    const isValid = validateForm();
    
    if (isValid) {
      // Create a deep copy of the form data to avoid mutation issues
      const submitData = JSON.parse(JSON.stringify(formData));
      
      // When editing, include info about which fields were actually modified
      if (isEdit) {
        submitData._touchedFields = touchedFields;
      }
      
      // Add logging to understand what's happening
      console.log("Form submission - Form data:", formData);
      console.log("Touched fields:", touchedFields);
      console.log("isEdit:", isEdit);
      console.log("currentProduct:", currentProduct);
      
      // Pass the data to the parent component's onSave handler
      onSave(submitData);
    }
  };

  // Handle blur event to show validation immediately when field loses focus
  const handleBlur = (e) => {
    const { name, value } = e.target;
    
    // Mark this field as touched when it loses focus
    setTouchedFields(prev => ({
      ...prev,
      [name]: true
    }));
    
    validateField(name, value);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-100 bg-opacity-50 flex items-center justify-center z-50">
      <div 
        ref={modalRef}
        className="bg-white rounded-md p-5 w-full max-w-md max-h-[90vh] overflow-y-auto animate-fadeIn"
      >
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
        
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {/* General error message */}
          {errors.submit && (
            <div className="mb-3 p-2 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
              {errors.submit}
            </div>
          )}
          
          {/* Product Title */}
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-1">
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
              
          {/* Category */}
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-1">
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
              
          {/* Supplier - Now showing both Name and Shop Name */}
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-1">
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
                <option key={supplier.id} value={supplier.id}>
                  {supplier.name}{supplier.shopName ? ` - ${supplier.shopName}` : ''}
                </option>
              ))}
            </select>
            {errors.supplier && (
              <p className="mt-1 text-xs text-red-500">{errors.supplier}</p>
            )}
          </div>
          
          {/* Product Details */}
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-1">
              Product Details
            </label>
            <textarea
              name="details"
              value={formData.details}
              onChange={handleChange}
              placeholder="Enter additional details about the product"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              rows={4}
              disabled={loading}
            />
          </div>
          
          {/* Submit Button */}
          <div className="mt-6">
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