import React from "react";
import { FaTimes } from "react-icons/fa";

const ViewReturnModal = ({ isOpen, onClose, returnItem }) => {
  if (!isOpen || !returnItem) return null;

  // Debug log to check returnItem data
  console.log("ViewReturnModal - returnItem:", returnItem);

  // Format currency
  const formatCurrency = (amount) => {
    if (!amount) return "N/A";
    return new Intl.NumberFormat("en-LK", {
      style: "currency",
      currency: "LKR",
      minimumFractionDigits: 2,
    })
      .format(amount)
      .replace("LKR", "")
      .trim();
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";

    // Log the date string for debugging
    console.log("Date string received:", dateString, "Type:", typeof dateString);

    // If the date string is already in YYYY-MM-DD format, return it as is
    if (typeof dateString === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      return dateString;
    }

    // If the date string contains a 'T', it's in ISO format, so extract just the date part
    if (typeof dateString === 'string' && dateString.includes('T')) {
      return dateString.split('T')[0];
    }

    // Handle MySQL date format (YYYY-MM-DD HH:MM:SS)
    if (typeof dateString === 'string' && dateString.includes(' ') && dateString.includes(':')) {
      return dateString.split(' ')[0];
    }

    // Otherwise, try to format it as a date
    try {
      const date = new Date(dateString);

      // Check if the date is valid
      if (isNaN(date.getTime())) {
        console.log("Invalid date:", dateString);
        // If it's not a valid date but it's a string, return it as is
        if (typeof dateString === 'string') {
          return dateString;
        }
        return "N/A";
      }

      // Format as YYYY-MM-DD
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    } catch (error) {
      console.error("Error formatting date:", error);
      // If there's an error parsing the date but it's a string, return it as is
      if (typeof dateString === 'string') {
        return dateString;
      }
      return "N/A";
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 overflow-y-auto">
      <div className="bg-white rounded-md p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Return Details</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <FaTimes size={20} />
          </button>
        </div>

        {/* Return Information */}
        <div className="mb-6">
          <h3 className="text-md font-medium mb-3 text-blue-600 border-b pb-2">
            Return Information
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Return ID</p>
              <p className="font-medium">{returnItem.return_id}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Return Date</p>
              <p className="font-medium">
                {returnItem.return_date
                  ? (typeof returnItem.return_date === 'string' && returnItem.return_date.includes('T')
                      ? returnItem.return_date.split('T')[0]
                      : returnItem.return_date)
                  : "N/A"}
              </p>
            </div>
            <div className="col-span-2">
              <p className="text-sm text-gray-500">Return Reason</p>
              <p className="font-medium">{returnItem.return_reason}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Quantity</p>
              <p className="font-medium">{returnItem.quantity}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Purchase Price</p>
              <p className="font-medium">
                {returnItem.buying_price
                  ? `Rs. ${formatCurrency(returnItem.buying_price)}`
                  : "N/A"}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Value</p>
              <p className="font-medium">
                {returnItem.buying_price
                  ? `Rs. ${formatCurrency(parseFloat(returnItem.buying_price) * returnItem.quantity)}`
                  : "N/A"}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Refund Amount</p>
              <p className="font-medium">Rs. {formatCurrency(returnItem.refund_amount)}</p>
            </div>
          </div>
        </div>

        {/* Supplier Information */}
        <div className="mb-6">
          <h3 className="text-md font-medium mb-3 text-blue-600 border-b pb-2">
            Supplier Information
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Supplier Name</p>
              <p className="font-medium">{returnItem.supplier_name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Shop Name</p>
              <p className="font-medium">{returnItem.shop_name}</p>
            </div>
          </div>
        </div>

        {/* Product Information */}
        <div className="mb-6">
          <h3 className="text-md font-medium mb-3 text-blue-600 border-b pb-2">
            Product Information
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Product</p>
              <p className="font-medium">{returnItem.product_name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Product ID</p>
              <p className="font-medium">{returnItem.product_id}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Purchase ID</p>
              <p className="font-medium">{returnItem.purchase_id}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Purchase Date</p>
              <p className="font-medium">
                {returnItem.purchase_date
                  ? (typeof returnItem.purchase_date === 'string'
                      ? (returnItem.purchase_date.includes('T')
                          ? returnItem.purchase_date.split('T')[0]
                          : (returnItem.purchase_date.includes(' ') && returnItem.purchase_date.includes(':')
                              ? returnItem.purchase_date.split(' ')[0]
                              : returnItem.purchase_date))
                      : "N/A")
                  : "N/A"}
              </p>
            </div>
          </div>
        </div>

        {/* Additional Notes */}
        {returnItem.notes && (
          <div className="mb-6">
            <h3 className="text-md font-medium mb-3 text-blue-600 border-b pb-2">
              Additional Notes
            </h3>
            <p className="text-gray-700">{returnItem.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ViewReturnModal;
