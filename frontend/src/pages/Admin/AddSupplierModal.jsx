import React, { useState, useEffect } from "react";

const AddSupplierModal = ({
  isOpen,
  onClose,
  validationErrors,
  onSave,
  loading = false
}) => {
  const [formData, setFormData] = useState({
    name: '',
    shop_name: '',
    phone: '',
    email: '',
    address: ''
  });

  const [errors, setErrors] = useState({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: '',
        shop_name: '',
        phone: '',
        email: '',
        address: ''
      });
      setErrors({});
      setIsSubmitted(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (validationErrors) {
      setErrors(prev => ({ ...prev, ...validationErrors }));
    }
  }, [validationErrors]);

  useEffect(() => {
    setIsLoading(loading);
  }, [loading]);

  const validateMobileNumber = (phone) => {
    if (!phone || phone.trim() === '') {
      return "Phone number is required";
    }
    const cleanPhone = phone.replace(/\s+/g, '');
    const localPattern = /^07[0-9]{8}$/;
    const intlPattern = /^\+947[0-9]{8}$/;
    if (localPattern.test(cleanPhone) || intlPattern.test(cleanPhone)) {
      return "";
    } else {
      return "Please enter a valid Sri Lankan mobile number (e.g., 071 1234567)";
    }
  };

  const validateEmail = (email) => {
    if (!email || email.trim() === '') {
      return "Email is required";
    }
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (emailPattern.test(email)) {
      return "";
    } else {
      return "Please enter a valid email address";
    }
  };

  const validateField = (name, value) => {
    let error = "";
    switch (name) {
      case 'name':
        if (!value || value.trim() === '') {
          error = "Supplier name is required";
        } else if (value.trim().length < 3) {
          error = "Supplier name must be at least 3 characters";
        }
        break;
      case 'shop_name':
        if (!value || value.trim() === '') {
          error = "Shop name is required";
        }
        break;
      case 'phone':
        error = validateMobileNumber(value);
        break;
      case 'email':
        error = validateEmail(value);
        break;
      case 'address':
        if (!value || value.trim() === '') {
          error = "Address is required";
        } else if (value.trim().length < 5) {
          error = "Please enter a complete address";
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
    const nameValid = validateField('name', formData.name);
    const shopNameValid = validateField('shop_name', formData.shop_name);
    const phoneValid = validateField('phone', formData.phone);
    const emailValid = validateField('email', formData.email);
    const addressValid = validateField('address', formData.address);
    return nameValid && shopNameValid && phoneValid && emailValid && addressValid;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    if (isSubmitted) {
      validateField(name, value);
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    validateField(name, value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitted(true);
    const isValid = validateForm();

    if (isValid) {
      try {
        setIsLoading(true);
        // Pass the data to the parent component's onSave handler
        onSave(formData);
        // Don't close the modal here - let the parent component do it after successful API call
      } catch (error) {
        console.error("Error creating supplier:", error);
        if (error.response && error.response.data) {
          const apiErrors = error.response.data;
          if (apiErrors.message) {
            setErrors(prev => ({
              ...prev,
              general: apiErrors.message
            }));
          }
        } else {
          setErrors(prev => ({
            ...prev,
            general: "Failed to create supplier. Please try again."
          }));
        }
      } finally {
        setIsLoading(false);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">New Supplier</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
            disabled={isLoading}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} noValidate>
          {errors.general && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md">
              {errors.general}
            </div>
          )}
          
          {/* Name */}
          <div className="mb-4">
            <label className="block text-gray-700 font-medium mb-2" htmlFor="name">
              Supplier Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Enter supplier name"
              className={`w-full px-3 py-2 border ${errors.name ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500`}
              required
              disabled={isLoading}
            />
            {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
          </div>
          
          {/* Shop Name */}
          <div className="mb-4">
            <label className="block text-gray-700 font-medium mb-2" htmlFor="shop_name">
              Shop Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="shop_name"
              name="shop_name"
              value={formData.shop_name}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Enter shop name"
              className={`w-full px-3 py-2 border ${errors.shop_name ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500`}
              required
              disabled={isLoading}
            />
            {errors.shop_name && <p className="mt-1 text-sm text-red-500">{errors.shop_name}</p>}
          </div>
          
          {/* Phone */}
          <div className="mb-4">
            <label className="block text-gray-700 font-medium mb-2" htmlFor="phone">
              Mobile Number <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Enter supplier contact number (e.g., 071 1234567)"
              className={`w-full px-3 py-2 border ${errors.phone ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500`}
              required
              disabled={isLoading}
            />
            {errors.phone && <p className="mt-1 text-sm text-red-500">{errors.phone}</p>}
          </div>
          
          {/* Email */}
          <div className="mb-4">
            <label className="block text-gray-700 font-medium mb-2" htmlFor="email">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Enter supplier Email"
              className={`w-full px-3 py-2 border ${errors.email ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${formData.email && formData.email.length > 25 ? 'text-sm' : ''}`}
              required
              disabled={isLoading}
            />
            {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email}</p>}
          </div>
          
          {/* Address */}
          <div className="mb-6">
            <label className="block text-gray-700 font-medium mb-2" htmlFor="address">
              Address <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Enter supplier Address"
              className={`w-full px-3 py-2 border ${errors.address ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${formData.address && formData.address.length > 30 ? 'text-sm' : ''}`}
              required
              disabled={isLoading}
            />
            {errors.address && <p className="mt-1 text-sm text-red-500">{errors.address}</p>}
          </div>
          
          {/* Submit Button */}
          <button
            type="submit"
            className={`w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors shadow-md ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                Saving...
              </div>
            ) : (
              'Save'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddSupplierModal;