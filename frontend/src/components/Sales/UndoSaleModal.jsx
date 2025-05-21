import React, { useState } from 'react';
import { FaExclamationTriangle } from 'react-icons/fa';

const UndoSaleModal = ({ isOpen, onClose, onConfirm, sale }) => {
  const [reasonType, setReasonType] = useState('');
  const [reasonDetails, setReasonDetails] = useState('');
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !sale) return null;

  const validateForm = () => {
    const newErrors = {};

    if (!reasonType) {
      newErrors.reasonType = 'Please select a reason';
    }

    if (reasonType === 'Other' && !reasonDetails.trim()) {
      newErrors.reasonDetails = 'Please provide details for "Other" reason';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      await onConfirm(reasonType, reasonDetails);
      onClose();
    } catch (error) {
      console.error('Error undoing sale:', error);
      // Error will be handled by the parent component
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
        <div className="p-6">
          <div className="flex items-center mb-4">
            <FaExclamationTriangle className="text-yellow-500 text-2xl mr-2" />
            <h2 className="text-xl font-semibold">Undo Sale</h2>
          </div>

          <p className="mb-4 text-gray-700">
            You are about to undo sale #{sale.invoice_no || sale.bill_no}. This action will:
          </p>

          <ul className="list-disc pl-5 mb-4 text-gray-700 text-sm">
            <li>Remove the sale record from the system</li>
            <li>Return all items to inventory</li>
            <li>Create an audit log entry with your reason</li>
          </ul>

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Reason for undoing this sale: <span className="text-red-500">*</span>
              </label>
              <select
                className={`w-full p-2 border rounded ${errors.reasonType ? 'border-red-500' : 'border-gray-300'}`}
                value={reasonType}
                onChange={(e) => setReasonType(e.target.value)}
                disabled={isSubmitting}
              >
                <option value="">-- Select a reason --</option>
                <option value="Incorrect item">Incorrect item</option>
                <option value="Wrong quantity">Wrong quantity</option>
                <option value="Customer changed mind">Customer changed mind</option>
                <option value="Pricing error">Pricing error</option>
                <option value="Other">Other</option>
              </select>
              {errors.reasonType && (
                <p className="text-red-500 text-xs mt-1">{errors.reasonType}</p>
              )}
            </div>

            {reasonType === 'Other' && (
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Please specify: <span className="text-red-500">*</span>
                </label>
                <textarea
                  className={`w-full p-2 border rounded ${errors.reasonDetails ? 'border-red-500' : 'border-gray-300'}`}
                  rows="3"
                  value={reasonDetails}
                  onChange={(e) => setReasonDetails(e.target.value)}
                  placeholder="Please provide details..."
                  disabled={isSubmitting}
                ></textarea>
                {errors.reasonDetails && (
                  <p className="text-red-500 text-xs mt-1">{errors.reasonDetails}</p>
                )}
              </div>
            )}

            <div className="flex justify-end mt-6 space-x-2">
              <button
                type="button"
                className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400 transition-colors"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors flex items-center"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <span className="animate-spin h-4 w-4 border-2 border-white rounded-full border-t-transparent mr-2"></span>
                    Processing...
                  </>
                ) : (
                  'Confirm Undo'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UndoSaleModal;
