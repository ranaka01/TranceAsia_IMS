import React, { useState, useEffect } from "react";
import Button from "./Button";

const CreateOrderModal = ({ isOpen, onClose, onSave }) => {
  // Sample suppliers for demo purposes
  const supplierOptions = [
    { id: "2011", name: "Selix Computers" },
    { id: "2012", name: "Tech Solutions" },
    { id: "2013", name: "Digital World" },
  ];

  // Sample product options for demo purposes - removed prices to use 0 as default
  const productOptions = [
    { id: "P001", name: "Dell Laptop XPS 13" },
    { id: "P002", name: "HP Printer" },
    { id: "P003", name: "Gaming Mouse" },
    { id: "P004", name: "Mechanical Keyboard" },
    { id: "P005", name: "USB Flash Drive 64GB" },
    { id: "P006", name: "External HDD 1TB" },
  ];

  const [formData, setFormData] = useState({
    supplierId: "",
    supplierName: "",
    notes: "",
  });

  const [items, setItems] = useState([
    { id: "", name: "", quantity: 1, unitPrice: 0 },
  ]);

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      // Reset form when modal opens
      setFormData({
        supplierId: "",
        supplierName: "",
        notes: "",
      });
      setItems([{ id: "", name: "", quantity: 1, unitPrice: 0 }]);
      setErrors({});
    }
  }, [isOpen]);

  const validateForm = () => {
    const newErrors = {};

    // Validate supplier
    if (!formData.supplierId) {
      newErrors.supplier = "Please select a supplier";
    }

    // Validate items
    const itemErrors = [];
    let hasItemErrors = false;

    items.forEach((item, index) => {
      const currentErrors = {};

      if (!item.id) {
        currentErrors.id = "Please select a product";
        hasItemErrors = true;
      }

      if (!item.quantity || item.quantity <= 0) {
        currentErrors.quantity = "Quantity must be greater than 0";
        hasItemErrors = true;
      }

      if (item.unitPrice <= 0) {
        currentErrors.unitPrice = "Enter Supply price";
        hasItemErrors = true;
      }

      itemErrors[index] = currentErrors;
    });

    if (hasItemErrors) {
      newErrors.items = itemErrors;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSupplierChange = (e) => {
    const supplierId = e.target.value;
    const supplier = supplierOptions.find((s) => s.id === supplierId);
    
    setFormData({
      ...formData,
      supplierId: supplierId,
      supplierName: supplier ? supplier.name : "",
    });
  };

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...items];
    
    if (field === "id") {
      // When product changes, update name but keep unitPrice at 0 or current value
      const product = productOptions.find((p) => p.id === value);
      if (product) {
        updatedItems[index] = {
          ...updatedItems[index],
          id: product.id,
          name: product.name,
          // Keep existing price or use 0 as default
          unitPrice: updatedItems[index].unitPrice || 0,
        };
      } else {
        updatedItems[index] = {
          ...updatedItems[index],
          id: value,
          name: "",
          unitPrice: 0,
        };
      }
    } else if (field === "unitPrice") {
      // Handle unit price updates directly
      updatedItems[index] = {
        ...updatedItems[index],
        unitPrice: parseFloat(value) || 0,
      };
    } else {
      updatedItems[index] = {
        ...updatedItems[index],
        [field]: field === "quantity" ? parseInt(value) || 0 : value,
      };
    }
    
    setItems(updatedItems);
  };

  const addItem = () => {
    setItems([...items, { id: "", name: "", quantity: 1, unitPrice: 0 }]);
  };

  const removeItem = (index) => {
    if (items.length > 1) {
      const updatedItems = [...items];
      updatedItems.splice(index, 1);
      setItems(updatedItems);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      // Filter out any empty items (shouldn't happen due to validation)
      const validItems = items.filter(item => item.id && item.quantity > 0);
      
      onSave({
        ...formData,
        items: validItems,
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-md p-6 w-full max-w-4xl max-h-screen overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Create New Order</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Supplier Selection */}
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">
              Supplier <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.supplierId}
              onChange={handleSupplierChange}
              className={`w-full px-3 py-2 border ${
                errors.supplier ? "border-red-500" : "border-gray-300"
              } rounded-md`}
              required
            >
              <option value="">Select a supplier</option>
              {supplierOptions.map((supplier) => (
                <option key={supplier.id} value={supplier.id}>
                  {supplier.name}
                </option>
              ))}
            </select>
            {errors.supplier && (
              <p className="mt-1 text-sm text-red-500">{errors.supplier}</p>
            )}
          </div>

          {/* Order Notes */}
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Order Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              rows="2"
              placeholder="Enter any special instructions or notes for this order"
            ></textarea>
          </div>

          {/* Items Section */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-md font-medium">Order Items</h3>
              <Button
                variant="secondary"
                onClick={addItem}
                className="text-sm py-1 px-3"
              >
                + Add Item
              </Button>
            </div>

            {/* Items Table */}
            <div className="border rounded-md overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Supply Price
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantity
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {items.map((item, index) => (
                    <tr key={index}>
                      <td className="px-4 py-2">
                        <select
                          value={item.id}
                          onChange={(e) =>
                            handleItemChange(index, "id", e.target.value)
                          }
                          className={`w-full px-2 py-1 border ${
                            errors.items && errors.items[index]?.id
                              ? "border-red-500"
                              : "border-gray-300"
                          } rounded-md`}
                          required
                        >
                          <option value="">Select product</option>
                          {productOptions.map((product) => (
                            <option key={product.id} value={product.id}>
                              {product.name}
                            </option>
                          ))}
                        </select>
                        {errors.items && errors.items[index]?.id && (
                          <p className="mt-1 text-xs text-red-500">
                            {errors.items[index].id}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex items-center">
                          <span className="mr-1">Rs.</span>
                          <input
                            type="number"
                            value={item.unitPrice === 0 ? "" : item.unitPrice}
                            onChange={(e) =>
                              handleItemChange(index, "unitPrice", e.target.value)
                            }
                            placeholder="0"
                            className={`w-24 px-2 py-1 border ${
                              errors.items && errors.items[index]?.unitPrice
                                ? "border-red-500"
                                : "border-gray-300"
                            } rounded-md`}
                            min="0.01"
                            step="0.01"
                          />
                        </div>
                        {errors.items && errors.items[index]?.unitPrice && (
                          <p className="mt-1 text-xs text-red-500">
                            {errors.items[index].unitPrice}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) =>
                            handleItemChange(index, "quantity", e.target.value)
                          }
                          className={`w-20 px-2 py-1 border ${
                            errors.items && errors.items[index]?.quantity
                              ? "border-red-500"
                              : "border-gray-300"
                          } rounded-md`}
                          min="1"
                          required
                        />
                        {errors.items && errors.items[index]?.quantity && (
                          <p className="mt-1 text-xs text-red-500">
                            {errors.items[index].quantity}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-2">
                        Rs. {(item.quantity * item.unitPrice).toLocaleString()}
                      </td>
                      <td className="px-4 py-2">
                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          className="text-red-600 hover:text-red-800"
                          disabled={items.length === 1}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <td className="px-4 py-3 text-right" colSpan="3">
                      <strong>Order Total:</strong>
                    </td>
                    <td className="px-4 py-3" colSpan="2">
                      <strong>
                        Rs.{" "}
                        {items
                          .reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)
                          .toLocaleString()}
                      </strong>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          <div className="flex justify-end space-x-4">
            <Button
              variant="secondary"
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
              Create Order
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateOrderModal;