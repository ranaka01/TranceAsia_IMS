import React, { useState, useEffect, useRef } from "react";
import { checkWarrantyBySerialNumber, searchSerialNumbers } from "../../services/repairService";
import { createCustomer, findCustomerByPhone, searchCustomersByPhone } from "../../services/customerService";
import { toast } from "react-toastify";

const AddRepairModal = ({
  isOpen,
  onClose,
  onSave,
  technicians,
  statusOptions
}) => {
  // Get today's date for reference
  const today = new Date();

  // Set default deadline to 7 days from today
  const defaultDeadline = new Date(today);
  defaultDeadline.setDate(defaultDeadline.getDate() + 7);
  const defaultDeadlineStr = defaultDeadline.toISOString().split('T')[0];

  const initialFormData = {
    customer: "",
    phone: "",
    email: "",
    deviceType: "",
    deviceModel: "",
    serialNumber: "",
    issue: "",
    technician: Array.isArray(technicians) && technicians.length > 0 ?
      (typeof technicians[0] === 'object' ? `${technicians[0].User_ID}` : technicians[0]) : "",
    status: statusOptions && statusOptions.length > 0 ? statusOptions[0] : "Pending",
    deadline: defaultDeadlineStr,
    estimatedCost: "0.00", // Default value to ensure it's always valid
    advancePayment: "0.00", // Default value to ensure it's always valid
    extraExpenses: "0.00", // Default value for extra expenses

    password: "",
    additionalNotes: "",
    isUnderWarranty: false,
    customerId: null // Store customer ID when found or created
  };

  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isCheckingWarranty, setIsCheckingWarranty] = useState(false);

  // Serial number search state
  const [serialNumberResults, setSerialNumberResults] = useState([]);
  const [isSearchingSerialNumbers, setIsSearchingSerialNumbers] = useState(false);
  const [showSerialNumberDropdown, setShowSerialNumberDropdown] = useState(false);
  const serialNumberInputRef = useRef(null);
  const serialNumberDropdownRef = useRef(null);

  // Customer search state
  const [customerResults, setCustomerResults] = useState([]);
  const [isSearchingCustomers, setIsSearchingCustomers] = useState(false);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [areCustomerFieldsReadOnly, setAreCustomerFieldsReadOnly] = useState(false);
  const phoneInputRef = useRef(null);
  const customerDropdownRef = useRef(null);

  // Device fields read-only state
  const [areDeviceFieldsReadOnly, setAreDeviceFieldsReadOnly] = useState(false);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      // Get today's date for reference
      const today = new Date();

      // Set default deadline to 7 days from today
      const defaultDeadline = new Date(today);
      defaultDeadline.setDate(defaultDeadline.getDate() + 7);
      const defaultDeadlineStr = defaultDeadline.toISOString().split('T')[0];

      // Create a fresh initialFormData with current technicians and statusOptions
      const freshInitialData = {
        customer: "",
        phone: "",
        email: "",
        deviceType: "",
        deviceModel: "",
        serialNumber: "",
        issue: "",
        technician: Array.isArray(technicians) && technicians.length > 0 ?
          (typeof technicians[0] === 'object' ? `${technicians[0].User_ID}` : technicians[0]) : "",
        status: statusOptions && statusOptions.length > 0 ? statusOptions[0] : "Pending",
        deadline: defaultDeadlineStr, // Set default deadline
        estimatedCost: "0.00", // Default value to ensure it's always valid
        advancePayment: "0.00", // Default value to ensure it's always valid
        extraExpenses: "0.00", // Default value for extra expenses

        password: "",
        additionalNotes: "",
        isUnderWarranty: false,
        customerId: null // Reset customer ID
      };

      setFormData(freshInitialData);
      setErrors({});
      setIsSubmitted(false);
      setSerialNumberResults([]);
      setShowSerialNumberDropdown(false);
      setCustomerResults([]);
      setShowCustomerDropdown(false);
      setAreCustomerFieldsReadOnly(false);
      setAreDeviceFieldsReadOnly(false);
    }
  }, [isOpen, technicians, statusOptions]);

  // Handle clicks outside the dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Handle serial number dropdown
      if (
        serialNumberDropdownRef.current &&
        !serialNumberDropdownRef.current.contains(event.target) &&
        serialNumberInputRef.current &&
        !serialNumberInputRef.current.contains(event.target)
      ) {
        setShowSerialNumberDropdown(false);
      }

      // Handle customer dropdown
      if (
        customerDropdownRef.current &&
        !customerDropdownRef.current.contains(event.target) &&
        phoneInputRef.current &&
        !phoneInputRef.current.contains(event.target)
      ) {
        setShowCustomerDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle serial number search
  const handleSerialNumberSearch = async (value) => {
    // Make sure value is a string
    const searchValue = String(value || '');

    setFormData({
      ...formData,
      serialNumber: searchValue
    });

    if (searchValue.trim().length < 2) {
      setSerialNumberResults([]);
      setShowSerialNumberDropdown(false);
      return;
    }

    setIsSearchingSerialNumbers(true);

    try {
      const results = await searchSerialNumbers(searchValue);
      setSerialNumberResults(results || []);
      setShowSerialNumberDropdown((results || []).length > 0);
    } catch (error) {
      console.error('Error searching serial numbers:', error);
      toast.error('Failed to search serial numbers');
      setSerialNumberResults([]);
      setShowSerialNumberDropdown(false);
    } finally {
      setIsSearchingSerialNumbers(false);
    }
  };

  // Handle serial number selection
  const handleSerialNumberSelect = async (serialNumber) => {
    // Make sure serialNumber is a string
    const serialNumberStr = String(serialNumber);

    setFormData({
      ...formData,
      serialNumber: serialNumberStr
    });
    setShowSerialNumberDropdown(false);

    // Automatically check warranty when a serial number is selected
    await handleCheckWarranty(serialNumberStr);
  };

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

    // Accept "Not Available" as a valid value
    if (email.trim().toLowerCase() === 'not available') {
      return "";
    }

    // More comprehensive email validation
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (emailPattern.test(email)) {
      return "";
    } else {
      return "Please enter a valid email address or 'Not Available'";
    }
  };

  // Handle phone number search
  const handlePhoneSearch = async (value) => {
    // Make sure value is a string
    const searchValue = String(value || '');

    setFormData({
      ...formData,
      phone: searchValue
    });

    // Don't search if less than 3 characters
    if (searchValue.trim().length < 3) {
      setCustomerResults([]);
      setShowCustomerDropdown(false);
      return;
    }

    setIsSearchingCustomers(true);

    try {
      const results = await searchCustomersByPhone(searchValue);
      setCustomerResults(results || []);
      setShowCustomerDropdown((results || []).length > 0);
    } catch (error) {
      console.error('Error searching customers:', error);
      toast.error('Failed to search customers');
      setCustomerResults([]);
      setShowCustomerDropdown(false);
    } finally {
      setIsSearchingCustomers(false);
    }
  };

  // Handle customer selection from dropdown
  const handleCustomerSelect = (customer) => {
    setFormData({
      ...formData,
      customer: customer.name,
      phone: customer.phone,
      email: customer.email || 'Not Available',
      customerId: customer.id
    });

    setShowCustomerDropdown(false);
    setAreCustomerFieldsReadOnly(true);

    toast.success(`Selected customer: ${customer.name}`);
    toast.info("Customer information fields have been auto-filled and locked.");
  };

  // Handle clearing customer fields
  const handleClearCustomerFields = () => {
    setFormData({
      ...formData,
      customer: "",
      phone: "",
      email: "",
      customerId: null
    });

    setAreCustomerFieldsReadOnly(false);
  };

  // Handle clearing serial number and related device fields
  const handleClearSerialNumber = () => {
    // Reset all device fields
    setFormData({
      ...formData,
      serialNumber: "",
      deviceType: "",
      deviceModel: "",
      isUnderWarranty: false
    });

    // Reset device fields read-only state
    setAreDeviceFieldsReadOnly(false);

    // If customer info was populated by serial number search, clear that too
    if (areCustomerFieldsReadOnly) {
      handleClearCustomerFields();
    }

    toast.info("Serial number and related information cleared");
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;

    // Special handling for serial number input to trigger search
    if (name === 'serialNumber') {
      handleSerialNumberSearch(value);
    }
    // Special handling for phone number input to trigger customer search
    else if (name === 'phone') {
      handlePhoneSearch(value);
    }
    // Regular field handling
    else {
      setFormData({
        ...formData,
        [name]: newValue
      });
    }

    // If form was already submitted once, validate on change
    // to give immediate feedback
    if (isSubmitted) {
      const errorMessage = validateField(name, newValue);
      setErrors(prev => ({
        ...prev,
        [name]: errorMessage
      }));

      // If estimated cost is changed, also validate advance payment
      // since advance payment validation depends on estimated cost
      if (name === 'estimatedCost' && formData.advancePayment && formData.advancePayment !== "0.00") {
        const advancePaymentError = validateField('advancePayment', formData.advancePayment);
        setErrors(prev => ({
          ...prev,
          advancePayment: advancePaymentError
        }));
      }
    }
  };



  // Handle checking warranty by serial number
  const handleCheckWarranty = async (serialNumberToCheck) => {
    // Make sure serialNumber is a string
    const serialNumber = String(serialNumberToCheck || formData.serialNumber);
    if (!serialNumber) return;

    setIsCheckingWarranty(true);

    try {
      const warrantyInfo = await checkWarrantyBySerialNumber(serialNumber);

      if (warrantyInfo) {
        // Update form with customer and product information
        setFormData({
          ...formData,
          customer: warrantyInfo.customer_name,
          phone: warrantyInfo.phone,
          email: warrantyInfo.email || 'Not Available',
          deviceType: warrantyInfo.category || formData.deviceType,
          deviceModel: warrantyInfo.product_name || formData.deviceModel,
          serialNumber: serialNumber,
          isUnderWarranty: warrantyInfo.is_under_warranty,
          customerId: warrantyInfo.customer_id // Store the customer ID for later use
        });

        // Set customer and device fields as read-only since they were auto-filled
        setAreCustomerFieldsReadOnly(true);
        setAreDeviceFieldsReadOnly(true);

        console.log('Retrieved customer ID from warranty info:', warrantyInfo.customer_id);

        // Show warranty information in toast
        if (warrantyInfo.is_under_warranty) {
          toast.success(`Product found: ${warrantyInfo.product_name} with ${warrantyInfo.warranty_remaining_days} days of warranty remaining.`);
        } else {
          toast.warning(`Product found: ${warrantyInfo.product_name}, but warranty has expired.`);
        }

        // Show a toast message indicating fields are locked
        toast.info("Customer and device information fields have been auto-filled and locked.");
      }
    } catch (error) {
      if (error.response && error.response.status === 404) {
        toast.warning("No product found with this serial number in our records.");
        // Reset read-only states if no product is found
        setAreCustomerFieldsReadOnly(false);
        setAreDeviceFieldsReadOnly(false);
      } else {
        toast.error("Error checking warranty: " + (error.response?.data?.message || error.message));
      }
    } finally {
      setIsCheckingWarranty(false);
    }
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
        if (!value || value.trim() === '' || value === "0.00") {
          error = "Estimated cost is required";
        } else if (isNaN(value.replace(/,/g, ''))) {
          error = "Please enter a valid amount";
        } else if (parseFloat(value.replace(/,/g, '')) < 0) {
          error = "Amount cannot be negative";
        } else if (parseFloat(value.replace(/,/g, '')) === 0) {
          error = "Estimated cost must be greater than zero";
        }
        break;

      case 'advancePayment':
        if (value && value.trim() !== '') {
          if (isNaN(value.replace(/,/g, ''))) {
            error = "Please enter a valid amount";
          } else if (parseFloat(value.replace(/,/g, '')) < 0) {
            error = "Amount cannot be negative";
          } else {
            // Check if advance payment exceeds estimated cost
            const advancePayment = parseFloat(value.replace(/,/g, ''));
            const estimatedCost = parseFloat(formData.estimatedCost.replace(/,/g, ''));

            if (!isNaN(estimatedCost) && advancePayment > estimatedCost) {
              error = "Advance payment cannot exceed the estimated cost";
            }
          }
        }
        break;

      case 'extraExpenses':
        if (value && value.trim() !== '') {
          if (isNaN(value.replace(/,/g, ''))) {
            error = "Please enter a valid amount";
          } else if (parseFloat(value.replace(/,/g, '')) < 0) {
            error = "Amount cannot be negative";
          }
        }
        break;

      case 'additionalNotes':
        if (value && value.trim().length > 500) {
          error = "Additional notes cannot exceed 500 characters";
        }
        break;

      default:
        break;
    }

    setErrors(prev => ({
      ...prev,
      [name]: error
    }));

    // Return the error message instead of a boolean
    return error;
  };

  // Validate all required fields
  const validateForm = () => {
    // Required fields that must be validated
    const requiredFields = [
      'customer', 'phone', 'email', 'deviceType',
      'deviceModel', 'issue', 'technician', 'deadline', 'estimatedCost'
    ];

    // Additional fields to validate if they have values
    const optionalFields = [
      'advancePayment', 'extraExpenses', 'additionalNotes'
    ];

    // Combine all fields to validate
    const fieldsToValidate = [...requiredFields, ...optionalFields];

    let isValid = true;
    const newErrors = {};

    console.log("Validating form data:", formData);

    fieldsToValidate.forEach(field => {
      // Check if field exists in formData
      if (!(field in formData)) {
        console.error(`Field ${field} is missing in formData`);
        newErrors[field] = `Field is missing`;
        isValid = false;
        return;
      }

      const errorMessage = validateField(field, formData[field]);
      if (errorMessage && errorMessage.length > 0) {
        console.error(`Validation error for ${field}:`, errorMessage);
        newErrors[field] = errorMessage;
        isValid = false;
      }
    });

    // Additional validation for advance payment not exceeding estimated cost
    if (formData.advancePayment && formData.estimatedCost) {
      const advancePayment = parseFloat(formData.advancePayment.replace(/,/g, ''));
      const estimatedCost = parseFloat(formData.estimatedCost.replace(/,/g, ''));

      if (!isNaN(advancePayment) && !isNaN(estimatedCost) && advancePayment > estimatedCost) {
        newErrors.advancePayment = "Advance payment cannot exceed the estimated cost";
        isValid = false;
        console.error("Validation error: Advance payment exceeds estimated cost");
      }
    }

    console.log("Validation result:", isValid ? "Valid" : "Invalid", newErrors);
    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Set form as submitted to show all errors
    setIsSubmitted(true);

    // Validate form
    const isValid = validateForm();

    if (isValid) {
      try {
        // Get today's date for dateReceived if not provided
        const today = new Date().toISOString().split('T')[0];

        // Step 1: Check if we need to create a new customer
        let customerId = formData.customerId; // This might be set if using serial number search

        // If we don't have a customerId but have customer information, we need to create or find a customer
        if (!customerId && formData.customer && formData.phone) {
          try {
            // First, try to find if the customer already exists by phone number
            const existingCustomer = await findCustomerByPhone(formData.phone);
            if (existingCustomer) {
              customerId = existingCustomer.id;
              console.log('Found existing customer:', existingCustomer);
              toast.info(`Using existing customer: ${existingCustomer.name}`);
            }
          } catch (error) {
            // If customer not found by phone, we'll create a new one
            if (error.response && error.response.status === 404) {
              // Create new customer
              const customerData = {
                name: formData.customer,
                phone: formData.phone,
                email: formData.email === 'Not Available' ? null : formData.email
              };

              console.log('Creating new customer with data:', customerData);
              const newCustomer = await createCustomer(customerData);
              customerId = newCustomer.id;
              console.log('Created new customer with ID:', customerId);
              toast.success(`Created new customer: ${newCustomer.name}`);
            } else {
              // If it's another error, throw it to be caught by the outer catch
              throw error;
            }
          }
        }

        // Ensure all data is properly formatted before submission
        const formattedFormData = {
          ...formData,
          // Add the customer ID if we have it
          customerId: customerId,
          // Ensure serialNumber is a string
          serialNumber: String(formData.serialNumber || ''),
          // Format currency values
          estimatedCost: formData.estimatedCost && formData.estimatedCost.replace(/,/g, '')
            ? parseFloat(formData.estimatedCost.replace(/,/g, '')).toLocaleString()
            : "0.00",
          advancePayment: formData.advancePayment && formData.advancePayment.replace(/,/g, '')
            ? parseFloat(formData.advancePayment.replace(/,/g, '')).toLocaleString()
            : "0.00",
          extraExpenses: formData.extraExpenses && formData.extraExpenses.replace(/,/g, '')
            ? parseFloat(formData.extraExpenses.replace(/,/g, '')).toLocaleString()
            : "0.00",
          // Ensure other fields are properly formatted
          customer: String(formData.customer || ''),
          phone: String(formData.phone || ''),
          email: String(formData.email || ''),
          deviceType: String(formData.deviceType || ''),
          deviceModel: String(formData.deviceModel || ''),
          issue: String(formData.issue || ''),
          technician: String(formData.technician || ''),
          status: String(formData.status || statusOptions[0] || 'Pending'),
          dateReceived: today,
          deadline: String(formData.deadline || ''),
          password: String(formData.password || ''),
          additionalNotes: String(formData.additionalNotes || ''),

          // Ensure boolean values are properly formatted
          isUnderWarranty: Boolean(formData.isUnderWarranty)
        };

        // Log the formatted data for debugging
        console.log('Submitting repair data:', formattedFormData);

        // Save the repair with the customer ID
        await onSave(formattedFormData);

        // Reset form
        setFormData(initialFormData);
        setErrors({});
        setIsSubmitted(false);

        // Show success message
        toast.success("Repair form submitted successfully!");
      } catch (error) {
        console.error("Error submitting form:", error);
        toast.error("Error submitting form: " + (error.response?.data?.message || error.message));
      }
    } else {
      toast.error("Please fix the validation errors before submitting.");
    }
  };

  // Format currency value with commas for thousand separators
  const formatCurrencyValue = (value) => {
    if (!value || value === "0.00") return "0.00";

    // Remove any existing commas and handle empty strings
    const numericValue = value.replace(/,/g, '');

    // Check if it's a valid number
    if (!numericValue || isNaN(numericValue)) return "0.00";

    // Convert to float and ensure it's not negative
    const floatValue = Math.max(0, parseFloat(numericValue));

    // Format with commas for thousand separators
    return floatValue.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  // Handle focus on currency fields
  const handleCurrencyFocus = (e) => {
    const { name, value } = e.target;

    // If the value is "0.00", clear it to make it easier for the user to enter a new value
    if (value === "0.00") {
      setFormData({
        ...formData,
        [name]: ""
      });
    }
  };

  // Handle blur on currency fields
  const handleCurrencyBlur = (e) => {
    const { name, value } = e.target;

    // If the field is empty, set it back to "0.00"
    if (!value || value.trim() === "") {
      // For estimatedCost, we need to keep the error state if it's required
      if (name === 'estimatedCost') {
        setFormData({
          ...formData,
          [name]: "0.00"
        });

        // Validate with the default value - this will show an error for estimatedCost
        const errorMessage = validateField(name, "0.00");
        setErrors(prev => ({
          ...prev,
          [name]: errorMessage
        }));
      } else {
        setFormData({
          ...formData,
          [name]: "0.00"
        });

        // Validate with the default value
        validateField(name, "0.00");
      }
    } else {
      // Check if the value is a valid number before formatting
      const numericValue = value.replace(/,/g, '');

      if (isNaN(numericValue)) {
        // If not a valid number, show error but don't change the value
        const errorMessage = `Please enter a valid amount`;
        setErrors(prev => ({
          ...prev,
          [name]: errorMessage
        }));
        return;
      }

      // Format the value with commas for thousand separators
      const formattedValue = formatCurrencyValue(value);

      setFormData({
        ...formData,
        [name]: formattedValue
      });

      // Validate the field with the formatted value
      const errorMessage = validateField(name, formattedValue);
      setErrors(prev => ({
        ...prev,
        [name]: errorMessage
      }));

      // If this is the estimatedCost field, also validate the advancePayment field
      // since the validation of advancePayment depends on estimatedCost
      if (name === 'estimatedCost' && formData.advancePayment && formData.advancePayment !== "0.00") {
        const advancePaymentError = validateField('advancePayment', formData.advancePayment);
        setErrors(prev => ({
          ...prev,
          advancePayment: advancePaymentError
        }));
      }
    }
  };

  // Handle blur event to show validation immediately when field loses focus
  const handleBlur = (e) => {
    const { name, value, type, checked } = e.target;
    const fieldValue = type === 'checkbox' ? checked : value;

    // Special handling for currency fields
    if (name === 'estimatedCost' || name === 'advancePayment' || name === 'extraExpenses') {
      handleCurrencyBlur(e);
    } else {
      // For other fields, validate and update errors
      const errorMessage = validateField(name, fieldValue);
      setErrors(prev => ({
        ...prev,
        [name]: errorMessage
      }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-md p-6 w-full h-full max-h-screen overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">New Repair Order</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-8">
          {/* Customer Information Section */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium mb-4 text-blue-600 border-b pb-2">Customer Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-gray-700 mb-1">
                  Customer Name <span className="text-red-500">*</span>
                  {areCustomerFieldsReadOnly && (
                    <span className="ml-2 text-xs text-blue-600 italic">(Auto-filled)</span>
                  )}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="customer"
                    value={formData.customer}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="Enter customer name"
                    className={`w-full px-3 py-2 border ${errors.customer ? 'border-red-500' : areCustomerFieldsReadOnly ? 'border-blue-300 bg-blue-50' : 'border-gray-300'} rounded-md ${areCustomerFieldsReadOnly ? 'cursor-not-allowed' : ''}`}
                    required
                    readOnly={areCustomerFieldsReadOnly}
                  />
                  {areCustomerFieldsReadOnly && (
                    <button
                      type="button"
                      onClick={handleClearCustomerFields}
                      className="absolute right-2 top-2.5 text-blue-500 hover:text-blue-700"
                      title="Clear customer information"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </button>
                  )}
                </div>
                {errors.customer && (
                  <p className="mt-1 text-sm text-red-500">{errors.customer}</p>
                )}
              </div>

              <div>
                <label className="block text-gray-700 mb-1">
                  Phone Number <span className="text-red-500">*</span>
                  {areCustomerFieldsReadOnly && (
                    <span className="ml-2 text-xs text-blue-600 italic">(Auto-filled)</span>
                  )}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="Enter phone number (e.g., 071 1234567)"
                    className={`w-full px-3 py-2 border ${errors.phone ? 'border-red-500' : areCustomerFieldsReadOnly ? 'border-blue-300 bg-blue-50' : 'border-gray-300'} rounded-md ${areCustomerFieldsReadOnly ? 'cursor-not-allowed' : ''}`}
                    required
                    readOnly={areCustomerFieldsReadOnly}
                    ref={phoneInputRef}
                  />
                  {isSearchingCustomers && (
                    <div className="absolute right-3 top-2.5">
                      <svg className="animate-spin h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    </div>
                  )}

                  {/* Customer Dropdown */}
                  {showCustomerDropdown && customerResults.length > 0 && (
                    <div
                      className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base overflow-auto focus:outline-none sm:text-sm"
                      ref={customerDropdownRef}
                    >
                      {customerResults.map((customer, index) => (
                        <div
                          key={index}
                          className="cursor-pointer hover:bg-gray-100 px-4 py-2"
                          onClick={() => handleCustomerSelect(customer)}
                        >
                          <div className="flex justify-between">
                            <span className="font-medium">{customer.name}</span>
                            <span className="text-gray-500">{customer.phone}</span>
                          </div>
                          <div className="text-sm text-gray-500">{customer.email || "No email"}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {errors.phone && (
                  <p className="mt-1 text-sm text-red-500">{errors.phone}</p>
                )}
                {formData.phone && formData.phone.length >= 3 && !isSearchingCustomers && customerResults.length === 0 && (
                  <p className="mt-1 text-xs text-gray-500"></p>
                )}
              </div>

              <div>
                <label className="block text-gray-700 mb-1">
                  Email <span className="text-red-500">*</span>
                  {areCustomerFieldsReadOnly && (
                    <span className="ml-2 text-xs text-blue-600 italic">(Auto-filled)</span>
                  )}
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="Enter email address"
                  className={`w-full px-3 py-2 border ${errors.email ? 'border-red-500' : areCustomerFieldsReadOnly ? 'border-blue-300 bg-blue-50' : 'border-gray-300'} rounded-md ${areCustomerFieldsReadOnly ? 'cursor-not-allowed' : ''}`}
                  required
                  readOnly={areCustomerFieldsReadOnly}
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-500">{errors.email}</p>
                )}
              </div>
            </div>
          </div>

          {/* Device Information Section */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium mb-4 text-blue-600 border-b pb-2">Device Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-gray-700 mb-1">
                  Device Type <span className="text-red-500">*</span>
                  {areDeviceFieldsReadOnly && (
                    <span className="ml-2 text-xs text-blue-600 italic">(Auto-filled)</span>
                  )}
                </label>
                <input
                  type="text"
                  name="deviceType"
                  value={formData.deviceType}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="Enter device type (e.g., Laptop, Desktop, Printer)"
                  className={`w-full px-3 py-2 border ${errors.deviceType ? 'border-red-500' : areDeviceFieldsReadOnly ? 'border-blue-300 bg-blue-50' : 'border-gray-300'} rounded-md ${areDeviceFieldsReadOnly ? 'cursor-not-allowed' : ''}`}
                  required
                  readOnly={areDeviceFieldsReadOnly}
                />
                {errors.deviceType && (
                  <p className="mt-1 text-sm text-red-500">{errors.deviceType}</p>
                )}
              </div>

              <div>
                <label className="block text-gray-700 mb-1">
                  Device Model <span className="text-red-500">*</span>
                  {areDeviceFieldsReadOnly && (
                    <span className="ml-2 text-xs text-blue-600 italic">(Auto-filled)</span>
                  )}
                </label>
                <input
                  type="text"
                  name="deviceModel"
                  value={formData.deviceModel}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="Enter device model (e.g., Dell XPS 13, HP LaserJet)"
                  className={`w-full px-3 py-2 border ${errors.deviceModel ? 'border-red-500' : areDeviceFieldsReadOnly ? 'border-blue-300 bg-blue-50' : 'border-gray-300'} rounded-md ${areDeviceFieldsReadOnly ? 'cursor-not-allowed' : ''}`}
                  required
                  readOnly={areDeviceFieldsReadOnly}
                />
                {errors.deviceModel && (
                  <p className="mt-1 text-sm text-red-500">{errors.deviceModel}</p>
                )}
              </div>

              <div>
                <label className="block text-gray-700 mb-1">
                  Serial Number
                  {areDeviceFieldsReadOnly && (
                    <span className="ml-2 text-xs text-blue-600 italic">(Auto-filled)</span>
                  )}
                </label>
                <div className="flex space-x-2">
                  <div className="relative flex-grow">
                    <input
                      type="text"
                      name="serialNumber"
                      value={formData.serialNumber}
                      onChange={handleChange}
                      placeholder="Enter or search for serial number"
                      className={`w-full px-3 py-2 border ${areDeviceFieldsReadOnly ? 'border-blue-300 bg-blue-50' : 'border-gray-300'} rounded-md ${areDeviceFieldsReadOnly ? 'cursor-not-allowed' : ''}`}
                      ref={serialNumberInputRef}
                      readOnly={areDeviceFieldsReadOnly}
                    />
                    {formData.serialNumber && (
                      <button
                        type="button"
                        onClick={handleClearSerialNumber}
                        className="absolute right-2 top-2.5 text-blue-500 hover:text-blue-700"
                        title="Clear serial number, customer information, device information, and warranty status"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      </button>
                    )}
                    {isSearchingSerialNumbers && !formData.serialNumber && (
                      <div className="absolute right-3 top-2.5">
                        <svg className="animate-spin h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      </div>
                    )}

                    {/* Serial Number Dropdown */}
                    {showSerialNumberDropdown && serialNumberResults.length > 0 && (
                      <div
                        className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base overflow-auto focus:outline-none sm:text-sm"
                        ref={serialNumberDropdownRef}
                      >
                        {serialNumberResults.map((result, index) => (
                          <div
                            key={index}
                            className="cursor-pointer hover:bg-gray-100 px-4 py-2"
                            onClick={() => handleSerialNumberSelect(result.serial_number)}
                          >
                            <div className="flex justify-between">
                              <span className="font-medium">{result.serial_number}</span>
                              <span className={result.is_under_warranty ? "text-green-600" : "text-red-500"}>
                                {result.is_under_warranty
                                  ? `${result.warranty_remaining_days} days left`
                                  : "Expired"}
                              </span>
                            </div>
                            <div className="text-sm text-gray-500">{result.product_name}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCheckWarranty()}
                    disabled={!formData.serialNumber || isCheckingWarranty}
                    className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
                  >
                    {isCheckingWarranty ? "Checking..." : "Check Warranty"}
                  </button>
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-gray-700 mb-1">
                  Repair Issue <span className="text-red-500">*</span>
                </label>
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
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="isUnderWarranty"
                  checked={formData.isUnderWarranty}
                  onChange={handleChange}
                  disabled={areDeviceFieldsReadOnly}
                  className={`h-4 w-4 text-blue-600 ${areDeviceFieldsReadOnly ? 'cursor-not-allowed' : ''}`}
                />
                <label className="ml-2 block text-gray-700">
                  Under Warranty {formData.isUnderWarranty && "(Verified)"}
                  {areDeviceFieldsReadOnly && (
                    <span className="ml-2 text-xs text-blue-600 italic">
                      {formData.isUnderWarranty
                        ? "(Auto-verified: Under warranty)"
                        : "(Auto-verified: No warranty)"}
                    </span>
                  )}
                </label>
              </div>
            </div>
          </div>

          {/* Additional Details Section */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium mb-4 text-blue-600 border-b pb-2">Additional Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-gray-700 mb-1">
                  Technician <span className="text-red-500">*</span>
                </label>
                <select
                  name="technician"
                  value={formData.technician}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`w-full px-3 py-2 border ${errors.technician ? 'border-red-500' : 'border-gray-300'} rounded-md appearance-none`}
                  required
                >
                  <option value="" disabled>Select technician</option>
                  {Array.isArray(technicians) && technicians.length > 0 ? (
                    technicians.map((tech, index) => {
                      // Handle both object and string technicians for backward compatibility
                      const value = typeof tech === 'object' ? `${tech.User_ID}` : tech;
                      const displayName = typeof tech === 'object' ?
                        `${tech.first_name} ${tech.last_name || ''}`.trim() || tech.Username || `Technician ${tech.User_ID}` : tech;

                      console.log(`Rendering technician option: ${displayName} with value ${value}`);

                      return (
                        <option key={index} value={value}>
                          {displayName}
                        </option>
                      );
                    })
                  ) : (
                    <option value="" disabled>No technicians available</option>
                  )}
                </select>
                {errors.technician && (
                  <p className="mt-1 text-sm text-red-500">{errors.technician}</p>
                )}
              </div>

              <div>
                <label className="block text-gray-700 mb-1">
                  Deadline <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="deadline"
                  value={formData.deadline}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  min={new Date().toISOString().split('T')[0]}
                  className={`w-full px-3 py-2 border ${errors.deadline ? 'border-red-500' : 'border-gray-300'} rounded-md`}
                  required
                />
                {errors.deadline && (
                  <p className="mt-1 text-sm text-red-500">{errors.deadline}</p>
                )}
              </div>

              <div>
                <label className="block text-gray-700 mb-1">
                  Estimated Cost <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="estimatedCost"
                  value={formData.estimatedCost}
                  onChange={handleChange}
                  onFocus={handleCurrencyFocus}
                  onBlur={handleBlur}
                  placeholder="0.00"
                  className={`w-full px-3 py-2 border ${errors.estimatedCost ? 'border-red-500' : 'border-gray-300'} rounded-md`}
                  required
                />
                {errors.estimatedCost && (
                  <p className="mt-1 text-sm text-red-500">{errors.estimatedCost}</p>
                )}
              </div>

              <div>
                <label className="block text-gray-700 mb-1">
                  Password (if provided)
                </label>
                <input
                  type="text"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter device password if provided"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-gray-700 mb-1">
                  Advance Payment
                </label>
                <input
                  type="text"
                  name="advancePayment"
                  value={formData.advancePayment}
                  onChange={handleChange}
                  onFocus={handleCurrencyFocus}
                  onBlur={handleBlur}
                  placeholder="0.00"
                  className={`w-full px-3 py-2 border ${errors.advancePayment ? 'border-red-500' : 'border-gray-300'} rounded-md`}
                />
                {errors.advancePayment && (
                  <p className="mt-1 text-sm text-red-500">{errors.advancePayment}</p>
                )}
              </div>

              <div>
                <label className="block text-gray-700 mb-1">
                  Extra Expenses
                </label>
                <input
                  type="text"
                  name="extraExpenses"
                  value={formData.extraExpenses}
                  onChange={handleChange}
                  onFocus={handleCurrencyFocus}
                  onBlur={handleBlur}
                  placeholder="0.00"
                  className={`w-full px-3 py-2 border ${errors.extraExpenses ? 'border-red-500' : 'border-gray-300'} rounded-md`}
                />
                {errors.extraExpenses && (
                  <p className="mt-1 text-sm text-red-500">{errors.extraExpenses}</p>
                )}
              </div>

              <div className="md:col-span-3">
                <label className="block text-gray-700 mb-1">
                  Additional Notes
                </label>
                <textarea
                  name="additionalNotes"
                  value={formData.additionalNotes}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="Enter any additional notes about the repair"
                  rows="3"
                  className={`w-full px-3 py-2 border ${errors.additionalNotes ? 'border-red-500' : 'border-gray-300'} rounded-md`}
                ></textarea>
                {errors.additionalNotes && (
                  <p className="mt-1 text-sm text-red-500">{errors.additionalNotes}</p>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-4 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Save Repair
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddRepairModal;