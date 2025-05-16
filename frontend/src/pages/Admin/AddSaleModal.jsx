import React, { useState, useEffect } from "react";
import API from "../../utils/api";

const AddSaleModal = ({
  isOpen,
  onClose,
  onSave,
  currentSale = null
}) => {
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedStock, setSelectedStock] = useState(null);
  const [availableStocks, setAvailableStocks] = useState([]);
  const [quantity, setQuantity] = useState(1);
  const [serialNumbers, setSerialNumbers] = useState([]);
  const [discount, setDiscount] = useState(0);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [cartItems, setCartItems] = useState([]);
  const [isSearchingProduct, setIsSearchingProduct] = useState(false);
  const [productSearchQuery, setProductSearchQuery] = useState("");
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [isSearchingCustomer, setIsSearchingCustomer] = useState(false);
  const [customerSearchQuery, setCustomerSearchQuery] = useState("");
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [amountPaid, setAmountPaid] = useState(0);
  const [changeAmount, setChangeAmount] = useState(0);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isViewMode, setIsViewMode] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isNewCustomerMode, setIsNewCustomerMode] = useState(false);

  useEffect(() => {
    if (currentSale) {
      setIsViewMode(true);
      // Populate view mode if needed
    }
  }, [currentSale]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsResponse, customersResponse] = await Promise.all([
          API.get("/products?active=true"),
          API.get("/customers")
        ]);
        const productsData = productsResponse.data?.data?.products || [];
        setProducts(productsData);
        setFilteredProducts(productsData);

        const customersData = customersResponse.data?.data?.customers || [];
        setCustomers(customersData);
        setFilteredCustomers(customersData);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (!productSearchQuery) {
      setFilteredProducts(products);
      return;
    }
    const filtered = products.filter(product =>
      (product.name || product.title || "")
        .toLowerCase()
        .includes(productSearchQuery.toLowerCase())
    );
    setFilteredProducts(filtered);
  }, [productSearchQuery, products]);

  useEffect(() => {
    if (!customerSearchQuery) {
      setFilteredCustomers(customers);
      return;
    }
    const filtered = customers.filter(customer =>
      (customer.name || "")
        .toLowerCase()
        .includes(customerSearchQuery.toLowerCase()) ||
      (customer.phone || "").includes(customerSearchQuery)
    );
    setFilteredCustomers(filtered);
  }, [customerSearchQuery, customers]);

  useEffect(() => {
    if (amountPaid > 0) {
      const totalAmount = calculateTotal();
      setChangeAmount(Math.max(0, amountPaid - totalAmount));
    } else {
      setChangeAmount(0);
    }
  }, [amountPaid, cartItems]);

  const fetchAvailableStock = async (productId) => {
    if (!productId) {
      console.error("Cannot fetch stock: Product ID is undefined");
      setAvailableStocks([]);
      setSelectedStock(null);
      return;
    }
    try {
      const response = await API.get(`/products/${productId}/stock`);
      const stockData = response.data?.data?.stock || [];
      setAvailableStocks(stockData);
      setSelectedStock(null);
    } catch (error) {
      console.error("Error fetching stock:", error);
      setAvailableStocks([]);
      setSelectedStock(null);
    }
  };

  const handleProductSelect = (product) => {
    const productId = product.product_id || product.id;
    if (!product || !productId) {
      console.error("Invalid product selected:", product);
      return;
    }
    setSelectedProduct({ ...product, product_id: productId });
    fetchAvailableStock(productId);
    setIsSearchingProduct(false);
  };

  const handleCustomerSelect = (customer) => {
    setCustomerName(customer.name || "");
    setCustomerPhone(customer.phone || "");
    setCustomerEmail(customer.email || "");
    setIsSearchingCustomer(false);
    setIsNewCustomerMode(false);
  };

  const handleNewCustomer = () => {
    setIsNewCustomerMode(true);
    setCustomerName("");
    setCustomerPhone("");
    setCustomerEmail("");
    setIsSearchingCustomer(false);
  };

  const handleSaveNewCustomer = async () => {
    if (!customerName || !customerPhone) {
      setErrors({
        ...errors,
        customerName: !customerName ? "Customer name is required" : "",
        customerPhone: !customerPhone ? "Customer phone is required" : ""
      });
      return;
    }
    try {
      const customerData = {
        name: customerName,
        phone: customerPhone,
        email: customerEmail || null
      };
      const response = await API.post("/customers", customerData);
      const newCustomer = response.data?.data?.customer;
      if (newCustomer) {
        setCustomers([...customers, newCustomer]);
        handleCustomerSelect(newCustomer);
      }
      setIsNewCustomerMode(false);
      setErrors({});
    } catch (error) {
      console.error("Error creating customer:", error);
      setErrors({
        ...errors,
        customerSubmit: "Failed to create customer. Please try again."
      });
    }
  };

  const handleStockSelect = (stock) => {
    setSelectedStock(stock);
    setQuantity(1);
    setSerialNumbers([]);
  };

  const handleQuantityChange = (e) => {
    const value = parseInt(e.target.value, 10) || 1;
    setQuantity(Math.max(1, Math.min(value, selectedStock?.remaining_quantity || 1)));
    setSerialNumbers(Array(value).fill(""));
  };

  const handleSerialNumberChange = (index, value) => {
    const newSerialNumbers = [...serialNumbers];
    newSerialNumbers[index] = value;
    setSerialNumbers(newSerialNumbers);
  };

  const handleDiscountChange = (e) => {
    const value = parseFloat(e.target.value) || 0;
    setDiscount(Math.max(0, Math.min(value, 100)));
  };

  const calculatePriceAfterDiscount = (price, discountPercent) => {
    return price * (1 - discountPercent / 100);
  };

  const handleAddToCart = () => {
    const newErrors = {};
    if (!selectedProduct) newErrors.product = "Please select a product";
    if (!selectedStock) newErrors.stock = "Please select stock";
    if (quantity <= 0) newErrors.quantity = "Quantity must be greater than 0";
    if (quantity > (selectedStock?.remaining_quantity || 0)) newErrors.quantity = "Quantity exceeds available stock";
    if (selectedProduct?.requires_serial && serialNumbers.some(sn => !sn)) {
      newErrors.serialNumbers = "All serial numbers must be provided";
    }
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});
    const discountedPrice = calculatePriceAfterDiscount(selectedStock.selling_price, discount);
    const newItem = {
      id: Date.now(),
      product_id: selectedProduct.product_id,
      purchase_id: selectedStock.purchase_id,
      product_name: selectedProduct.name,
      quantity: quantity,
      serial_numbers: serialNumbers.filter(sn => sn),
      unit_price: selectedStock.selling_price,
      discounted_price: discountedPrice,
      warranty: selectedStock.warranty,
      discount: discount,
      subtotal: quantity * discountedPrice
    };
    setCartItems([...cartItems, newItem]);
    setSelectedProduct(null);
    setSelectedStock(null);
    setAvailableStocks([]);
    setQuantity(1);
    setSerialNumbers([]);
    setDiscount(0);
    setProductSearchQuery("");
  };

  const handleRemoveFromCart = (itemId) => {
    setCartItems(cartItems.filter(item => item.id !== itemId));
  };

  const calculateTotal = () => {
    return cartItems.reduce((sum, item) => sum + item.subtotal, 0);
  };

  const handleSubmit = async () => {
    const newErrors = {};
    if (cartItems.length === 0) newErrors.cart = "Cart cannot be empty";
    if (!customerPhone) newErrors.customerPhone = "Customer phone is required";
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setAmountPaid(calculateTotal());
    setIsPaymentModalOpen(true);
  };

  const handlePaymentComplete = async () => {
    setIsSubmitting(true);
    try {
      const saleData = {
        customer: {
          name: customerName,
          phone: customerPhone,
          email: customerEmail || null
        },
        items: cartItems.map(item => ({
          product_id: item.product_id,
          purchase_id: item.purchase_id,
          quantity: item.quantity,
          serial_numbers: item.serial_numbers,
          discount: item.discount
        })),
        payment_method: paymentMethod,
        amount_paid: amountPaid,
        change_amount: changeAmount
      };
      const response = await API.post("/sales", saleData);
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        onSave(response.data?.data?.sale);
      }, 1500);
    } catch (error) {
      console.error("Error creating sale:", error);
      setErrors({
        submit: "Failed to create sale. Please try again."
      });
      setIsPaymentModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
      minimumFractionDigits: 2
    }).format(amount).replace('LKR', '').trim();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white w-full h-full max-h-screen flex flex-col">
        <div className="sticky top-0 bg-white p-4 border-b border-gray-200 flex justify-between items-center z-10 shadow-sm">
          <h2 className="text-xl font-semibold">
            {isViewMode ? `Sale #${currentSale?.bill_no || ''}` : 'Add New Sale'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 p-2"
            disabled={isSubmitting}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Left Panel - Product Selection and Cart */}
          <div className="w-3/4 p-4 flex flex-col overflow-hidden">
            {!isViewMode && (
              <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
                <h3 className="text-lg font-medium text-gray-900 mb-3">Product Information</h3>
                <div className="grid grid-cols-2 gap-6 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Product</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={productSearchQuery}
                        onChange={(e) => {
                          setProductSearchQuery(e.target.value);
                          setIsSearchingProduct(true);
                        }}
                        onFocus={() => setIsSearchingProduct(true)}
                        placeholder="Search product by name..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                      {isSearchingProduct && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                          {filteredProducts.length > 0 ? (
                            filteredProducts.map((product) => (
                              <div
                                key={product.product_id || product.id}
                                className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                                onClick={() => handleProductSelect(product)}
                              >
                                {product.name || product.title}
                              </div>
                            ))
                          ) : (
                            <div className="px-4 py-2 text-gray-500">No products found</div>
                          )}
                        </div>
                      )}
                    </div>
                    {errors.product && <p className="mt-1 text-sm text-red-600">{errors.product}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Stock</label>
                    <select
                      value={selectedStock?.purchase_id || ""}
                      onChange={(e) => {
                        const stock = availableStocks.find(s => s.purchase_id.toString() === e.target.value);
                        handleStockSelect(stock);
                      }}
                      disabled={!selectedProduct}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select stock</option>
                      {availableStocks.map((stock) => (
                        <option key={stock.purchase_id} value={stock.purchase_id}>
                          {`LKR ${formatCurrency(stock.selling_price)} | ${stock.warranty} months | (${stock.remaining_quantity} available)`}
                        </option>
                      ))}
                    </select>
                    {errors.stock && <p className="mt-1 text-sm text-red-600">{errors.stock}</p>}
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-6 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Quantity</label>
                    <input
                      type="number"
                      min="1"
                      max={selectedStock?.remaining_quantity || 1}
                      value={quantity}
                      onChange={handleQuantityChange}
                      disabled={!selectedStock}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                    {errors.quantity && <p className="mt-1 text-sm text-red-600">{errors.quantity}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Discount (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={discount}
                      onChange={handleDiscountChange}
                      disabled={!selectedStock}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Price After Discount</label>
                    <input
                      type="text"
                      value={selectedStock ? formatCurrency(calculatePriceAfterDiscount(selectedStock.selling_price, discount)) : ""}
                      readOnly
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                    />
                  </div>
                </div>
                {selectedProduct && selectedProduct.requires_serial && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Serial Number(s)</label>
                    <div className="grid grid-cols-3 gap-2">
                      {Array.from({ length: quantity }).map((_, index) => (
                        <input
                          key={index}
                          type="text"
                          value={serialNumbers[index] || ""}
                          onChange={(e) => handleSerialNumberChange(index, e.target.value)}
                          placeholder={`Serial #${index + 1}`}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                      ))}
                    </div>
                    {errors.serialNumbers && <p className="mt-1 text-sm text-red-600">{errors.serialNumbers}</p>}
                  </div>
                )}
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleAddToCart}
                    disabled={!selectedProduct || !selectedStock}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:bg-gray-400 flex items-center"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                    Add to Cart
                  </button>
                </div>
              </div>
            )}

            {/* Cart */}
            <div className="bg-white rounded-lg shadow-sm p-4 flex-1 flex flex-col overflow-hidden">
              <h3 className="text-lg font-medium text-gray-900 mb-3">Order Summary</h3>
              <div className="overflow-auto flex-1">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Serial No</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Warranty</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Qty</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Discount</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price After Disc.</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                      {!isViewMode && (
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {cartItems.length > 0 ? (
                      cartItems.map((item) => (
                        <tr key={item.id}>
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{item.product_name}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{item.serial_numbers.join(", ") || "-"}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{item.warranty} months</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{item.quantity}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{formatCurrency(item.unit_price)}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{item.discount}%</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{formatCurrency(item.discounted_price)}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{formatCurrency(item.subtotal)}</td>
                          {!isViewMode && (
                            <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                              <button
                                type="button"
                                onClick={() => handleRemoveFromCart(item.id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                              </button>
                            </td>
                          )}
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={isViewMode ? 8 : 9} className="px-4 py-4 text-center text-sm text-gray-500">
                          {isViewMode ? "No items in this sale" : "Cart is empty"}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 border-t pt-4 flex justify-end">
                <div className="w-1/3">
                  <div className="flex justify-between py-2 font-medium">
                    <span>Total:</span>
                    <span>LKR {formatCurrency(calculateTotal())}</span>
                  </div>
                </div>
              </div>
              {errors.cart && <p className="mt-1 text-sm text-red-600">{errors.cart}</p>}
            </div>
          </div>
          {/* Right Panel - Customer Information */}
          <div className="w-1/4 bg-gray-50 p-4 border-l flex flex-col overflow-hidden">
            {!isViewMode && (
              <>
                <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Customer Information</h3>
                  {isNewCustomerMode ? (
                    <div>
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Customer Name</label>
                        <input
                          type="text"
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                          placeholder="Enter customer name"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                        {errors.customerName && <p className="mt-1 text-sm text-red-600">{errors.customerName}</p>}
                      </div>
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                        <input
                          type="text"
                          value={customerPhone}
                          onChange={(e) => setCustomerPhone(e.target.value)}
                          placeholder="Enter phone number"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                        {errors.customerPhone && <p className="mt-1 text-sm text-red-600">{errors.customerPhone}</p>}
                      </div>
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Email (Optional)</label>
                        <input
                          type="email"
                          value={customerEmail}
                          onChange={(e) => setCustomerEmail(e.target.value)}
                          placeholder="Enter email address"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div className="flex justify-between">
                        <button
                          type="button"
                          onClick={() => setIsNewCustomerMode(false)}
                          className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleSaveNewCustomer}
                          className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                        >
                          Save Customer
                        </button>
                      </div>
                      {errors.customerSubmit && <p className="mt-2 text-sm text-red-600">{errors.customerSubmit}</p>}
                    </div>
                  ) : (
                    <div>
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                        <div className="relative">
                          <input
                            type="text"
                            value={customerPhone}
                            onChange={(e) => {
                              setCustomerPhone(e.target.value);
                              setCustomerSearchQuery(e.target.value);
                              setIsSearchingCustomer(true);
                            }}
                            onFocus={() => setIsSearchingCustomer(true)}
                            placeholder="Search by customer phone..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          />
                          {isSearchingCustomer && customerSearchQuery && (
                            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                              {filteredCustomers.length > 0 ? (
                                filteredCustomers.map((customer) => (
                                  <div
                                    key={customer.id}
                                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                                    onClick={() => handleCustomerSelect(customer)}
                                  >
                                    {customer.name} - {customer.phone}
                                  </div>
                                ))
                              ) : (
                                <div className="px-4 py-2 text-gray-500">No customers found</div>
                              )}
                            </div>
                          )}
                        </div>
                        {errors.customerPhone && <p className="mt-1 text-sm text-red-600">{errors.customerPhone}</p>}
                      </div>
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Customer Name</label>
                        <input
                          type="text"
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                          placeholder="Customer name"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleNewCustomer}
                        className="w-full py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center justify-center"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
                        </svg>
                        Add New Customer
                      </button>
                    </div>
                  )}
                </div>
                <div className="mt-auto">
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={cartItems.length === 0 || isSubmitting || (!customerName && !customerPhone)}
                    className="w-full py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400 text-lg font-medium"
                  >
                    {`Proceed to Payment (LKR ${formatCurrency(calculateTotal())})`}
                  </button>
                  {errors.submit && <p className="mt-2 text-sm text-red-600 text-center">{errors.submit}</p>}
                </div>
              </>
            )}
            {isViewMode && currentSale && (
              <div className="bg-white rounded-lg shadow-sm p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Sale Details</h3>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-700">Customer Information</h4>
                    <p className="text-sm">Name: {currentSale.customer_name || "N/A"}</p>
                    <p className="text-sm">Phone: {currentSale.customer_phone || "N/A"}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-700">Payment Information</h4>
                    <p className="text-sm">Method: {currentSale.payment_method || "Cash"}</p>
                    <p className="text-sm">Amount Paid: LKR {formatCurrency(currentSale.amount_paid || 0)}</p>
                    <p className="text-sm">Change Given: LKR {formatCurrency(currentSale.change_amount || 0)}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-700">Sale Information</h4>
                    <p className="text-sm">Date: {currentSale.date ? new Date(currentSale.date).toLocaleString() : "N/A"}</p>
                    <p className="text-sm">Processed by: {currentSale.user_name || "N/A"}</p>
                  </div>
                </div>
                <div className="mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      // Print functionality would go here
                      console.log("Print receipt for sale:", currentSale.bill_no);
                    }}
                    className="w-full py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Print Receipt
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Payment Modal */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Payment: LKR {formatCurrency(calculateTotal())}</h3>
              <button
                onClick={() => setIsPaymentModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
                disabled={isSubmitting}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
              <div className="flex items-center space-x-4 border border-gray-300 rounded-md p-3">
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="Cash"
                    checked={paymentMethod === "Cash"}
                    onChange={() => setPaymentMethod("Cash")}
                    className="form-radio text-blue-600"
                  />
                  <span className="ml-2">Cash</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="Bank Transfer"
                    checked={paymentMethod === "Bank Transfer"}
                    onChange={() => setPaymentMethod("Bank Transfer")}
                    className="form-radio text-blue-600"
                  />
                  <span className="ml-2">Bank Transfer</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="Card"
                    checked={paymentMethod === "Card"}
                    onChange={() => setPaymentMethod("Card")}
                    className="form-radio text-blue-600"
                  />
                  <span className="ml-2">Card</span>
                </label>
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Amount Received</label>
              <input
                type="number"
                min={calculateTotal()}
                step="0.01"
                value={amountPaid}
                onChange={(e) => setAmountPaid(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Change</label>
              <input
                type="text"
                value={formatCurrency(changeAmount)}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
              />
            </div>
            {showSuccess && (
              <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-md flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Sale completed successfully!
              </div>
            )}
            <button
              type="button"
              onClick={handlePaymentComplete}
              disabled={amountPaid < calculateTotal() || isSubmitting}
              className="w-full py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400"
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                  Processing...
                </div>
              ) : (
                `Complete Sale`
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddSaleModal;
