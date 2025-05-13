import React, { useState, useEffect } from "react";
import API from "../../utils/api";
import { X } from "lucide-react";

const SupplierDetailModal = ({ isOpen, onClose, supplierId }) => {
  const [supplier, setSupplier] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && supplierId) {
      fetchSupplierDetails();
    }
  }, [isOpen, supplierId]);

  const fetchSupplierDetails = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await API.get(`/suppliers/${supplierId}`);
      setSupplier(response.data.data.supplier);
    } catch (err) {
      console.error("Error fetching supplier details:", err);
      setError("Failed to load supplier details. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 overflow-y-auto">
      <div className="bg-white rounded-md p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Supplier Details</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
          </div>
        ) : error ? (
          <div className="p-4 text-red-500 bg-red-50 rounded-md">
            {error}
            <button
              className="ml-2 text-blue-600 underline"
              onClick={fetchSupplierDetails}
            >
              Try Again
            </button>
          </div>
        ) : supplier ? (
          <div>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <p className="text-sm text-gray-500">Supplier Name</p>
                <p className="font-medium">{supplier.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Primary Category</p>
                <p className="font-medium">{supplier.category}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Phone</p>
                <p className="font-medium">{supplier.phone}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium">{supplier.email}</p>
              </div>
              <div className="col-span-2">
                <p className="text-sm text-gray-500">Address</p>
                <p className="font-medium">{supplier.address}</p>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-4">
              <h3 className="font-medium mb-3">Products Supplied</h3>
              
              {supplier.products && Object.keys(supplier.products).length > 0 ? (
                <div className="space-y-4">
                  {Object.entries(supplier.products).map(([category, products]) => (
                    <div key={category} className="border border-gray-200 rounded-md p-3">
                      <h4 className="font-medium text-blue-600 mb-2">{category}</h4>
                      <ul className="divide-y divide-gray-200">
                        {products.map((product) => (
                          <li key={product.id} className="py-2">
                            <div className="flex justify-between">
                              <span>{product.title}</span>
                              {product.warranty && (
                                <span className="text-sm text-gray-500">
                                  {product.warranty} months warranty
                                </span>
                              )}
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 italic">No products associated with this supplier</p>
              )}
            </div>
          </div>
        ) : (
          <p className="text-center text-gray-500">Supplier not found</p>
        )}
      </div>
    </div>
  );
};

export default SupplierDetailModal;