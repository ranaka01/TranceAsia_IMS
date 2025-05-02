import React, { useState } from "react";

const StatusChangeModal = ({ 
  isOpen, 
  onClose, 
  onUpdate, 
  repair, 
  statusOptions 
}) => {
  const [selectedStatus, setSelectedStatus] = useState(repair?.status || statusOptions[0]);
  const [note, setNote] = useState("");

  const handleStatusChange = (e) => {
    setSelectedStatus(e.target.value);
  };

  const handleNoteChange = (e) => {
    setNote(e.target.value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Call the update function with the new status
    onUpdate(selectedStatus);
    
    // In a real implementation, you might also save the note
    // associated with this status change
    
    // Reset form
    setNote("");
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
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">
              New Status <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedStatus}
              onChange={handleStatusChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md appearance-none"
              required
            >
              {statusOptions.map((status, index) => (
                <option key={index} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
          
          <div className="mb-6">
            <label className="block text-gray-700 mb-2">
              Status Change Note
            </label>
            <textarea
              value={note}
              onChange={handleNoteChange}
              placeholder="Enter any notes about this status change"
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            ></textarea>
            <p className="mt-1 text-xs text-gray-500">
              Optional: Add notes about what was done or why the status is changing
            </p>
          </div>
          
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Update Status
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StatusChangeModal;