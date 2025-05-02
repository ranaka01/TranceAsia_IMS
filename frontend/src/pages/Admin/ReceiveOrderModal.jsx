const handleSupplyPriceChange = (index, value) => {
  const updatedItems = [...receivedItems];
  const supplyPrice = parseFloat(value) || 0;
  
  // When supply price changes, update selling price based on profit percentage
  const profitPercentage = updatedItems[index].profitPercentage;
  const newSellingPrice = supplyPrice * (1 + profitPercentage / 100);
  
  updatedItems[index] = {
    ...updatedItems[index],
    supplyPrice: supplyPrice,
    sellingPrice: Math.round(newSellingPrice * 100) / 100 // Round to 2 decimal places
  };
  
  setReceivedItems(updatedItems);
};import React, { useState, useEffect } from "react";
import Button from "./Button";

const ReceiveOrderModal = ({ isOpen, onClose, order, onReceive }) => {
const [receivedItems, setReceivedItems] = useState([]);
const [receiptDate, setReceiptDate] = useState(
  new Date().toISOString().split("T")[0]
);
const [receiptNotes, setReceiptNotes] = useState("");
const [errors, setErrors] = useState({});

// Initialize received items whenever the order changes
useEffect(() => {
  if (order) {
    // Create a record for each item that hasn't been fully received yet
    const items = order.items
      .filter(item => item.received < item.quantity)
      .map(item => ({
        id: item.id,
        name: item.name,
        orderedQuantity: item.quantity,
        receivedSoFar: item.received || 0,
        remainingQuantity: item.quantity - (item.received || 0),
        receivedQuantity: 0, // Will be filled by user
        unitPrice: item.unitPrice, // Original supply price
        supplyPrice: item.unitPrice, // Adjustable supply price (starts with original)
        profitPercentage: 0, // Profit percentage, initially 0
        sellingPrice: item.unitPrice, // Selling price (starts with original)
      }));
    
    setReceivedItems(items);
  }
}, [order]);

const validateForm = () => {
  const newErrors = {};
  let formIsValid = true;

  // Check if any items are being received
  const totalReceived = receivedItems.reduce(
    (sum, item) => sum + (item.receivedQuantity || 0),
    0
  );

  if (totalReceived <= 0) {
    newErrors.general = "You must receive at least one item";
    formIsValid = false;
  }

  // Validate each item
  const itemErrors = [];
  receivedItems.forEach((item, index) => {
    const currentErrors = {};
    
    if (item.receivedQuantity < 0) {
      currentErrors.receivedQuantity = "Cannot be negative";
      formIsValid = false;
    }
    
    if (item.receivedQuantity > item.remainingQuantity) {
      currentErrors.receivedQuantity = `Cannot exceed remaining quantity (${item.remainingQuantity})`;
      formIsValid = false;
    }
    
    if (item.supplyPrice <= 0) {
      currentErrors.supplyPrice = "Supply price must be greater than 0";
      formIsValid = false;
    }
    
    if (item.sellingPrice <= 0) {
      currentErrors.sellingPrice = "Selling price must be greater than 0";
      formIsValid = false;
    }
    
    itemErrors[index] = currentErrors;
  });

  if (itemErrors.some(error => Object.keys(error).length > 0)) {
    newErrors.items = itemErrors;
  }

  setErrors(newErrors);
  return formIsValid;
};

const handleQuantityChange = (index, value) => {
  const updatedItems = [...receivedItems];
  updatedItems[index] = {
    ...updatedItems[index],
    receivedQuantity: parseInt(value) || 0,
  };
  setReceivedItems(updatedItems);
};

const handleProfitPercentageChange = (index, value) => {
  const updatedItems = [...receivedItems];
  const profitPercentage = parseFloat(value) || 0;
  
  // Calculate new selling price based on supply price and profit percentage
  const supplyPrice = updatedItems[index].supplyPrice;
  const newSellingPrice = supplyPrice * (1 + profitPercentage / 100);
  
  updatedItems[index] = {
    ...updatedItems[index],
    profitPercentage: profitPercentage,
    sellingPrice: Math.round(newSellingPrice * 100) / 100 // Round to 2 decimal places
  };
  
  setReceivedItems(updatedItems);
};

const handleSellingPriceChange = (index, value) => {
  const updatedItems = [...receivedItems];
  const sellingPrice = parseFloat(value) || 0;
  const supplyPrice = updatedItems[index].supplyPrice;
  
  // Calculate profit percentage based on the new selling price
  let profitPercentage = 0;
  if (supplyPrice > 0 && sellingPrice > 0) {
    profitPercentage = ((sellingPrice - supplyPrice) / supplyPrice) * 100;
    profitPercentage = Math.round(profitPercentage * 100) / 100; // Round to 2 decimal places
  }
  
  updatedItems[index] = {
    ...updatedItems[index],
    sellingPrice: sellingPrice,
    profitPercentage: profitPercentage
  };
  
  setReceivedItems(updatedItems);
};

const handleReceiveAll = () => {
  const updatedItems = [...receivedItems].map(item => ({
    ...item,
    receivedQuantity: item.remainingQuantity,
  }));
  setReceivedItems(updatedItems);
};

const handleSubmit = (e) => {
  e.preventDefault();
  
  if (validateForm()) {
    // Filter out items with zero received quantity
    const itemsToReceive = receivedItems
      .filter(item => item.receivedQuantity > 0)
      .map(item => ({
        id: item.id,
        receivedQuantity: item.receivedQuantity,
        supplyPrice: item.supplyPrice,
        sellingPrice: item.sellingPrice,
        notes: item.notes
      }));
    
    onReceive(itemsToReceive);
  }
};

if (!isOpen || !order) return null;

return (
  <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white p-6 w-full h-full max-h-screen overflow-y-auto flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Receive Items</h2>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
      </div>

      <div className="flex-1 flex flex-col">
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> You can adjust both supply prices and selling prices as needed.
                Supply price is what you paid to the supplier, and selling price is what you'll charge customers.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-4">
          <div>
            <p className="text-sm text-gray-500">Order ID</p>
            <p className="font-medium">{order.id}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Supplier</p>
            <p className="font-medium">{order.supplierName}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Receipt Date</p>
            <input
              type="date"
              value={receiptDate}
              onChange={(e) => setReceiptDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md mt-1"
            />
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Receipt Notes</label>
          <textarea
            value={receiptNotes}
            onChange={(e) => setReceiptNotes(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            rows="2"
            placeholder="Enter any notes about this receipt (optional)"
          ></textarea>
        </div>

        {errors.general && (
          <div className="mb-4 text-center">
            <p className="text-red-500">{errors.general}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
          <div className="flex-1 mb-6 flex flex-col">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-md font-medium">Items to Receive</h3>
              <Button
                variant="secondary"
                type="button"
                onClick={handleReceiveAll}
                className="text-sm py-1 px-3"
              >
                Receive All Items
              </Button>
            </div>

            <div className="border rounded-md flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Product
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ordered
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Received So Far
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Receiving Now
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Supply Price
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Profit %
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Selling Price
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {receivedItems.map((item, index) => (
                      <tr key={index}>
                        <td className="px-4 py-3">
                          <div className="text-sm font-medium text-gray-900">
                            {item.name}
                          </div>
                          <div className="text-xs text-gray-500">{item.id}</div>
                        </td>
                        <td className="px-4 py-3 text-sm">{item.orderedQuantity}</td>
                        <td className="px-4 py-3 text-sm">{item.receivedSoFar}</td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            value={item.receivedQuantity === 0 ? "" : item.receivedQuantity}
                            onChange={(e) => handleQuantityChange(index, e.target.value)}
                            className={`w-20 px-2 py-1 border ${
                              errors.items && errors.items[index]?.receivedQuantity
                                ? "border-red-500"
                                : "border-gray-300"
                            } rounded-md`}
                            placeholder="0"
                            min="0"
                            max={item.remainingQuantity}
                          />
                          {errors.items && errors.items[index]?.receivedQuantity && (
                            <p className="mt-1 text-xs text-red-500">
                              {errors.items[index].receivedQuantity}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center">
                            <span className="mr-1">Rs.</span>
                            <input
                              type="number"
                              value={item.supplyPrice === 0 ? "" : item.supplyPrice}
                              onChange={(e) => handleSupplyPriceChange(index, e.target.value)}
                              className={`w-24 px-2 py-1 border ${
                                errors.items && errors.items[index]?.supplyPrice
                                  ? "border-red-500"
                                  : "border-gray-300"
                              } rounded-md`}
                              placeholder="Enter price"
                              min="0.01"
                              step="0.01"
                            />
                          </div>
                          {errors.items && errors.items[index]?.supplyPrice && (
                            <p className="mt-1 text-xs text-red-500">
                              {errors.items[index].supplyPrice}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center">
                            <input
                              type="number"
                              value={item.profitPercentage === 0 ? "" : item.profitPercentage}
                              onChange={(e) => handleProfitPercentageChange(index, e.target.value)}
                              className="w-16 px-2 py-1 border border-gray-300 rounded-md"
                              placeholder="0"
                              min="0"
                              step="0.1"
                            />
                            <span className="ml-1">%</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center">
                            <span className="mr-1">Rs.</span>
                            <input
                              type="number"
                              value={item.sellingPrice === 0 ? "" : item.sellingPrice}
                              onChange={(e) => handleSellingPriceChange(index, e.target.value)}
                              className={`w-24 px-2 py-1 border ${
                                errors.items && errors.items[index]?.sellingPrice
                                  ? "border-red-500"
                                  : "border-gray-300"
                              } rounded-md`}
                              placeholder="Enter price"
                              min="0.01"
                              step="0.01"
                            />
                          </div>
                          {errors.items && errors.items[index]?.sellingPrice && (
                            <p className="mt-1 text-xs text-red-500">
                              {errors.items[index].sellingPrice}
                            </p>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-4 mt-auto">
            <Button
              variant="secondary"
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Confirm
            </Button>
          </div>
        </form>
      </div>
    </div>
  </div>
);
};

export default ReceiveOrderModal;