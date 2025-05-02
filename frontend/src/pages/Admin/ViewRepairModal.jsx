import React, { useState, useEffect } from "react";

const ViewRepairModal = ({ 
  isOpen, 
  onClose, 
  onUpdate, 
  repair, 
  technicians, 
  statusOptions 
}) => {
  const [formData, setFormData] = useState({...repair});
  const [errors, setErrors] = useState({});
  const [productInput, setProductInput] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Reset form when repair details change
  useEffect(() => {
    if (repair) {
      setFormData({...repair});
    }
  }, [repair]);

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
      return "Email is required";
    }
    
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (emailPattern.test(email)) {
      return "";
    } else {
      return "Please enter a valid email address";
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    
    setFormData({
      ...formData,
      [name]: newValue
    });

    // If form was already submitted once, validate on change 
    // to give immediate feedback
    if (isSubmitted) {
      validateField(name, newValue);
    }
  };

  // Handle adding a product
  const handleAddProduct = () => {
    if (productInput.trim() !== "") {
      setFormData({
        ...formData,
        products: [...formData.products, productInput.trim()]
      });
      setProductInput("");
    }
  };

  // Handle removing a product
  const handleRemoveProduct = (index) => {
    const updatedProducts = [...formData.products];
    updatedProducts.splice(index, 1);
    setFormData({
      ...formData,
      products: updatedProducts
    });
  };

  // Toggle edit mode
  const toggleEditMode = () => {
    setIsEditing(!isEditing);
    setErrors({});
    setIsSubmitted(false);
  };

  // Handle printing bill
  const handlePrintBill = () => {
    alert(`Generating bill for repair ID: ${repair.id}`);
    // In a real implementation, this would generate and download a PDF
  };

  // Handle printing work order
  const handlePrintWorkOrder = () => {
    alert(`Generating work order for repair ID: ${repair.id}`);
    // In a real implementation, this would generate and download a PDF
  };

  // Validate a specific field
  const validateField = (name, value) => {
    let error = "";
    
    switch (name) {
      case 'customer':
        if (!value || value.trim() === '') {
          error = "Customer name is required";
        }
        break;
        
      case 'phone':
        error = validateMobileNumber(value);
        break;
        
      case 'email':
        error = validateEmail(value);
        break;
        
      case 'deviceType':
        if (!value || value.trim() === '') {
          error = "Device type is required";
        }
        break;
        
      case 'deviceModel':
        if (!value || value.trim() === '') {
          error = "Device model is required";
        }
        break;
        
      case 'issue':
        if (!value || value.trim() === '') {
          error = "Issue description is required";
        }
        break;
        
      case 'technician':
        if (!value || value.trim() === '') {
          error = "Technician is required";
        }
        break;
        
      case 'deadline':
        if (!value) {
          error = "Deadline is required";
        }
        break;
        
      case 'estimatedCost':
        if (!value || value.trim() === '') {
          error = "Estimated cost is required";
        } else if (isNaN(value.replace(/,/g, ''))) {
          error = "Please enter a valid amount";
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

  // Validate all required fields
  const validateForm = () => {
    const fieldsToValidate = [
      'customer', 'phone', 'email', 'deviceType', 
      'deviceModel', 'issue', 'technician', 'deadline', 'estimatedCost'
    ];
    
    let isValid = true;
    const newErrors = {};
    
    fieldsToValidate.forEach(field => {
      const fieldValue = formData[field];
      const error = validateField(field, fieldValue);
      if (error) {
        newErrors[field] = error;
        isValid = false;
      }
    });
    
    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Set form as submitted to show all errors
    setIsSubmitted(true);
    
    // Validate form
    const isValid = validateForm();
    
    if (isValid) {
      // Format currency values
      const formattedFormData = {
        ...formData,
        estimatedCost: formData.estimatedCost.replace(/,/g, '') 
          ? parseFloat(formData.estimatedCost.replace(/,/g, '')).toLocaleString()
          : "0.00",
        advancePayment: formData.advancePayment.replace(/,/g, '') 
          ? parseFloat(formData.advancePayment.replace(/,/g, '')).toLocaleString()
          : "0.00"
      };
      
      onUpdate(formattedFormData);
      setIsEditing(false);
    }
  };

  // Handle blur event to show validation immediately when field loses focus
  const handleBlur = (e) => {
    if (isEditing) {
      const { name, value, type, checked } = e.target;
      const fieldValue = type === 'checkbox' ? checked : value;
      validateField(name, fieldValue);
    }
  };

  // Get formatted date for display
  const getFormattedDate = (dateString) => {
    if (!dateString) return "";
    
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Get status badge styling
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "Pending":
        return "bg-yellow-100 text-yellow-800";
      case "In Progress":
        return "bg-blue-100 text-blue-800";
      case "Waiting for Parts":
        return "bg-purple-100 text-purple-800";
      case "Completed":
        return "bg-green-100 text-green-800";
      case "Cannot Repair":
        return "bg-red-100 text-red-800";
      case "Picked Up":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (!isOpen || !repair) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-md p-6 w-full max-w-4xl max-h-screen overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center">
            <h2 className="text-lg font-semibold">Repair #{repair.id}</h2>
            <span className={`ml-3 px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(repair.status)}`}>
              {repair.status}
            </span>
          </div>
          <div className="flex space-x-2">
            {!isEditing && (
              <>
                <button
                  onClick={handlePrintBill}
                  className="text-indigo-600 hover:text-indigo-800 px-3 py-1 border border-indigo-600 rounded"
                >
                  Print Bill
                </button>
                <button
                  onClick={handlePrintWorkOrder}
                  className="text-purple-600 hover:text-purple-800 px-3 py-1 border border-purple-600 rounded"
                >
                  Work Order
                </button>
                <button
                  onClick={toggleEditMode}
                  className="text-blue-600 hover:text-blue-800 px-3 py-1 border border-blue-600 rounded"
                >
                  Edit
                </button>
              </>
            )}
            <button 
              onClick={isEditing ? toggleEditMode : onClose} 
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} noValidate>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Left Column */}
            <div>
              <h3 className="text-md font-medium mb-2">Customer Information</h3>
              
              <div className="mb-4">
                <label className="block text-gray-700 mb-1">
                  Customer Name <span className="text-red-500">*</span>
                </label>
                {isEditing ? (
                  <>
                    <input
                      type="text"
                      name="customer"
                      value={formData.customer}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      placeholder="Enter customer name"
                      className={`w-full px-3 py-2 border ${errors.customer ? 'border-red-500' : 'border-gray-300'} rounded-md`}
                      required
                    />
                    {errors.customer && (
                      <p className="mt-1 text-sm text-red-500">{errors.customer}</p>
                    )}
                  </>
                ) : (
                  <p className="py-2 px-3 bg-gray-50 rounded-md">{repair.customer}</p>
                )}
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 mb-1">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                {isEditing ? (
                  <>
                    <input
                      type="text"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      placeholder="Enter phone number (e.g., 071 1234567)"
                      className={`w-full px-3 py-2 border ${errors.phone ? 'border-red-500' : 'border-gray-300'} rounded-md`}
                      required
                    />
                    {errors.phone && (
                      <p className="mt-1 text-sm text-red-500">{errors.phone}</p>
                    )}
                  </>
                ) : (
                  <p className="py-2 px-3 bg-gray-50 rounded-md">{repair.phone}</p>
                )}
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                {isEditing ? (
                  <>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      placeholder="Enter email address"
                      className={`w-full px-3 py-2 border ${errors.email ? 'border-red-500' : 'border-gray-300'} rounded-md`}
                      required
                    />
                    {errors.email && (
                      <p className="mt-1 text-sm text-red-500">{errors.email}</p>
                    )}
                  </>
                ) : (
                  <p className="py-2 px-3 bg-gray-50 rounded-md">{repair.email}</p>
                )}
              </div>

              <h3 className="text-md font-medium mb-2 mt-6">Additional Details</h3>
              
              <div className="mb-4">
                <label className="block text-gray-700 mb-1">
                  Repair Received Date
                </label>
                <p className="py-2 px-3 bg-gray-50 rounded-md">
                  {getFormattedDate(repair.dateReceived)}
                </p>
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 mb-1">
                  Advance Payment
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    name="advancePayment"
                    value={formData.advancePayment}
                    onChange={handleChange}
                    placeholder="Enter advance payment amount"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                ) : (
                  <p className="py-2 px-3 bg-gray-50 rounded-md">
                    Rs. {repair.advancePayment}
                  </p>
                )}
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 mb-1">
                  Deadline <span className="text-red-500">*</span>
                </label>
                {isEditing ? (
                  <>
                    <input
                      type="date"
                      name="deadline"
                      value={formData.deadline}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={`w-full px-3 py-2 border ${errors.deadline ? 'border-red-500' : 'border-gray-300'} rounded-md`}
                      required
                    />
                    {errors.deadline && (
                      <p className="mt-1 text-sm text-red-500">{errors.deadline}</p>
                    )}
                  </>
                ) : (
                  <p className="py-2 px-3 bg-gray-50 rounded-md">
                    {getFormattedDate(repair.deadline)}
                  </p>
                )}
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 mb-1">
                  Technician <span className="text-red-500">*</span>
                </label>
                {isEditing ? (
                  <>
                    <select
                      name="technician"
                      value={formData.technician}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={`w-full px-3 py-2 border ${errors.technician ? 'border-red-500' : 'border-gray-300'} rounded-md appearance-none`}
                      required
                    >
                      {technicians.map((tech, index) => (
                        <option key={index} value={tech}>
                          {tech}
                        </option>
                      ))}
                    </select>
                    {errors.technician && (
                      <p className="mt-1 text-sm text-red-500">{errors.technician}</p>
                    )}
                  </>
                ) : (
                  <p className="py-2 px-3 bg-gray-50 rounded-md">{repair.technician}</p>
                )}
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 mb-1">
                  Password (if provided)
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Enter device password if provided"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                ) : (
                  <p className="py-2 px-3 bg-gray-50 rounded-md">
                    {repair.password || "Not provided"}
                  </p>
                )}
              </div>
              
              <div className="mb-4 flex items-center">
                {isEditing ? (
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="isUnderWarranty"
                      checked={formData.isUnderWarranty}
                      onChange={handleChange}
                      className="h-4 w-4 text-blue-600"
                    />
                    <span className="ml-2 text-gray-700">Under Warranty</span>
                  </label>
                ) : (
                  <div className="py-2 px-3 bg-gray-50 rounded-md w-full">
                    {repair.isUnderWarranty ? "Yes" : "No"}
                  </div>
                )}
              </div>
            </div>
            
            {/* Right Column */}
            <div>
              <h3 className="text-md font-medium mb-2">Device Information</h3>
              
              <div className="mb-4">
                <label className="block text-gray-700 mb-1">
                  Device Type <span className="text-red-500">*</span>
                </label>
                {isEditing ? (
                  <>
                    <input
                      type="text"
                      name="deviceType"
                      value={formData.deviceType}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      placeholder="Enter device type (e.g., Laptop, Desktop, Printer)"
                      className={`w-full px-3 py-2 border ${errors.deviceType ? 'border-red-500' : 'border-gray-300'} rounded-md`}
                      required
                    />
                    {errors.deviceType && (
                      <p className="mt-1 text-sm text-red-500">{errors.deviceType}</p>
                    )}
                  </>
                ) : (
                  <p className="py-2 px-3 bg-gray-50 rounded-md">{repair.deviceType}</p>
                )}
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 mb-1">
                  Device Model <span className="text-red-500">*</span>
                </label>
                {isEditing ? (
                  <>
                    <input
                      type="text"
                      name="deviceModel"
                      value={formData.deviceModel}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      placeholder="Enter device model (e.g., Dell XPS 13, HP LaserJet)"
                      className={`w-full px-3 py-2 border ${errors.deviceModel ? 'border-red-500' : 'border-gray-300'} rounded-md`}
                      required
                    />
                    {errors.deviceModel && (
                      <p className="mt-1 text-sm text-red-500">{errors.deviceModel}</p>
                    )}
                  </>
                ) : (
                  <p className="py-2 px-3 bg-gray-50 rounded-md">{repair.deviceModel}</p>
                )}
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 mb-1">
                  Serial Number
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    name="serialNumber"
                    value={formData.serialNumber}
                    onChange={handleChange}
                    placeholder="Enter device serial number if available"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                ) : (
                  <p className="py-2 px-3 bg-gray-50 rounded-md">
                    {repair.serialNumber || "Not provided"}
                  </p>
                )}
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 mb-1">
                  Repair Issue <span className="text-red-500">*</span>
                </label>
                {isEditing ? (
                  <>
                    <textarea
                      name="issue"
                      value={formData.issue}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      placeholder="Describe the issue with the device"
                      rows="3"
                      className={`w-full px-3 py-2 border ${errors.issue ? 'border-red-500' : 'border-gray-300'} rounded-md`}
                      required
                    ></textarea>
                    {errors.issue && (
                      <p className="mt-1 text-sm text-red-500">{errors.issue}</p>
                    )}
                  </>
                ) : (
                  <p className="py-2 px-3 bg-gray-50 rounded-md">{repair.issue}</p>
                )}
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 mb-1">
                  Status
                </label>
                {isEditing ? (
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md appearance-none"
                  >
                    {statusOptions.map((status, index) => (
                      <option key={index} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="py-2 px-3 bg-gray-50 rounded-md">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(repair.status)}`}>
                      {repair.status}
                    </span>
                  </p>
                )}
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 mb-1">
                  Estimated Cost <span className="text-red-500">*</span>
                </label>
                {isEditing ? (
                  <>
                    <input
                      type="text"
                      name="estimatedCost"
                      value={formData.estimatedCost}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      placeholder="Enter estimated repair cost"
                      className={`w-full px-3 py-2 border ${errors.estimatedCost ? 'border-red-500' : 'border-gray-300'} rounded-md`}
                      required
                    />
                    {errors.estimatedCost && (
                      <p className="mt-1 text-sm text-red-500">{errors.estimatedCost}</p>
                    )}
                  </>
                ) : (
                  <p className="py-2 px-3 bg-gray-50 rounded-md">
                    Rs. {repair.estimatedCost}
                  </p>
                )}
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 mb-1">
                  Products/Parts Needed
                </label>
                {isEditing ? (
                  <>
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={productInput}
                        onChange={(e) => setProductInput(e.target.value)}
                        placeholder="Enter product or part name"
                        className="flex-grow px-3 py-2 border border-gray-300 rounded-md"
                      />
                      <button
                        type="button"
                        onClick={handleAddProduct}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                      >
                        Add
                      </button>
                    </div>
                    <div className="mt-2">
                      {formData.products.length > 0 ? (
                        <ul className="max-h-32 overflow-y-auto border border-gray-200 rounded-md p-2">
                          {formData.products.map((product, index) => (
                            <li key={index} className="flex justify-between items-center py-1">
                              <span>{product}</span>
                              <button
                                type="button"
                                onClick={() => handleRemoveProduct(index)}
                                className="text-red-500 hover:text-red-700"
                              >
                                ✕
                              </button>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-gray-500 mt-1">No products added yet</p>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="py-2 px-3 bg-gray-50 rounded-md">
                    {repair.products && repair.products.length > 0 ? (
                      <ul className="list-disc pl-5">
                        {repair.products.map((product, index) => (
                          <li key={index}>{product}</li>
                        ))}
                      </ul>
                    ) : (
                      <p>No products listed</p>
                    )}
                  </div>
                )}
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 mb-1">
                  Additional Notes
                </label>
                {isEditing ? (
                  <textarea
                    name="additionalNotes"
                    value={formData.additionalNotes}
                    onChange={handleChange}
                    placeholder="Enter any additional notes about the repair"
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  ></textarea>
                ) : (
                  <p className="py-2 px-3 bg-gray-50 rounded-md">
                    {repair.additionalNotes || "No additional notes"}
                  </p>
                )}
              </div>
            </div>
          </div>
          
          {isEditing && (
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={toggleEditMode}
                className="mr-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Update Repair
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default ViewRepairModal;