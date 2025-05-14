import React, { useState, useEffect, useRef } from "react";
import { MdSettings, MdAddAPhoto } from "react-icons/md";
import API from "../../utils/api"; // Import API utility for backend calls
import { jwtDecode } from "jwt-decode";

const UserSettings = ({ onClose }) => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    phone: "",
    first_name: "",
    last_name: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
    profile_image: null
  });
  
  const [userId, setUserId] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [fetchingUser, setFetchingUser] = useState(true);
  const [imagePreview, setImagePreview] = useState(null);
  
  const fileInputRef = useRef(null);

  // Get user ID from token
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setUserId(decoded.userId);
      } catch (error) {
        console.error("Error decoding token:", error);
        setErrors(prev => ({
          ...prev,
          apiError: "Authentication error. Please log in again."
        }));
      }
    }
  }, []);

  // Fetch user data when component mounts
  useEffect(() => {
    const fetchUserData = async () => {
      if (!userId) return; // Wait until we have the user ID
      
      setFetchingUser(true);
      try {
        // Use the correct endpoint to get the current user's profile
        const response = await API.get(`/users/${userId}`);
        console.log("Profile API response:", response.data); // Debug response
        
        // Handle different possible response formats
        let userData;
        if (response.data && response.data.data && response.data.data.user) {
          userData = response.data.data.user;
        } else if (response.data && response.data.user) {
          userData = response.data.user;
        } else if (response.data) {
          userData = response.data;
        }
        
        if (userData) {
          // Set form data based on response structure
          setFormData({
            username: userData.Username || userData.username || "",
            email: userData.Email || userData.email || "",
            phone: userData.Phone || userData.phone || "",
            first_name: userData.first_name || "",
            last_name: userData.last_name || "",
            profile_image: userData.profile_image || null,
            currentPassword: "",
            newPassword: "",
            confirmPassword: ""
          });
          
          // Set image preview if profile image exists
          if (userData.profile_image) {
            setImagePreview(userData.profile_image.startsWith('http') 
              ? userData.profile_image 
              : `http://localhost:5000/uploads/${userData.profile_image}`);
          }
        } else {
          throw new Error("Could not parse user data from response");
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        
        // Check if it's an authentication error
        if (error.response && error.response.status === 401) {
          setErrors(prev => ({
            ...prev,
            apiError: "Authentication error. Please log in again."
          }));
        } else {
          setErrors(prev => ({
            ...prev,
            apiError: "Could not load user profile. Please try again."
          }));
        }
      } finally {
        setFetchingUser(false);
      }
    };

    fetchUserData();
  }, [userId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };
  
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check if file is an image
      if (!file.type.startsWith('image/')) {
        setErrors(prev => ({
          ...prev,
          profile_image: "Please select an image file"
        }));
        return;
      }
      
      // Check file size (limit to 2MB)
      if (file.size > 2 * 1024 * 1024) {
        setErrors(prev => ({
          ...prev,
          profile_image: "Image must be less than 2MB"
        }));
        return;
      }
      
      // Preview the image
      const reader = new FileReader();
      reader.onload = (event) => {
        setImagePreview(event.target.result);
      };
      reader.readAsDataURL(file);
      
      // Update form data
      setFormData(prev => ({
        ...prev,
        profile_image: file
      }));
      
      // Clear any previous errors
      if (errors.profile_image) {
        setErrors(prev => ({ ...prev, profile_image: "" }));
      }
    }
  };
  
  const triggerFileInput = () => {
    if (isEditing) {
      fileInputRef.current.click();
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    // Basic validations
    if (!formData.username.trim()) {
      newErrors.username = "Username is required";
    }
    
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }
    
    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else {
      // Clean up phone number and validate
      const cleanPhone = formData.phone.replace(/\s+/g, '');
      const localPattern = /^07[0-9]{8}$/;
      const intlPattern = /^\+947[0-9]{8}$/;
      if (!(localPattern.test(cleanPhone) || intlPattern.test(cleanPhone))) {
        newErrors.phone = "Please enter a valid Sri Lankan mobile number";
      }
    }
    
    // Password validation - only if user is changing password
    if (formData.currentPassword || formData.newPassword || formData.confirmPassword) {
      if (!formData.currentPassword) {
        newErrors.currentPassword = "Current password is required";
      }
      
      if (!formData.newPassword) {
        newErrors.newPassword = "New password is required";
      } else if (formData.newPassword.length < 6) {
        newErrors.newPassword = "Password must be at least 6 characters";
      }
      
      if (!formData.confirmPassword) {
        newErrors.confirmPassword = "Please confirm your new password";
      } else if (formData.newPassword !== formData.confirmPassword) {
        newErrors.confirmPassword = "Passwords do not match";
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!userId) {
      setErrors({
        apiError: "Authentication error. Please log in again."
      });
      return;
    }
    
    // Clear any existing success message
    setSuccessMessage("");
    
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Create a FormData object to handle file upload
      const formDataObj = new FormData();
      formDataObj.append('Username', formData.username);
      formDataObj.append('Email', formData.email);
      formDataObj.append('Phone', formData.phone);
      formDataObj.append('first_name', formData.first_name || '');
      formDataObj.append('last_name', formData.last_name || '');
      
      // Only include password fields if user is changing password
      if (formData.currentPassword && formData.newPassword) {
        formDataObj.append('currentPassword', formData.currentPassword);
        formDataObj.append('newPassword', formData.newPassword);
      }
      
      // If there's a new profile image, append it
      if (formData.profile_image && formData.profile_image instanceof File) {
        formDataObj.append('profile_image', formData.profile_image);
      }
      
      console.log("Submitting profile update");
      
      // Make API call to update user profile
      const response = await API.patch(
        `/users/${userId}/profile`, 
        formDataObj,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      
      console.log("Profile update response:", response.data);
      
      // Handle successful response
      setSuccessMessage("Profile updated successfully!");
      setIsEditing(false);
      
      // Clear password fields
      setFormData(prev => ({
        ...prev,
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      }));
      
      // Update form data with new user info if available in response
      if (response.data && response.data.data && response.data.data.user) {
        const updatedUser = response.data.data.user;
        setFormData(prev => ({
          ...prev,
          username: updatedUser.Username || updatedUser.username || prev.username,
          email: updatedUser.Email || updatedUser.email || prev.email,
          phone: updatedUser.Phone || updatedUser.phone || prev.phone,
          first_name: updatedUser.first_name || prev.first_name,
          last_name: updatedUser.last_name || prev.last_name,
          profile_image: updatedUser.profile_image || prev.profile_image
        }));
        
        // Update image preview if needed
        if (updatedUser.profile_image) {
          setImagePreview(updatedUser.profile_image.startsWith('http') 
            ? updatedUser.profile_image 
            : `http://localhost:5000/uploads/${updatedUser.profile_image}`);
        }
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      
      // Handle specific API errors
      if (error.response?.data?.message) {
        setErrors({ 
          apiError: error.response.data.message 
        });
      } else if (error.response?.status === 401) {
        setErrors({
          currentPassword: "Current password is incorrect"
        });
      } else {
        setErrors({ 
          apiError: "Failed to update profile. Please try again." 
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    // Reset form to original state and exit edit mode
    if (!userId) return;
    
    const fetchUserData = async () => {
      try {
        const response = await API.get(`/users/${userId}`);
        
        // Handle different possible response structures
        let userData;
        if (response.data && response.data.data && response.data.data.user) {
          userData = response.data.data.user;
        } else if (response.data && response.data.user) {
          userData = response.data.user;
        } else if (response.data) {
          userData = response.data;
        }
        
        if (userData) {
          setFormData({
            username: userData.Username || userData.username || "",
            email: userData.Email || userData.email || "",
            phone: userData.Phone || userData.phone || "",
            first_name: userData.first_name || "",
            last_name: userData.last_name || "",
            profile_image: userData.profile_image || null,
            currentPassword: "",
            newPassword: "",
            confirmPassword: ""
          });
          
          // Reset image preview
          if (userData.profile_image) {
            setImagePreview(userData.profile_image.startsWith('http') 
              ? userData.profile_image 
              : `http://localhost:5000/uploads/${userData.profile_image}`);
          } else {
            setImagePreview(null);
          }
        }
      } catch (error) {
        console.error("Error resetting user data:", error);
        // If error occurs, just reset the password fields
        setFormData(prev => ({
          ...prev,
          currentPassword: "",
          newPassword: "",
          confirmPassword: ""
        }));
      }
    };

    fetchUserData();
    setErrors({});
    setIsEditing(false);
  };

  // Show loading state while fetching user data
  if (fetchingUser) {
    return (
      <div className="w-full h-full">
        <div className="w-full h-full bg-white p-6 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin h-12 w-12 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600">Loading profile...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full">
      <div className="w-full h-full bg-white p-6 overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6 border-b pb-4">
          <h2 className="text-2xl font-bold text-gray-800">My Profile</h2>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100"
            aria-label="Close"
          >
            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 p-4 bg-green-100 text-green-700 rounded-md">
            {successMessage}
          </div>
        )}

        {/* API Error Message */}
        {errors.apiError && (
          <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-md">
            {errors.apiError}
          </div>
        )}

        {/* Profile Form */}
        <form onSubmit={handleSubmit} className="max-w-2xl mx-auto">
          <div className="mb-6">
            {/* Profile Image Section */}
            <div className="flex justify-center mb-6">
              <div className="relative">
                {imagePreview ? (
                  <div 
                    className="w-32 h-32 rounded-full bg-cover bg-center cursor-pointer"
                    style={{ backgroundImage: `url(${imagePreview})` }}
                    onClick={triggerFileInput}
                  >
                    {isEditing && (
                      <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                        <MdAddAPhoto className="text-white text-3xl" />
                      </div>
                    )}
                  </div>
                ) : (
                  <div 
                    className="w-32 h-32 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-4xl font-bold cursor-pointer"
                    onClick={triggerFileInput}
                  >
                    {formData.username ? formData.username.substring(0, 2).toUpperCase() : "AU"}
                    {isEditing && (
                      <div className="absolute inset-0 bg-black bg-opacity-30 rounded-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                        <MdAddAPhoto className="text-white text-3xl" />
                      </div>
                    )}
                  </div>
                )}
                
                {/* Hidden file input */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageChange}
                  className="hidden"
                  accept="image/*"
                />
              </div>
            </div>
            
            {/* Image upload error */}
            {errors.profile_image && (
              <p className="mt-1 text-sm text-red-500 text-center mb-4">{errors.profile_image}</p>
            )}
            
            {/* Toggle Edit Mode Button */}
            {!isEditing ? (
              <div className="flex justify-center mb-8">
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
                >
                  <MdSettings className="mr-2" /> Edit Profile
                </button>
              </div>
            ) : null}

            {/* User Information Fields */}
            <div className="space-y-4">
              {/* First Name */}
              <div>
                <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 mb-1">
                  First Name
                </label>
                <input
                  type="text"
                  id="first_name"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className={`w-full px-4 py-2 border ${
                    errors.first_name ? "border-red-500" : "border-gray-300"
                  } rounded-md ${!isEditing ? "bg-gray-50" : "bg-white"}`}
                />
                {errors.first_name && <p className="mt-1 text-sm text-red-500">{errors.first_name}</p>}
              </div>
              
              {/* Last Name */}
              <div>
                <label htmlFor="last_name" className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name
                </label>
                <input
                  type="text"
                  id="last_name"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className={`w-full px-4 py-2 border ${
                    errors.last_name ? "border-red-500" : "border-gray-300"
                  } rounded-md ${!isEditing ? "bg-gray-50" : "bg-white"}`}
                />
                {errors.last_name && <p className="mt-1 text-sm text-red-500">{errors.last_name}</p>}
              </div>
              
              {/* Username */}
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                  Username
                </label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className={`w-full px-4 py-2 border ${
                    errors.username ? "border-red-500" : "border-gray-300"
                  } rounded-md ${!isEditing ? "bg-gray-50" : "bg-white"}`}
                />
                {errors.username && <p className="mt-1 text-sm text-red-500">{errors.username}</p>}
              </div>
              
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className={`w-full px-4 py-2 border ${
                    errors.email ? "border-red-500" : "border-gray-300"
                  } rounded-md ${!isEditing ? "bg-gray-50" : "bg-white"}`}
                />
                {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email}</p>}
              </div>
              
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="text"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className={`w-full px-4 py-2 border ${
                    errors.phone ? "border-red-500" : "border-gray-300"
                  } rounded-md ${!isEditing ? "bg-gray-50" : "bg-white"}`}
                />
                {errors.phone && <p className="mt-1 text-sm text-red-500">{errors.phone}</p>}
              </div>
            </div>

            {/* Password Fields (only visible in edit mode) */}
            {isEditing && (
              <div className="mt-8 space-y-4">
                <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Change Password (Optional)</h3>
                
                <div>
                  <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-1">
                    Current Password
                  </label>
                  <input
                    type="password"
                    id="currentPassword"
                    name="currentPassword"
                    value={formData.currentPassword}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 border ${
                      errors.currentPassword ? "border-red-500" : "border-gray-300"
                    } rounded-md`}
                  />
                  {errors.currentPassword && (
                    <p className="mt-1 text-sm text-red-500">{errors.currentPassword}</p>
                  )}
                </div>
                
                <div>
                  <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
                    New Password
                  </label>
                  <input
                    type="password"
                    id="newPassword"
                    name="newPassword"
                    value={formData.newPassword}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 border ${
                      errors.newPassword ? "border-red-500" : "border-gray-300"
                    } rounded-md`}
                  />
                  {errors.newPassword && (
                    <p className="mt-1 text-sm text-red-500">{errors.newPassword}</p>
                  )}
                </div>
                
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 border ${
                      errors.confirmPassword ? "border-red-500" : "border-gray-300"
                    } rounded-md`}
                  />
                  {errors.confirmPassword && (
                    <p className="mt-1 text-sm text-red-500">{errors.confirmPassword}</p>
                  )}
                </div>
              </div>
            )}

            {/* Action Buttons (only visible in edit mode) */}
            {isEditing && (
              <div className="mt-8 flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors ${
                    isLoading ? "opacity-70 cursor-not-allowed" : ""
                  }`}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center">
                      <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                      Saving...
                    </div>
                  ) : (
                    "Save Changes"
                  )}
                </button>
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserSettings;