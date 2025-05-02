import React, { useState } from "react";
import Button from "./Button";
import SearchInput from "./SearchInput";

const AddProductsModal = ({ isOpen, onClose, onAddToOrder }) => {
  // Sample product data
  const products = [
    {
      id: "1",
      title: "4 gb branded ram",
      sku: "ram",
      category: "ram",
      remainder: 38
    },
    {
      id: "2",
      title: "Asus tuf F15",
      sku: "laptop",
      category: "laptop",
      remainder: 60
    },
    {
      id: "3",
      title: "Dell Inspiron 15",
      sku: "laptop",
      category: "laptop",
      remainder: 25
    },
    {
      id: "4",
      title: "Logitech MX Master",
      sku: "mouse",
      category: "peripherals",
      remainder: 45
    }
  ];

  const [searchQuery, setSearchQuery] = useState("");
  const [filteredProducts, setFilteredProducts] = useState(products);
  const [selectedProducts, setSelectedProducts] = useState([]);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);

    if (!value.trim()) {
      setFilteredProducts(products);
    } else {
      const filtered = products.filter(
        (product) =>
          product.title.toLowerCase().includes(value.toLowerCase()) ||
          product.sku.toLowerCase().includes(value.toLowerCase()) ||
          product.category.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredProducts(filtered);
    }
  };

  const handleSearch = () => {
    // Trigger search with current query
    if (!searchQuery.trim()) {
      setFilteredProducts(products);
    } else {
      const filtered = products.filter(
        (product) =>
          product.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          product.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
          product.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredProducts(filtered);
    }
  };

  const handleProductSelect = (productId) => {
    const index = selectedProducts.indexOf(productId);
    if (index === -1) {
      setSelectedProducts([...selectedProducts, productId]);
    } else {
      const updatedSelection = [...selectedProducts];
      updatedSelection.splice(index, 1);
      setSelectedProducts(updatedSelection);
    }
  };

  const handleAddToOrder = () => {
    if (selectedProducts.length === 0) {
      return; // No products selected
    }

    // Get product details for selected products and add default quantity and price
    const productsToAdd = selectedProducts.map(productId => {
      const product = products.find(p => p.id === productId);
      return {
        id: product.id,
        title: product.title,
        sku: product.sku,
        category: product.category,
        remainder: product.remainder,
        quantity: 1, // Default quantity
        supplyPrice: 3200.00, // Default price in LKR
      };
    });
    
    onAddToOrder(productsToAdd);
  };

  const isProductSelected = (productId) => selectedProducts.includes(productId);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      <div className="w-full h-full flex flex-col">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-lg font-semibold">Adding a product to an order</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <div className="p-4 border-b">
          <p className="mb-2 text-sm text-gray-600">
            Select a product to add from the list below, or you can create a new one
          </p>
          <SearchInput
            placeholder="Search..."
            value={searchQuery}
            onChange={handleSearchChange}
            onSearch={handleSearch}
          />
          <div className="text-right mt-2">
            <Button
              variant="outline"
              onClick={() => {}}
              className="px-3 py-1 text-sm border border-gray-300 rounded"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline-block mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" />
              </svg>
              Filter
            </Button>
          </div>
        </div>

        <div className="overflow-y-auto flex-grow p-4">
          <table className="min-w-full border-collapse">
            <thead>
              <tr>
                <th className="w-8 py-2 px-3"></th>
                <th className="text-left py-2 px-3">Title</th>
                <th className="text-left py-2 px-3">SKU</th>
                <th className="text-left py-2 px-3">Category</th>
                <th className="text-right py-2 px-3">Remainder</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.length > 0 ? (
                filteredProducts.map((product) => (
                  <tr 
                    key={product.id} 
                    className={`border-b border-gray-200 hover:bg-gray-50 cursor-pointer ${
                      isProductSelected(product.id) ? "bg-blue-50" : ""
                    }`}
                    onClick={() => handleProductSelect(product.id)}
                  >
                    <td className="py-3 px-3 text-center">
                      <input
                        type="checkbox"
                        checked={isProductSelected(product.id)}
                        onChange={() => {}}
                        className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                      />
                    </td>
                    <td className="py-3 px-3">{product.title}</td>
                    <td className="py-3 px-3">{product.sku}</td>
                    <td className="py-3 px-3">{product.category}</td>
                    <td className="py-3 px-3 text-right">{product.remainder} pc</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="py-4 text-center text-gray-500">
                    No products found matching your search criteria
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t flex justify-between items-center bg-gray-50">
          <div>
            <span className="text-sm text-gray-600">
              {selectedProducts.length} products selected
            </span>
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddToOrder}
              disabled={selectedProducts.length === 0}
              className={`px-4 py-2 rounded ${
                selectedProducts.length === 0
                  ? "bg-gray-400 text-white cursor-not-allowed"
                  : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
            >
              Add to order
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddProductsModal;