import React, { useState, useEffect } from "react";
import Button from "./Button";
import AddProductsModal from "./AddProductsModal";

const AddOrderModal = ({ isOpen, onClose, onSave }) => {
  // Sample supplier data
  const suppliers = [
    { id: "1", name: "Abc", phone: "+94 77 009 3285", email: "abc@gmail.com" },
    { id: "2", name: "Selix Computers", phone: "+94 77 009 3285", email: "selix@gmail.com" },
    { id: "3", name: "Tech Solutions", phone: "+94 71 555 3421", email: "tech@example.com" },
    { id: "4", name: "Digital World", phone: "+94 76 884 2109", email: "digital@example.com" },
  ];

  const [formData, setFormData] = useState({
    supplier: "",
    comment: "",
    items: []
  });

  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [isAddProductsModalOpen, setIsAddProductsModalOpen] = useState(false);
  const [errors, setErrors] = useState({});
  const [totalCost, setTotalCost] = useState(0);

  // Calculate total cost whenever items change
  useEffect(() => {
    const cost = formData.items.reduce((sum, item) => sum + (item.supplyPrice * item.quantity), 0);
    setTotalCost(cost);
  }, [formData.items]);

  const handleSupplierChange = (e) => {
    const supplierId = e.target.value;
    setFormData({ ...formData, supplier: supplierId });
    setSelectedSupplier(suppliers.find(s => s.id === supplierId) || null);
    
    // Clear supplier error if it exists
    if (errors.supplier) {
      setErrors({ ...errors, supplier: "" });
    }
  };

  const handleCommentChange = (e) => {
    setFormData({ ...formData, comment: e.target.value });
  };

  const handleAddProducts = () => {
    // Validate supplier is selected
    if (!formData.supplier) {
      setErrors({ ...errors, supplier: "Please select a supplier before adding products" });
      return;
    }
    
    setIsAddProductsModalOpen(true);
  };

  const handleCloseAddProductsModal = () => {
    setIsAddProductsModalOpen(false);
  };

  const handleAddProductsToOrder = (products) => {
    setFormData({ ...formData, items: [...formData.items, ...products] });
    setIsAddProductsModalOpen(false);
  };

  const handleRemoveItem = (index) => {
    const updatedItems = [...formData.items];
    updatedItems.splice(index, 1);
    setFormData({ ...formData, items: updatedItems });
  };

  const handleQuantityChange = (index, quantity) => {
    const updatedItems = [...formData.items];
    updatedItems[index] = { ...updatedItems[index], quantity: Number(quantity) };
    setFormData({ ...formData, items: updatedItems });
  };

  const handleSupplyPriceChange = (index, price) => {
    const updatedItems = [...formData.items];
    updatedItems[index] = { ...updatedItems[index], supplyPrice: Number(price) };
    setFormData({ ...formData, items: updatedItems });
  };

  const handleSave = () => {
    // Validate form
    const newErrors = {};
    
    if (!formData.supplier) {
      newErrors.supplier = "Please select a supplier";
    }
    
    if (formData.items.length === 0) {
      newErrors.items = "Please add at least one product";
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    // Transform data for saving
    const orderData = {
      supplier: selectedSupplier.name,
      comment: formData.comment,
      items: formData.items
    };
    
    onSave(orderData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-white z-50 overflow-auto">
      <div className="w-full h-full flex flex-col">
        <div className="flex justify-between items-center p-4 border-b sticky top-0 bg-white z-10">
          <h2 className="text-lg font-semibold">New order</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 overflow-y-auto flex-grow">
          {/* Left side - Product list */}
          <div>
            <h3 className="font-medium mb-2">Select products, enter order quantity and price</h3>
            
            {formData.items.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-10 border border-dashed rounded-md">
                <div className="text-blue-600 mb-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-16 w-16"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                    />
                  </svg>
                </div>
                <p className="text-gray-500 mb-2">No products yet</p>
                <p className="text-gray-500 text-sm text-center mb-6">
                  To add a product to your order, click the button below
                </p>
                <Button
                  onClick={handleAddProducts}
                  className="flex items-center space-x-2 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors"
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
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  <span>Add products</span>
                </Button>
                {errors.items && (
                  <p className="mt-2 text-sm text-red-500">{errors.items}</p>
                )}
                {errors.supplier && (
                  <p className="mt-2 text-sm text-red-500">{errors.supplier}</p>
                )}
              </div>
            ) : (
              <div>
                <div className="mb-4">
                  <Button
                    onClick={handleAddProducts}
                    className="flex items-center space-x-2 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors"
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
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                    <span>Add products</span>
                  </Button>
                </div>
                
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="py-2 px-3 text-left">Title</th>
                      <th className="py-2 px-3 text-left">SKU</th>
                      <th className="py-2 px-3 text-center">Remainder</th>
                      <th className="py-2 px-3 text-center">Quantity</th>
                      <th className="py-2 px-3 text-right">Supply price, LKR</th>
                      <th className="py-2 px-3 text-right">Amount, LKR</th>
                      <th className="py-2 px-3 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.items.map((item, index) => (
                      <tr key={index} className="border-b border-gray-200">
                        <td className="py-2 px-3">{item.title}</td>
                        <td className="py-2 px-3">{item.sku || "-"}</td>
                        <td className="py-2 px-3 text-center">{item.remainder} pc</td>
                        <td className="py-2 px-3">
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => handleQuantityChange(index, e.target.value)}
                            min="1"
                            className="w-16 px-2 py-1 border border-gray-300 rounded-md text-center"
                          />
                        </td>
                        <td className="py-2 px-3">
                          <input
                            type="number"
                            value={item.supplyPrice}
                            onChange={(e) => handleSupplyPriceChange(index, e.target.value)}
                            min="0"
                            step="0.01"
                            className="w-24 px-2 py-1 border border-gray-300 rounded-md text-right"
                          />
                        </td>
                        <td className="py-2 px-3 text-right">
                          {(item.quantity * item.supplyPrice).toFixed(2)}
                        </td>
                        <td className="py-2 px-3 text-center">
                          <button
                            onClick={() => handleRemoveItem(index)}
                            className="text-red-600 hover:text-red-800"
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
                    <tr>
                      <td colSpan="5" className="py-2 px-3 text-right font-semibold">
                        Total:
                      </td>
                      <td className="py-2 px-3 text-right font-semibold">
                        {totalCost.toFixed(2)}
                      </td>
                      <td></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
          
          {/* Right side - Order details */}
          <div>
            <div className="bg-gray-50 p-4 rounded-md">
              <h3 className="font-medium mb-4">Order details</h3>
              
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">
                  The supplier <span className="text-red-500">*</span>
                </label>
                <p className="text-sm text-gray-500 mb-2">
                  Specify the supplier from whom you order the goods
                </p>
                <select
                  value={formData.supplier}
                  onChange={handleSupplierChange}
                  className={`w-full px-3 py-2 border ${
                    errors.supplier ? "border-red-500" : "border-gray-300"
                  } rounded-md appearance-none`}
                  required
                >
                  <option value="">Select a supplier</option>
                  {suppliers.map((supplier) => (
                    <option key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </option>
                  ))}
                </select>
                {errors.supplier && (
                  <p className="mt-1 text-sm text-red-500">{errors.supplier}</p>
                )}
                
                {selectedSupplier && (
                  <div className="mt-2 text-sm">
                    <div className="flex items-center">
                      <div className="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center mr-2">
                        {selectedSupplier.name.charAt(0)}
                      </div>
                      <div>
                        <p>{selectedSupplier.phone}</p>
                        <p>{selectedSupplier.email}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Comment</label>
                <p className="text-sm text-gray-500 mb-2">
                  Here you can indicate such data as links, invoice numbers from the supplier
                </p>
                <textarea
                  value={formData.comment}
                  onChange={handleCommentChange}
                  placeholder="Comment"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  rows="4"
                ></textarea>
              </div>
              
              <div className="mb-4">
                <h4 className="font-medium mb-2">Finances</h4>
                <div className="flex justify-between mb-2">
                  <span>Order cost</span>
                  <span>LKR {totalCost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span>Total</span>
                  <span>LKR {totalCost.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-auto p-4 border-t bg-white sticky bottom-0 flex justify-end">
          <Button
            onClick={onClose}
            variant="outline"
            className="mr-2 px-4 py-2 border border-gray-300 rounded-md"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Save
          </Button>
        </div>
      </div>

      {/* Add Products Modal */}
      {isAddProductsModalOpen && (
        <AddProductsModal
          isOpen={isAddProductsModalOpen}
          onClose={handleCloseAddProductsModal}
          onAddToOrder={handleAddProductsToOrder}
        />
      )}
    </div>
  );
};

export default AddOrderModal;