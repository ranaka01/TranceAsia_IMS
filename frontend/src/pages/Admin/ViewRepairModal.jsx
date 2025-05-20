import React, { useState, useEffect } from "react";
import { formatDeadlineDate } from "../../utils/dateUtils";
import { toast } from "react-toastify";
import { generateRepairReceipt, savePDF } from "../../utils/simplePdfGenerator";

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
      const errorMessage = validateField(name, newValue);
      setErrors(prev => ({
        ...prev,
        [name]: errorMessage
      }));
    }
  };



  // Toggle edit mode
  const toggleEditMode = () => {
    setIsEditing(!isEditing);
    setErrors({});
    setIsSubmitted(false);
  };

  // Handle printing bill
  const handlePrintBill = () => {
    // Only generate PDF for repairs with "Picked Up" status
    if (repair.status !== "Picked Up") {
      toast.info("PDF receipts can only be generated for repairs with 'Picked Up' status");
      return;
    }

    try {
      // Generate the PDF document
      const doc = generateRepairReceipt(repair, technicians);

      // Save the PDF with a filename based on the repair ID
      const filename = `repair-receipt-${repair.id}.pdf`;
      savePDF(doc, filename);

      toast.success("Receipt PDF generated successfully");
    } catch (err) {
      console.error("Error generating PDF:", err);
      toast.error(`Failed to generate PDF receipt: ${err.message}`);
    }
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
        } else if (isNaN(value.toString().replace(/,/g, ''))) {
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

    // Return the error message string - empty string means no error
    return error;
  };

  // Validate only the editable fields
  const validateForm = () => {
    // Only validate the fields that are editable in edit mode
    // Removed estimatedCost as it's now read-only
    const fieldsToValidate = [
      'issue', 'technician'
    ];

    let isValid = true;
    const newErrors = {};

    fieldsToValidate.forEach(field => {
      const fieldValue = formData[field];
      const errorMessage = validateField(field, fieldValue);
      // If errorMessage is not empty, there's an error
      if (errorMessage !== "") {
        newErrors[field] = errorMessage;
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
      try {
        // Create a formatted form data object with all fields
        // For read-only fields, use the original repair values
        const formattedFormData = {
          ...formData,
          // Use original values for read-only fields
          estimatedCost: repair.estimatedCost,
          advancePayment: repair.advancePayment,
          password: repair.password,
          // Format the extraExpenses field which is still editable
          extraExpenses: formData.extraExpenses && formData.extraExpenses.replace(/,/g, '')
            ? parseFloat(formData.extraExpenses.replace(/,/g, '')).toLocaleString()
            : "0.00"
        };

        console.log("Submitting updated repair data:", formattedFormData);
        onUpdate(formattedFormData);
        setIsEditing(false);
      } catch (error) {
        console.error("Error formatting repair data:", error);
        toast.error("Error updating repair: " + error.message);
      }
    } else {
      toast.error("Please fix the validation errors before submitting.");
    }
  };

  // Handle blur event to show validation immediately when field loses focus
  const handleBlur = (e) => {
    if (isEditing) {
      const { name, value, type, checked } = e.target;
      const fieldValue = type === 'checkbox' ? checked : value;
      const errorMessage = validateField(name, fieldValue);

      // Update the specific error in the errors state
      setErrors(prev => ({
        ...prev,
        [name]: errorMessage
      }));
    }
  };

  // Use the imported formatDeadlineDate function for date formatting

  // Get status badge styling
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "Pending":
        return "bg-yellow-100 text-yellow-800";

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
      <div className="bg-white rounded-md p-6 w-full h-full max-h-screen overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            <h2 className="text-xl font-semibold">Repair #{repair.id}</h2>
            <span className={`ml-3 px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(repair.status)}`}>
              {repair.status}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            {!isEditing && (
              <>
                {/* <button
                  onClick={handlePrintBill}
                  className={`px-3 py-1 border rounded ${
                    repair.status === "Picked Up"
                      ? "text-purple-600 hover:text-purple-800 border-purple-600 hover:bg-purple-50"
                      : "text-gray-400 border-gray-400 cursor-not-allowed"
                  }`}
                  disabled={repair.status !== "Picked Up"}
                  title={
                    repair.status === "Picked Up"
                      ? "Generate Receipt PDF"
                      : "PDF receipts can only be generated for repairs with 'Picked Up' status"
                  }
                >
                  Print Bill
                </button>
                <button
                  onClick={handlePrintWorkOrder}
                  className="text-indigo-600 hover:text-indigo-800 px-3 py-1 border border-indigo-600 rounded hover:bg-indigo-50"
                  title="Generate Work Order PDF"
                >
                  Work Order
                </button> */}
                <button
                  onClick={toggleEditMode}
                  className="text-blue-600 hover:text-blue-800 px-3 py-1 border border-blue-600 rounded hover:bg-blue-50"
                  title="Edit repair details"
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

        <form onSubmit={handleSubmit} noValidate className="space-y-8">
          {/* Customer Information Section */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium mb-4 text-blue-600 border-b pb-2">Customer Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-gray-700 mb-1 flex items-center">
                  Customer Name <span className="text-red-500">*</span>
                  {isEditing && <span className="ml-2 text-xs text-gray-500 italic">(Read-only)</span>}
                </label>
                <p className="py-2 px-3 bg-gray-50 rounded-md border border-gray-200">{repair.customer}</p>
              </div>

              <div>
                <label className="block text-gray-700 mb-1 flex items-center">
                  Phone Number <span className="text-red-500">*</span>
                  {isEditing && <span className="ml-2 text-xs text-gray-500 italic">(Read-only)</span>}
                </label>
                <p className="py-2 px-3 bg-gray-50 rounded-md border border-gray-200">{repair.phone}</p>
              </div>

              <div>
                <label className="block text-gray-700 mb-1 flex items-center">
                  Email <span className="text-red-500">*</span>
                  {isEditing && <span className="ml-2 text-xs text-gray-500 italic">(Read-only)</span>}
                </label>
                <p className="py-2 px-3 bg-gray-50 rounded-md border border-gray-200">{repair.email}</p>
              </div>
            </div>
          </div>

          {/* Device Information Section */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium mb-4 text-blue-600 border-b pb-2">Device Information</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-gray-700 mb-1 flex items-center">
                    Device Type <span className="text-red-500">*</span>
                    {isEditing && <span className="ml-2 text-xs text-gray-500 italic">(Read-only)</span>}
                  </label>
                  <p className="py-2 px-3 bg-gray-50 rounded-md border border-gray-200">{repair.deviceType}</p>
                </div>

                <div>
                  <label className="block text-gray-700 mb-1 flex items-center">
                    Device Model <span className="text-red-500">*</span>
                    {isEditing && <span className="ml-2 text-xs text-gray-500 italic">(Read-only)</span>}
                  </label>
                  <p className="py-2 px-3 bg-gray-50 rounded-md border border-gray-200">{repair.deviceModel}</p>
                </div>

                <div>
                  <label className="block text-gray-700 mb-1 flex items-center">
                    Serial Number
                    {isEditing && <span className="ml-2 text-xs text-gray-500 italic">(Read-only)</span>}
                  </label>
                  <p className="py-2 px-3 bg-gray-50 rounded-md border border-gray-200">
                    {repair.serialNumber || "Not provided"}
                  </p>
                </div>
              </div>

              <div>
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
                  <p className="py-2 px-3 bg-white rounded-md border border-gray-200">{repair.issue}</p>
                )}
              </div>

              <div className="flex items-center">
                <div className="flex items-center">
                  <span className="text-gray-700 mr-2">Under Warranty:</span>
                  <span className={`${repair.isUnderWarranty ? 'text-green-600 font-medium' : 'text-gray-600'}`}>
                    {repair.isUnderWarranty ? "Yes" : "No"}
                  </span>
                  {isEditing && <span className="ml-2 text-xs text-gray-500 italic">(Read-only)</span>}
                </div>
              </div>

              {!isEditing && (
                <div>
                  <label className="block text-gray-700 mb-1">
                    Status
                  </label>
                  <div className="flex items-center py-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(repair.status)}`}>
                      {repair.status}
                    </span>
                  </div>
                </div>
              )}

              {isEditing && (
                <div>
                  <label className="block text-gray-700 mb-1">
                    Status
                  </label>
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
                </div>
              )}
            </div>
          </div>

          {/* Additional Details Section */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium mb-4 text-blue-600 border-b pb-2">Additional Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-4">
                <div>
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
                        {Array.isArray(technicians) && technicians.length > 0 ? (
                          technicians.map((tech, index) => {
                            // Handle both object and string technicians for backward compatibility
                            const value = typeof tech === 'object' ? `${tech.User_ID}` : tech;
                            const displayName = typeof tech === 'object' ?
                              `${tech.first_name} ${tech.last_name || ''}`.trim() || tech.Username || `Technician ${tech.User_ID}` : tech;

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
                    </>
                  ) : (
                    <p className="py-2 px-3 bg-white rounded-md border border-gray-200">
                      {/* Display technician name from the technicians array if possible */}
                      {(() => {
                        // Try to find the technician in the technicians array
                        if (Array.isArray(technicians)) {
                          const techId = repair.technician;
                          console.log(`Looking for technician with ID: ${techId} in`, technicians);

                          const foundTech = technicians.find(t =>
                            (typeof t === 'object' && `${t.User_ID}` === techId) || t === techId
                          );

                          if (foundTech) {
                            const displayName = typeof foundTech === 'object' ?
                              `${foundTech.first_name} ${foundTech.last_name || ''}`.trim() || foundTech.Username || `Technician ${foundTech.User_ID}` :
                              foundTech;

                            console.log(`Found technician:`, foundTech, `Display name: ${displayName}`);
                            return displayName;
                          } else {
                            console.log(`Technician with ID ${techId} not found in technicians array`);
                          }
                        }

                        // Fallback to the stored technician value
                        console.log(`Using fallback technician value: ${repair.technician}`);
                        return repair.technician;
                      })()}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-gray-700 mb-1 flex items-center">
                    Deadline <span className="text-red-500">*</span>
                    {isEditing && <span className="ml-2 text-xs text-gray-500 italic">(Read-only)</span>}
                  </label>
                  <p className="py-2 px-3 bg-gray-50 rounded-md border border-gray-200">
                    {formatDeadlineDate(repair.deadline)}
                  </p>
                </div>

                <div>
                  <label className="block text-gray-700 mb-1">
                    Repair Received Date
                  </label>
                  <p className="py-2 px-3 bg-white rounded-md border border-gray-200">
                    {formatDeadlineDate(repair.dateReceived)}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-gray-700 mb-1 flex items-center">
                    Estimated Cost <span className="text-red-500">*</span>
                    {isEditing && <span className="ml-2 text-xs text-gray-500 italic">(Read-only)</span>}
                  </label>
                  <p className="py-2 px-3 bg-gray-50 rounded-md border border-gray-200">
                    Rs. {repair.estimatedCost}
                  </p>
                </div>

                <div>
                  <label className="block text-gray-700 mb-1 flex items-center">
                    Advance Payment
                    {isEditing && <span className="ml-2 text-xs text-gray-500 italic">(Read-only)</span>}
                  </label>
                  <p className="py-2 px-3 bg-gray-50 rounded-md border border-gray-200">
                    Rs. {repair.advancePayment}
                  </p>
                </div>

                <div>
                  <label className="block text-gray-700 mb-1">
                    Extra Expenses
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="extraExpenses"
                      value={formData.extraExpenses}
                      onChange={handleChange}
                      placeholder="Enter additional expenses"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  ) : (
                    <p className="py-2 px-3 bg-white rounded-md border border-gray-200">
                      Rs. {repair.extraExpenses || "0.00"}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-gray-700 mb-1 flex items-center">
                    Password (if provided)
                    {isEditing && <span className="ml-2 text-xs text-gray-500 italic">(Read-only)</span>}
                  </label>
                  <p className="py-2 px-3 bg-gray-50 rounded-md border border-gray-200">
                    {repair.password || "Not provided"}
                  </p>
                </div>
              </div>

              <div className="md:col-span-3">
                <div>
                  <label className="block text-gray-700 mb-1">
                    Additional Notes
                  </label>
                  {isEditing ? (
                    <textarea
                      name="additionalNotes"
                      value={formData.additionalNotes}
                      onChange={handleChange}
                      placeholder="Enter any additional notes about the repair"
                      rows="5"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    ></textarea>
                  ) : (
                    <p className="py-2 px-3 bg-white rounded-md border border-gray-200 min-h-24">
                      {repair.additionalNotes || "No additional notes"}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {isEditing && (
            <div className="flex justify-end space-x-4 mt-6">
              <button
                type="button"
                onClick={toggleEditMode}
                className="px-6 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
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