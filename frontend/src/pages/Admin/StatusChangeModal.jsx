import React, { useState, useEffect } from "react";
import {
  getValidNextStatuses,
  isValidStatusTransition,
  getInvalidTransitionMessage
} from "../../utils/repairStatusUtils";
import { toast } from "react-toastify";

const StatusChangeModal = ({
  isOpen,
  onClose,
  onUpdate,
  repair,
  statusOptions
}) => {
  const [selectedStatus, setSelectedStatus] = useState("");
  const [availableStatuses, setAvailableStatuses] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Reset selected status and get valid next statuses when repair changes
  useEffect(() => {
    if (repair) {
      try {
        // Get valid next statuses based on current status
        const validNextStatuses = getValidNextStatuses(repair.status);
        setAvailableStatuses(validNextStatuses);

        // Set the first valid next status as the default selected status
        if (validNextStatuses.length > 0) {
          setSelectedStatus(validNextStatuses[0]);
        } else {
          setSelectedStatus("");
          // If there are no valid next statuses, show a message
          setErrorMessage("This repair has reached its final status and cannot be updated further.");
        }

        console.log(`Current repair status: ${repair.status}`);
        console.log(`Valid next statuses:`, validNextStatuses);
      } catch (error) {
        console.error("Error getting valid next statuses:", error);
        setErrorMessage("Error determining valid status options.");
        setAvailableStatuses([]);
        setSelectedStatus("");
      }
    }
  }, [repair]);

  const handleStatusChange = (e) => {
    const newStatus = e.target.value;
    setSelectedStatus(newStatus);

    // Validate the status transition
    if (!isValidStatusTransition(repair.status, newStatus)) {
      const message = getInvalidTransitionMessage(repair.status, newStatus);
      setErrorMessage(message);
    } else {
      setErrorMessage("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");

    try {
      // Validate the status transition
      if (!isValidStatusTransition(repair.status, selectedStatus)) {
        const message = getInvalidTransitionMessage(repair.status, selectedStatus);
        setErrorMessage(message);
        setIsSubmitting(false);
        return;
      }

      console.log(`Submitting status change from ${repair.status} to ${selectedStatus}`);

      try {
        // Call the update function with the new status and previous status
        const response = await onUpdate(selectedStatus, repair.status);

        // Display appropriate toast notification based on email status
        if (response?.data?.emailSent) {
          toast.success(response.data.message || "Status updated and notification email sent");
        } else if (response?.data?.emailSkipped) {
          toast.info(response.data.message || "Status updated (email notification skipped - no valid email)");
        } else if (response?.data?.emailError) {
          toast.warning(response.data.message || "Status updated but failed to send notification email");
        }

        // If we get here, the update was successful
      } catch (updateError) {
        console.error("Error from update function:", updateError);
        setErrorMessage(updateError.message || "An error occurred while updating the status.");
        setIsSubmitting(false);
      }
    } catch (validationError) {
      console.error("Error validating status change:", validationError);
      setErrorMessage(validationError.message || "An error occurred during validation.");
      setIsSubmitting(false);
    }
  };

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
    <div className="fixed inset-0 bg-gray-100 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-md p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Update Repair Status</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <div className="mb-4">
          <p className="text-sm text-gray-500">
            Repair #{repair.id} for {repair.customer} - {repair.deviceModel}
          </p>
          <div className="mt-2">
            <span className="mr-2">Current status:</span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(repair.status)}`}>
              {repair.status}
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label className="block text-gray-700 mb-2">
              New Status <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedStatus}
              onChange={handleStatusChange}
              className={`w-full px-3 py-2 border ${errorMessage ? 'border-red-500' : 'border-gray-300'} rounded-md appearance-none`}
              required
              disabled={isSubmitting || availableStatuses.length === 0}
            >
              {availableStatuses.length > 0 ? (
                availableStatuses.map((status, index) => (
                  <option key={index} value={status}>
                    {status}
                  </option>
                ))
              ) : (
                <option value="" disabled>
                  No valid next statuses available
                </option>
              )}
            </select>
            {errorMessage && (
              <p className="mt-1 text-sm text-red-500">{errorMessage}</p>
            )}
            {availableStatuses.length === 0 && !errorMessage && (
              <p className="mt-1 text-sm text-yellow-500">
                This repair has reached its final status and cannot be updated further.
              </p>
            )}
          </div>

          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
              disabled={
                isSubmitting ||
                errorMessage !== "" ||
                availableStatuses.length === 0 ||
                selectedStatus === repair.status
              }
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Updating...
                </>
              ) : (
                "Update Status"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StatusChangeModal;