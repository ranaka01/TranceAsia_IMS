import React, { useState, useEffect } from "react";
import API from "../../utils/api";

const AddSupplierModal = ({
  isOpen,
  onClose,
  categories,
  validationErrors,
  onSave, // Make sure this prop is correctly used
  loading = false
}) => {
  const [formData, setFormData] = useState({
    name: '',
    category: '',
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
        category: '',
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
      case 'category':
        if (!value || value.trim() === '') {
          error = "Category is required";
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
    const categoryValid = validateField('category', formData.category);
    const phoneValid = validateField('phone', formData.phone);
    const emailValid = validateField('email', formData.email);
    const addressValid = validateField('address', formData.address);
    return nameValid && categoryValid && phoneValid && emailValid && addressValid;
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
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-md p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">New Supplier</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            disabled={isLoading}
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
          {/* Name */}
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">
              Supplier Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Enter supplier or shop name"
              className={`w-full px-3 py-2 border ${errors.name ? 'border-red-500' : 'border-gray-300'} rounded-md`}
              required
              disabled={isLoading}
            />
            {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
          </div>
          {/* Category */}
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`w-full px-3 py-2 border ${errors.category ? 'border-red-500' : 'border-gray-300'} rounded-md appearance-none`}
              required
              disabled={isLoading}
            >
              <option value="" disabled>Select product category</option>
              {categories.map((category, index) => (
                <option key={index} value={category}>
                  {category}
                </option>
              ))}
            </select>
            {errors.category && <p className="mt-1 text-sm text-red-500">{errors.category}</p>}
          </div>
          {/* Phone */}
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
              placeholder="Enter supplier contact number (e.g., 071 1234567)"
              className={`w-full px-3 py-2 border ${errors.phone ? 'border-red-500' : 'border-gray-300'} rounded-md`}
              required
              disabled={isLoading}
            />
            {errors.phone && <p className="mt-1 text-sm text-red-500">{errors.phone}</p>}
          </div>
          {/* Email */}
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Enter supplier Email"
              className={`w-full px-3 py-2 border ${errors.email ? 'border-red-500' : 'border-gray-300'} rounded-md ${formData.email && formData.email.length > 25 ? 'text-sm' : ''}`}
              required
              disabled={isLoading}
            />
            {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email}</p>}
          </div>
          {/* Address */}
          <div className="mb-6">
            <label className="block text-gray-700 mb-2">
              Address <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Enter supplier Address"
              className={`w-full px-3 py-2 border ${errors.address ? 'border-red-500' : 'border-gray-300'} rounded-md ${formData.address && formData.address.length > 30 ? 'text-sm' : ''}`}
              required
              disabled={isLoading}
            />
            {errors.address && <p className="mt-1 text-sm text-red-500">{errors.address}</p>}
          </div>
          {/* Submit Button */}
          <button
            type="submit"
            className={`w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
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