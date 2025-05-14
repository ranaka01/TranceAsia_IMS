import React, { useState, useEffect } from "react";

const AddUserModal = ({
  isOpen,
  onClose,
  onSave,
  loading = false
}) => {
  const [formData, setFormData] = useState({
    Username: '',
    first_name: '',
    last_name: '',
    Email: '',
    Phone: '',
    Role: '',
    Password: '',
    confirmPassword: ''
  });

  const [errors, setErrors] = useState({});
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Available roles
  const roles = ["Admin", "Cashier", "Technician"];

  useEffect(() => {
    if (isOpen) {
      setFormData({
        Username: '',
        first_name: '',
        last_name: '',
        Email: '',
        Phone: '',
        Role: '',
        Password: '',
        confirmPassword: ''
      });
      setErrors({});
      setIsSubmitted(false);
    }
  }, [isOpen]);

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
      case 'Username':
        if (!value || value.trim() === '') {
          error = "Username is required";
        } else if (value.trim().length < 3) {
          error = "Username must be at least 3 characters";
        }
        break;
      case 'first_name':
        if (!value || value.trim() === '') {
          error = "First name is required";
        }
        break;
      case 'last_name':
        if (!value || value.trim() === '') {
          error = "Last name is required";
        }
        break;
      case 'Email':
        error = validateEmail(value);
        break;
      case 'Phone':
        error = validateMobileNumber(value);
        break;
      case 'Role':
        if (!value || value.trim() === '') {
          error = "Role is required";
        }
        break;
      case 'Password':
        if (!value || value.trim() === '') {
          error = "Password is required";
        } else if (value.length < 6) {
          error = "Password must be at least 6 characters";
        }
        break;
      case 'confirmPassword':
        if (!value || value.trim() === '') {
          error = "Please confirm your password";
        } else if (value !== formData.Password) {
          error = "Passwords do not match";
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
    const usernameValid = validateField('Username', formData.Username);
    const firstNameValid = validateField('first_name', formData.first_name);
    const lastNameValid = validateField('last_name', formData.last_name);
    const emailValid = validateField('Email', formData.Email);
    const phoneValid = validateField('Phone', formData.Phone);
    const roleValid = validateField('Role', formData.Role);
    const passwordValid = validateField('Password', formData.Password);
    const confirmPasswordValid = validateField('confirmPassword', formData.confirmPassword);
    
    return (
      usernameValid && 
      firstNameValid && 
      lastNameValid && 
      emailValid && 
      phoneValid && 
      roleValid && 
      passwordValid && 
      confirmPasswordValid
    );
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
        // Remove confirmPassword from data sent to API
        const { confirmPassword, ...userData } = formData;
        onSave(userData);
      } catch (error) {
        console.error("Error creating user:", error);
        setErrors(prev => ({
          ...prev,
          general: "Failed to create user. Please try again."
        }));
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-md p-6 w-full max-w-md max-h-screen overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Add New User</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            disabled={loading}
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
          
          {/* First Name */}
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">
              First Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="first_name"
              value={formData.first_name}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Enter first name"
              className={`w-full px-3 py-2 border ${errors.first_name ? 'border-red-500' : 'border-gray-300'} rounded-md`}
              required
              disabled={loading}
            />
            {errors.first_name && <p className="mt-1 text-sm text-red-500">{errors.first_name}</p>}
          </div>
          
          {/* Last Name */}
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">
              Last Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="last_name"
              value={formData.last_name}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Enter last name"
              className={`w-full px-3 py-2 border ${errors.last_name ? 'border-red-500' : 'border-gray-300'} rounded-md`}
              required
              disabled={loading}
            />
            {errors.last_name && <p className="mt-1 text-sm text-red-500">{errors.last_name}</p>}
          </div>
          
          {/* Username */}
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">
              Username <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="Username"
              value={formData.Username}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Enter username"
              className={`w-full px-3 py-2 border ${errors.Username ? 'border-red-500' : 'border-gray-300'} rounded-md`}
              required
              disabled={loading}
            />
            {errors.Username && <p className="mt-1 text-sm text-red-500">{errors.Username}</p>}
          </div>
          
          {/* Email */}
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              name="Email"
              value={formData.Email}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Enter email address"
              className={`w-full px-3 py-2 border ${errors.Email ? 'border-red-500' : 'border-gray-300'} rounded-md`}
              required
              disabled={loading}
            />
            {errors.Email && <p className="mt-1 text-sm text-red-500">{errors.Email}</p>}
          </div>
          
          {/* Phone */}
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">
              Phone <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="Phone"
              value={formData.Phone}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Enter phone number (e.g., 071 1234567)"
              className={`w-full px-3 py-2 border ${errors.Phone ? 'border-red-500' : 'border-gray-300'} rounded-md`}
              required
              disabled={loading}
            />
            {errors.Phone && <p className="mt-1 text-sm text-red-500">{errors.Phone}</p>}
          </div>
          
          {/* Role */}
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">
              Role <span className="text-red-500">*</span>
            </label>
            <select
              name="Role"
              value={formData.Role}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`w-full px-3 py-2 border ${errors.Role ? 'border-red-500' : 'border-gray-300'} rounded-md appearance-none`}
              required
              disabled={loading}
            >
              <option value="" disabled>Select a role</option>
              {roles.map((role, index) => (
                <option key={index} value={role}>
                  {role}
                </option>
              ))}
            </select>
            {errors.Role && <p className="mt-1 text-sm text-red-500">{errors.Role}</p>}
          </div>
          
          {/* Password */}
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">
              Password <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              name="Password"
              value={formData.Password}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Enter password"
              className={`w-full px-3 py-2 border ${errors.Password ? 'border-red-500' : 'border-gray-300'} rounded-md`}
              required
              disabled={loading}
            />
            {errors.Password && <p className="mt-1 text-sm text-red-500">{errors.Password}</p>}
          </div>
          
          {/* Confirm Password */}
          <div className="mb-6">
            <label className="block text-gray-700 mb-2">
              Confirm Password <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Confirm password"
              className={`w-full px-3 py-2 border ${errors.confirmPassword ? 'border-red-500' : 'border-gray-300'} rounded-md`}
              required
              disabled={loading}
            />
            {errors.confirmPassword && <p className="mt-1 text-sm text-red-500">{errors.confirmPassword}</p>}
          </div>
          
          {/* Submit Button */}
          <button
            type="submit"
            className={`w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
            disabled={loading}
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                Creating User...
              </div>
            ) : (
              'Create User'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddUserModal;