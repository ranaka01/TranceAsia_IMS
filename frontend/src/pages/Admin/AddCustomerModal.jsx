import React, { useState, useEffect } from "react";

const AddCustomerModal = ({ isOpen, onClose, onSave, validationErrors }) => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: ''
  });

  // State for errors
  const [errors, setErrors] = useState({});
  // State to track if form has been submitted
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      // Reset form data, errors, and submission state when modal opens
      setFormData({
        name: '',
        phone: '',
        email: ''
      });
      setErrors({});
      setIsSubmitted(false);
    }
  }, [isOpen]);

  // Update errors when external validation errors change
  useEffect(() => {
    if (validationErrors) {
      setErrors(prev => ({ ...prev, ...validationErrors }));
    }
  }, [validationErrors]);

  // Validate mobile number function
  const validateMobileNumber = (phone) => {
    if (!phone || phone.trim() === '') {
      return "Phone number is required";
    }
    
    // Remove spaces for validation
    const cleanPhone = phone.replace(/\s+/g, '');
    
    // Sri Lankan mobile numbers:
    // 1. Start with '07' followed by 8 more digits
    // 2. Or international format +94 7X XXXXXXX
    const localPattern = /^07[0-9]{8}$/;
    const intlPattern = /^\+947[0-9]{8}$/;
    
    if (localPattern.test(cleanPhone) || intlPattern.test(cleanPhone)) {
      return "";
    } else {
      return "Please enter a valid Sri Lankan mobile number (e.g., 071 1234567)";
    }
  };

  // Validate email function
  const validateEmail = (email) => {
    if (!email || email.trim() === '') {
      return "";  // Email is optional for customers
    }
    
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (emailPattern.test(email)) {
      return "";
    } else {
      return "Please enter a valid email address";
    }
  };

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
      case 'name':
        if (!value || value.trim() === '') {
          error = "Customer name is required";
        } else if (value.trim().length < 3) {
          error = "Customer name must be at least 3 characters";
        }
        break;
        
      case 'phone':
        error = validateMobileNumber(value);
        break;
        
      case 'email':
        error = validateEmail(value);
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

  // Validate all fields
  const validateForm = () => {
    const nameValid = validateField('name', formData.name);
    const phoneValid = validateField('phone', formData.phone);
    const emailValid = validateField('email', formData.email);
    // Address is optional, so we don't validate it
    
    return nameValid && phoneValid && emailValid;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Set form as submitted to show all errors
    setIsSubmitted(true);
    
    // Validate all fields
    const nameValid = validateField('name', formData.name);
    const phoneValid = validateField('phone', formData.phone);
    const emailValid = validateField('email', formData.email);
    
    const isValid = nameValid && phoneValid && emailValid;
    
    if (isValid) {
      onSave(formData);
      // Reset form
      setFormData({
        name: '',
        phone: '',
        email: ''
      });
      setErrors({});
      setIsSubmitted(false);
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
      <div className="bg-white rounded-md p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">New Customer</h2>
          <button 
            onClick={onClose} 
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>
        
        <form onSubmit={handleSubmit} noValidate>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">
              Customer Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Enter customer name"
              className={`w-full px-3 py-2 border ${errors.name ? 'border-red-500' : 'border-gray-300'} rounded-md`}
              required
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-500">{errors.name}</p>
            )}
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">
              Mobile Number <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Enter customer mobile number (e.g., 071 1234567)"
              className={`w-full px-3 py-2 border ${errors.phone ? 'border-red-500' : 'border-gray-300'} rounded-md`}
              required
            />
            {errors.phone && (
              <p className="mt-1 text-sm text-red-500">{errors.phone}</p>
            )}
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Enter customer email (optional)"
              className={`w-full px-3 py-2 border ${errors.email ? 'border-red-500' : 'border-gray-300'} rounded-md`}
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-500">{errors.email}</p>
            )}
          </div>
          

          
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
          >
            Save
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddCustomerModal;