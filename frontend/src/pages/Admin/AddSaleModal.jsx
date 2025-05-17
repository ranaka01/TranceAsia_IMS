import { usePDF } from 'react-to-pdf';
import React, { useState, useEffect, useRef } from "react";
import API from "../../utils/api";

// CSS styles for PDF printing - using only basic CSS compatible with PDF generation
const pdfStyles = `
  @media print {
    .pdf-header, .pdf-footer {
      display: block !important;
    }

    body {
      font-family: Arial, sans-serif;
    }

    table {
      width: 100%;
      border-collapse: collapse;
    }

    th, td {
      padding: 8px;
      text-align: left;
      border-bottom: 1px solid #dddddd;
    }

    th {
      background-color: #f2f2f2;
      font-weight: bold;
    }

    /* Override any Tailwind colors that might use oklch */
    * {
      color: #000000 !important;
      background-color: #ffffff !important;
      border-color: #dddddd !important;
    }

    .pdf-header h2, .pdf-footer h2, strong {
      color: #000000 !important;
      font-weight: bold;
    }

    .pdf-divider {
      border-top: 1px solid #dddddd;
      border-bottom: 1px solid #dddddd;
      margin: 10px 0;
      padding: 5px 0;
    }
  }
`;

const AddSaleModal = ({ isOpen, onClose, onSave, currentSale = null }) => {
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
  const [isProductPanelCollapsed, setIsProductPanelCollapsed] = useState(false);

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB");
  };

  useEffect(() => {
    console.log("currentSale in modal:", currentSale);
    if (currentSale) {
      setIsViewMode(true);

      // Set cartItems from currentSale.items if available
      if (Array.isArray(currentSale.items)) {
        // Process items array
        console.log('Current sale items:', currentSale.items);

        setCartItems(
          currentSale.items.map((item, idx) => {
            // Determine serial numbers
            let serialNumbers = [];

            // First check if item.serial_numbers exists and is an array
            if (item.serial_numbers && Array.isArray(item.serial_numbers)) {
              serialNumbers = item.serial_numbers;
              console.log(`Item ${idx} has ${serialNumbers.length} serial numbers from serial_numbers array`);
            }
            // Then check if item.serial_no exists as a fallback
            else if (item.serial_no) {
              serialNumbers = [item.serial_no];
              console.log(`Item ${idx} has serial number from serial_no field: ${item.serial_no}`);
            }

            // Filter out empty serial numbers
            serialNumbers = serialNumbers.filter(sn => sn && sn.trim() !== '');

            console.log(`Final serial numbers for item ${idx}:`, serialNumbers);

            return {
              ...item,
              id: idx, // Ensure each item has a unique id
              product_name: item.product_name,
              quantity: item.quantity,
              serial_numbers: serialNumbers,
              unit_price: item.unit_price,
              discounted_price: item.unit_price * (1 - (item.discount || 0) / 100),
              warranty: item.warranty,
              discount: item.discount || 0,
              subtotal: parseFloat(item.total) || (item.unit_price * item.quantity * (1 - (item.discount || 0) / 100)),
            };
          })
        );
      } else if (typeof currentSale.items === 'string') {
        // If items is a string (comma-separated list), create a placeholder item
        // This is a fallback for the list view which only has a string of item names
        console.log("Items is a string, not an array. Fetching complete sale data would be better.");
        setCartItems([{
          id: 0,
          product_name: currentSale.items,
          quantity: 1,
          serial_numbers: [],
          unit_price: currentSale.total || 0,
          discounted_price: currentSale.total || 0,
          warranty: "N/A",
          discount: 0,
          subtotal: parseFloat(currentSale.total) || 0
        }]);
      } else {
        setCartItems([]);
      }
    } else {
      setIsViewMode(false);
      setCartItems([]);
    }
  }, [currentSale]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsResponse, customersResponse] = await Promise.all([
          API.get("/products?active=true"),
          API.get("/customers"),
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
    const filtered = products.filter((product) =>
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
    const filtered = customers.filter(
      (customer) =>
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

  // Update serials array length when quantity changes
  useEffect(() => {
    // Always manage serial numbers to ensure tracking
    if (quantity > 0) {
      setSerialNumbers((prev) => {
        const arr = Array(quantity).fill("");
        for (let i = 0; i < quantity && i < prev.length; i++) {
          arr[i] = prev[i] || "";
        }
        return arr;
      });
    } else {
      setSerialNumbers([]);
    }
  }, [quantity]);

  //pdf generation
  const { toPDF, targetRef } = usePDF({
    filename: `Sale-${currentSale?.bill_no || "receipt"}.pdf`,
    options: {
      // PDF options
      margin: [5, 5, 5, 5], // minimal margins: top, right, bottom, left
      format: 'a4',
      // Configure html2canvas for better PDF generation
      html2canvas: {
        scale: 2, // Better resolution
        useCORS: true, // Allow loading external images
        logging: true, // Enable logging for debugging
        removeContainer: false, // Don't remove the container to ensure content is captured
        backgroundColor: '#ffffff', // White background
        // Make sure the element is visible during capture
        onclone: (documentClone) => {
          // Find the receipt element in the cloned document
          const receiptElement = documentClone.getElementById('receipt-for-pdf');
          if (receiptElement) {
            // Make sure it's visible and positioned properly for capture
            receiptElement.style.position = 'static';
            receiptElement.style.visibility = 'visible';
            receiptElement.style.zIndex = '1';
            receiptElement.style.width = '100%';
            receiptElement.style.maxWidth = '210mm';
            receiptElement.style.margin = '0 auto';

            // Force all text to be black for better printing
            const allElements = receiptElement.querySelectorAll('*');
            allElements.forEach(el => {
              // Set explicit color to black
              el.style.color = '#000000';

              // Remove any Tailwind color classes
              if (el.classList) {
                const classList = Array.from(el.classList);
                classList.forEach(className => {
                  if (className.includes('text-') ||
                      className.includes('bg-') ||
                      className.includes('border-')) {
                    el.classList.remove(className);
                  }
                });
              }
            });
          } else {
            console.error('Receipt element not found in cloned document');
          }

          return documentClone;
        }
      }
    }
  });

  // Handle print receipt functionality
  const handlePrint = () => {
    try {
      console.log("Generating PDF for sale:", currentSale?.bill_no);

      // Make sure the receipt element is ready for PDF generation
      const receiptElement = document.getElementById('receipt-for-pdf');
      if (receiptElement) {
        // Temporarily make it visible for better capture
        const originalVisibility = receiptElement.style.visibility;
        const originalPosition = receiptElement.style.position;
        const originalZIndex = receiptElement.style.zIndex;

        // Apply styles that make it visible but still out of the normal flow
        receiptElement.style.visibility = 'visible';
        receiptElement.style.position = 'absolute';
        receiptElement.style.zIndex = '-1000';

        // Generate the PDF
        toPDF()
          .then(() => {
            console.log("PDF generated successfully");
          })
          .catch(error => {
            console.error("Error generating PDF:", error);

            // Show detailed error information
            console.log("Error details:", {
              message: error.message,
              stack: error.stack,
              name: error.name
            });

            // Fallback: If PDF generation fails, offer to print directly
            if (confirm("PDF generation failed. Would you like to try printing directly?")) {
              // Use a simpler approach - just print the current page
              window.print();
              alert("Printing the current page. For a better formatted receipt, please try again with the PDF option.");
            }
          })
          .finally(() => {
            // Restore original styles
            receiptElement.style.visibility = originalVisibility;
            receiptElement.style.position = originalPosition;
            receiptElement.style.zIndex = originalZIndex;
          });
      } else {
        console.error("Receipt element not found");
        alert("Could not find receipt content to print. Please try again.");
      }
    } catch (error) {
      console.error("Error in handlePrint:", error);
    }
  };


  const fetchAvailableStock = async (productId) => {
    if (!productId) {
      setAvailableStocks([]);
      setSelectedStock(null);
      return;
    }
    try {
      const response = await API.get(
        `/purchases/product/${productId}/available`
      );
      const stockData = response.data?.data?.purchases || [];

      // Ensure selling_price is properly parsed as a number
      const processedStockData = stockData.map(stock => ({
        ...stock,
        selling_price: parseFloat(stock.selling_price) || 0
      }));

      console.log('Processed stock data:', processedStockData);
      setAvailableStocks(processedStockData);
      setSelectedStock(null);
    } catch (error) {
      console.error("Error fetching available stock:", error);
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
    setProductSearchQuery(product.name || product.title || ""); //new line
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
        customerPhone: !customerPhone ? "Customer phone is required" : "",
      });
      return;
    }
    try {
      const customerData = {
        name: customerName,
        phone: customerPhone,
        email: customerEmail || null,
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
        customerSubmit: "Failed to create customer. Please try again.",
      });
    }
  };

  const handleStockSelect = (stock) => {
    setSelectedStock(stock);
    setQuantity(1);
    setSerialNumbers([]);
  };

  // This function is now implemented inline in the quantity input onChange handler

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
    // Ensure price is a valid number
    const numericPrice = typeof price === 'string' ? parseFloat(price) : price;
    const validPrice = typeof numericPrice === 'number' && !isNaN(numericPrice) ? numericPrice : 0;

    // Ensure discount is a valid number
    const numericDiscount = typeof discountPercent === 'string' ? parseFloat(discountPercent) : discountPercent;
    const validDiscount = typeof numericDiscount === 'number' && !isNaN(numericDiscount) ? numericDiscount : 0;

    return validPrice * (1 - validDiscount / 100);
  };

  const handleAddToCart = () => {
    const newErrors = {};
    if (!selectedProduct) newErrors.product = "Please select a product";
    if (!selectedStock) newErrors.stock = "Please select stock";
    if (quantity <= 0) newErrors.quantity = "Quantity must be greater than 0";
    if (quantity > (selectedStock?.remaining_quantity || 0))
      newErrors.quantity = "Quantity exceeds available stock";

    // serial numbers are optional
    // Validate serial numbers - always require them for all products
    // if (serialNumbers.length !== quantity || serialNumbers.some((sn) => !sn)) {
    //   newErrors.serialNumbers = "All serial numbers must be provided";
    // }

    // if (Object.keys(newErrors).length > 0) {
    //   setErrors(newErrors);
    //   return;
    // }

    setErrors({});
    // Ensure selling_price is a valid number
    const sellingPrice = parseFloat(selectedStock.selling_price) || 0;

    const discountedPrice = calculatePriceAfterDiscount(
      sellingPrice,
      discount
    );

    const newItem = {
      id: Date.now(),
      product_id: selectedProduct.product_id,
      purchase_id: selectedStock.purchase_id,
      product_name: selectedProduct.name || selectedProduct.title,
      quantity: quantity,
      serial_numbers: serialNumbers,
      unit_price: sellingPrice,
      discounted_price: discountedPrice,
      warranty: selectedStock.warranty, // Important: Include warranty information
      discount: discount,
      subtotal: quantity * discountedPrice,
    };

    setCartItems([...cartItems, newItem]);

    // Reset selection
    setSelectedProduct(null);
    setSelectedStock(null);
    setAvailableStocks([]);
    setQuantity(0);
    setSerialNumbers([]);
    setDiscount(0);
    setProductSearchQuery("");
  };

  const handleRemoveFromCart = (itemId) => {
    setCartItems(cartItems.filter((item) => item.id !== itemId));
  };

  const calculateTotal = () => {
    return cartItems.reduce((sum, item) => {
      // Ensure subtotal is a valid number
      const subtotal = typeof item.subtotal === 'number' && !isNaN(item.subtotal)
        ? item.subtotal
        : (item.unit_price && item.quantity
            ? item.unit_price * item.quantity * (1 - (item.discount || 0) / 100)
            : 0);
      return sum + subtotal;
    }, 0);
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
          name: customerName || "Walk-in Customer",
          phone: customerPhone,
          email: customerEmail || null,
        },
        items: cartItems.map((item) => ({
          product_id: item.product_id,
          purchase_id: item.purchase_id,
          quantity: item.quantity,
          serial_numbers: item.serial_numbers,
          discount: item.discount,
          warranty: item.warranty, // Make sure warranty is included in the submission
        })),
        payment_method: paymentMethod,
        amount_paid: amountPaid,
        change_amount: changeAmount,
      };
      const response = await API.post("/sales", saleData);
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        onSave && onSave(response.data?.data?.sale);
      }, 5000); // Changed from 50000 (50 seconds) to 5000 (5 seconds)
    } catch (error) {
      console.error("Error creating sale:", error);
      setErrors({
        submit: "Failed to create sale. Please try again.",
      });
      setIsPaymentModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (amount) => {
    // Parse the amount if it's a string
    let numericAmount = amount;
    if (typeof amount === 'string') {
      numericAmount = parseFloat(amount);
    }

    // Ensure amount is a valid number
    const validAmount = typeof numericAmount === 'number' && !isNaN(numericAmount) ? numericAmount : 0;

    // Debug log to check the value
    if (validAmount === 0 && amount !== 0 && amount !== "0") {
      console.log('Warning: formatCurrency received invalid amount:', amount, 'type:', typeof amount);
    }

    return new Intl.NumberFormat("en-LK", {
      style: "currency",
      currency: "LKR",
      minimumFractionDigits: 2,
    })
      .format(validAmount)
      .replace("LKR", "")
      .trim();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      {/* Add style tag for PDF printing */}
      <style>{pdfStyles}</style>
      <div className="bg-white w-full h-full max-h-screen flex flex-col">
        <div className="sticky top-0 bg-white p-4 border-b border-gray-200 flex justify-between items-center z-10 shadow-sm">
          <h2 className="text-xl font-semibold">
            {isViewMode
              ? `Sale #${currentSale?.bill_no || ""}`
              : "Add New Sale"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 p-2"
            disabled={isSubmitting}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Left Panel - Product Selection and Cart */}
          <div className="w-3/4 p-4 flex flex-col overflow-hidden">
            {!isViewMode && (
              <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-lg font-medium text-gray-900">
                    Product Information
                  </h3>
                  <button
                    onClick={() =>
                      setIsProductPanelCollapsed(!isProductPanelCollapsed)
                    }
                    className="text-gray-500 hover:text-gray-700 p-1 focus:outline-none"
                    aria-label={
                      isProductPanelCollapsed
                        ? "Expand panel"
                        : "Collapse panel"
                    }
                  >
                    {isProductPanelCollapsed ? (
                      // Down arrow when collapsed
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                          clipRule="evenodd"
                        />
                      </svg>
                    ) : (
                      // Up arrow when expanded
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </button>
                </div>

                {/* Show/Hide the content based on state */}
                {!isProductPanelCollapsed && (
                  <>
                    {/* Product & Stock */}
                    <div className="grid grid-cols-2 gap-4 mb-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Product
                        </label>
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
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 pr-10"
                          />
                          {/* Clear button and dropdown menu code */}
                          {productSearchQuery && (
                            <button
                              type="button"
                              onClick={() => {
                                setProductSearchQuery("");
                                setSelectedProduct(null);
                                setAvailableStocks([]);
                                setSelectedStock(null);
                              }}
                              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                              tabIndex={-1}
                              aria-label="Clear"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-4 w-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M6 18L18 6M6 6l12 12"
                                />
                              </svg>
                            </button>
                          )}
                          {isSearchingProduct && (
                            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                              {/* Product dropdown items */}
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
                                <div className="px-4 py-2 text-gray-500">
                                  No products found
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        {errors.product && (
                          <p className="mt-1 text-sm text-red-600">
                            {errors.product}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Stock
                        </label>
                        <select
                          value={selectedStock?.purchase_id || ""}
                          onChange={(e) => {
                            const stock = availableStocks.find(
                              (s) => s.purchase_id.toString() === e.target.value
                            );
                            handleStockSelect(stock);
                          }}
                          disabled={!selectedProduct}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 appearance-none"
                        >
                          <option value="">Select stock</option>
                          {availableStocks
                            .filter((stock) => stock.remaining_quantity > 0)
                            .map((stock) => (
                              <option
                                key={stock.purchase_id}
                                value={stock.purchase_id}
                              >
                                {`LKR ${formatCurrency(
                                  parseFloat(stock.selling_price) || 0
                                )} | Warranty: ${stock.warranty} months  | (${
                                  stock.remaining_quantity
                                } available) | Stock in: ${formatDate(
                                  stock.date
                                )}`}
                              </option>
                            ))}
                        </select>
                        {errors.stock && (
                          <p className="mt-1 text-sm text-red-600">
                            {errors.stock}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Quantity, Discount, Warranty */}
                    <div className="grid grid-cols-3 gap-4 mb-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Quantity
                        </label>
                        <input
                          type="number"
                          min="1"
                          max={selectedStock?.remaining_quantity || 1}
                          value={quantity}
                          onChange={(e) => {
                            const val = e.target.value;
                            // Allow empty string for clearing
                            if (val === "") {
                              setQuantity("");
                            } else {
                              // Only allow numbers within the allowed range
                              const value = parseInt(val, 10);
                              if (!isNaN(value)) {
                                // Clamp value between 1 and max available
                                setQuantity(
                                  Math.max(
                                    1,
                                    Math.min(
                                      value,
                                      selectedStock?.remaining_quantity || 1
                                    )
                                  )
                                );
                              }
                            }
                          }}
                          disabled={!selectedStock}
                          placeholder="1"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                        {errors.quantity && (
                          <p className="mt-1 text-sm text-red-600">
                            {errors.quantity}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Discount (%)
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          value={discount}
                          onChange={handleDiscountChange}
                          disabled={!selectedStock}
                          placeholder="0"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Warranty
                        </label>
                        <input
                          type="text"
                          value={
                            selectedStock
                              ? `${selectedStock.warranty} months`
                              : ""
                          }
                          readOnly
                          disabled
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                        />
                      </div>
                    </div>

                    {/* Original Price & Price After Discount */}
                    <div className="grid grid-cols-2 gap-4 mb-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Original Price
                        </label>
                        <input
                          type="text"
                          value={
                            selectedStock && selectedStock.selling_price
                              ? formatCurrency(parseFloat(selectedStock.selling_price))
                              : ""
                          }
                          readOnly
                          disabled
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Price After Discount
                        </label>
                        <input
                          type="text"
                          value={
                            selectedStock && selectedStock.selling_price
                              ? formatCurrency(
                                  calculatePriceAfterDiscount(
                                    parseFloat(selectedStock.selling_price),
                                    discount
                                  )
                                )
                              : ""
                          }
                          readOnly
                          disabled
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                        />
                      </div>
                    </div>

                    {/* Serial Numbers section */}
                    {selectedProduct && selectedStock && quantity > 0 && (
                      <div className="mb-3 border-2 border-blue-100 p-2 rounded-lg">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Serial Numbers (Optional)
                        </label>
                        <div className="grid grid-cols-3 gap-2 max-h-40 overflow-y-auto p-1">
                          {Array.from({ length: quantity }).map((_, index) => (
                            <div
                              key={`serial-input-${index}`}
                              className="flex items-center"
                            >
                              <span className="text-xs text-gray-500 mr-1 w-6">
                                {index + 1}:
                              </span>
                              <input
                                type="text"
                                value={serialNumbers[index] || ""}
                                onChange={(e) =>
                                  handleSerialNumberChange(
                                    index,
                                    e.target.value
                                  )
                                }
                                placeholder={`Enter S/N ${index + 1}`}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                              />
                            </div>
                          ))}
                        </div>
                        {errors.serialNumbers && (
                          <p className="mt-1 text-sm text-red-600">
                            {errors.serialNumbers}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Add to Cart button */}
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={handleAddToCart}
                        disabled={!selectedProduct || !selectedStock}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:bg-gray-400 flex items-center"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5 mr-1"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
                            clipRule="evenodd"
                          />
                        </svg>
                        Add to Cart
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Cart */}
            <div className="bg-white rounded-lg shadow-sm p-4 flex-1 flex flex-col overflow-hidden">
              {/* Receipt content for PDF generation - visible but positioned off-screen */}
              <div ref={targetRef} id="receipt-for-pdf" style={{ position: 'absolute', visibility: isViewMode ? 'visible' : 'hidden', zIndex: -1000, width: '210mm', backgroundColor: 'white', padding: '20px', border: '1px solid #eee' }}>
                {/* PDF Header */}
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '18px', color: '#000' }}>
                    TranceAsiaComputers
                  </div>
                  <div style={{ textAlign: 'center', fontSize: '12px', color: '#000' }}>
                    123 Main Street, Ambalantota, Sri Lanka
                  </div>
                  <div style={{ textAlign: 'center', fontSize: '12px', color: '#000' }}>
                    Tel: +94 11 123 4567 | Email: tranceasiacomputers@gmail.com
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <div style={{ fontSize: '12px', color: '#000' }}>
                    <div><strong>Invoice #: </strong>{currentSale?.bill_no}</div>
                    <div><strong>Date: </strong>{currentSale?.date ? new Date(currentSale.date).toLocaleDateString() : "N/A"}</div>
                  </div>
                  <div style={{ fontSize: '12px', color: '#000', textAlign: 'right' }}>
                    <div><strong>Customer: </strong>{currentSale?.customer_name || "Walk-in Customer"}</div>
                    <div><strong>Phone: </strong>{currentSale?.customer_phone || "N/A"}</div>
                    {currentSale?.customer_email && (
                      <div><strong>Email: </strong>{currentSale.customer_email}</div>
                    )}
                  </div>
                </div>

                <div style={{ textAlign: 'center', padding: '5px 0', borderTop: '1px solid #000', borderBottom: '1px solid #000', marginBottom: '15px', fontWeight: 'bold', color: '#000' }}>
                  SALES RECEIPT
                </div>

                <div style={{ marginBottom: '10px', fontSize: '14px', fontWeight: 'bold', color: '#000' }}>
                  Order Summary
                </div>

                {/* Order Items Table */}
                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
                  <thead>
                    <tr>
                      <th style={{ padding: '5px', textAlign: 'left', borderBottom: '1px solid #000', fontSize: '12px', fontWeight: 'bold', color: '#000' }}>PRODUCT</th>
                      <th style={{ padding: '5px', textAlign: 'left', borderBottom: '1px solid #000', fontSize: '12px', fontWeight: 'bold', color: '#000' }}>SERIAL NO</th>
                      <th style={{ padding: '5px', textAlign: 'left', borderBottom: '1px solid #000', fontSize: '12px', fontWeight: 'bold', color: '#000' }}>WARRANTY</th>
                      <th style={{ padding: '5px', textAlign: 'center', borderBottom: '1px solid #000', fontSize: '12px', fontWeight: 'bold', color: '#000' }}>QTY</th>
                      <th style={{ padding: '5px', textAlign: 'right', borderBottom: '1px solid #000', fontSize: '12px', fontWeight: 'bold', color: '#000' }}>DISCOUNT</th>
                      <th style={{ padding: '5px', textAlign: 'right', borderBottom: '1px solid #000', fontSize: '12px', fontWeight: 'bold', color: '#000' }}>PRICE</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cartItems.length > 0 ? (
                      cartItems.map((item) => (
                        <React.Fragment key={`pdf-${item.id}`}>
                          {/* Main product row */}
                          <tr style={{ borderBottom: '1px solid #eee' }}>
                            <td style={{ padding: '5px', fontSize: '12px', color: '#000' }}>{item.product_name}</td>
                            <td style={{ padding: '5px', fontSize: '12px', color: '#000' }}>
                              {item.serial_numbers && item.serial_numbers.length > 0 && item.quantity === 1
                                ? item.serial_numbers[0]
                                : item.serial_numbers && item.serial_numbers.length > 0
                                  ? `${item.serial_numbers.length} serials`
                                  : '-'}
                            </td>
                            <td style={{ padding: '5px', fontSize: '12px', color: '#000' }}>{item.warranty} months</td>
                            <td style={{ padding: '5px', fontSize: '12px', textAlign: 'center', color: '#000' }}>{item.quantity}</td>
                            <td style={{ padding: '5px', fontSize: '12px', textAlign: 'right', color: '#000' }}>{item.discount}.0%</td>
                            <td style={{ padding: '5px', fontSize: '12px', textAlign: 'right', color: '#000' }}>{formatCurrency(item.subtotal)}</td>
                          </tr>

                          {/* Show serial rows for items with quantity > 1 */}
                          {item.quantity > 1 && item.serial_numbers && item.serial_numbers.length > 0 &&
                            item.serial_numbers.map((serial, idx) =>
                              serial && serial.trim() !== "" ? (
                                <tr key={`pdf-serial-${item.id}-${idx}`} style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #f0f0f0' }}>
                                  <td style={{ padding: '3px 5px 3px 15px', fontSize: '10px', color: '#444', fontStyle: 'italic' }}>
                                    Serial #{idx + 1}
                                  </td>
                                  <td style={{ padding: '3px 5px', fontSize: '10px', color: '#000', fontWeight: '500' }}>
                                    {serial}
                                  </td>
                                  <td colSpan={4}></td>
                                </tr>
                              ) : null
                            )
                          }
                        </React.Fragment>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} style={{ padding: '5px', textAlign: 'center', fontSize: '12px', color: '#000' }}>
                          No items in this sale
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>

                {/* Totals */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
                  <div style={{ textAlign: 'right', fontSize: '12px', color: '#000' }}>
                    <div style={{ marginBottom: '5px' }}><strong>Total: </strong>LKR {formatCurrency(calculateTotal())}</div>
                  </div>
                </div>

                {/* Payment Information and Totals - Styled to match reference image */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '30px', paddingTop: '10px', borderTop: '1px solid #eee' }}>
                  <div style={{ fontSize: '12px', color: '#000' }}>
                    <div style={{ marginBottom: '5px' }}><strong>Payment Method:</strong> {currentSale?.payment_method || "Cash"}</div>
                    <div><strong>Amount Paid:</strong> LKR {formatCurrency(currentSale?.amount_paid || 0)}</div>
                  </div>
                  <div style={{ textAlign: 'right', fontSize: '12px', color: '#000' }}>
                    <div style={{ marginBottom: '5px' }}><strong>Subtotal:</strong> LKR {formatCurrency(currentSale?.subtotal || calculateTotal())}</div>
                    {currentSale?.discount > 0 && (
                      <div style={{ marginBottom: '5px' }}><strong>Discount:</strong> LKR {formatCurrency(currentSale?.discount || 0)}</div>
                    )}
                    <div style={{ fontWeight: 'bold' }}><strong>Grand Total:</strong> LKR {formatCurrency(currentSale?.total || calculateTotal())}</div>
                  </div>
                </div>

                {/* Footer */}
                <div style={{ textAlign: 'center', fontSize: '10px', color: '#000', marginTop: '30px' }}>
                  <div>Thank you for your business!</div>
                  <div>For returns and exchanges, please bring this receipt within 7 days of purchase.</div>
                  <div>All electronic items come with manufacturer warranty as specified.</div>
                  <div>© {new Date().getFullYear()} TranceAsia IMS</div>
                </div>
              </div>

              <h3 className="text-lg font-medium text-gray-900 mb-3">
                Order Summary
              </h3>
              <div className="overflow-auto flex-1">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Product
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Serial No
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Warranty
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Qty
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Price
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Discount
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Final Price
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total
                      </th>
                      {!isViewMode && (
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {cartItems.length > 0 ? (
                      cartItems.map((item) => (
                        <React.Fragment key={item.id}>
                          {/* Main product row */}
                          <tr className="hover:bg-gray-50 border-b border-gray-200">
                            <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                              {item.product_name}
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                              {/* Show actual serial if quantity=1, otherwise show count */}
                              {item.serial_numbers && item.serial_numbers.length > 0 ? (
                                item.quantity === 1 ? (
                                  <span className="text-gray-700 font-medium">{item.serial_numbers[0]}</span>
                                ) : (
                                  <span className="text-gray-500 cursor-pointer hover:text-blue-500" title="See details below">
                                    {item.serial_numbers.length} serials
                                  </span>
                                )
                              ) : (
                                <span className="text-gray-500">-</span>
                              )}
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                              {item.warranty} months
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                              {item.quantity}
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                              {formatCurrency(item.unit_price)}
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                              {item.discount}%
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                              {formatCurrency(item.discounted_price)}
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                              {formatCurrency(item.subtotal)}
                            </td>
                            {!isViewMode && (
                              <td className="px-3 py-2 whitespace-nowrap text-right text-sm font-medium">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveFromCart(item.id)}
                                  className="text-red-600 hover:text-red-900"
                                  aria-label="Remove item"
                                >
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-5 w-5"
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                  >
                                    <path
                                      fillRule="evenodd"
                                      d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                </button>
                              </td>
                            )}
                          </tr>

                          {/* Show serial rows for items with quantity > 1 */}
                          {item.quantity > 1 && item.serial_numbers && item.serial_numbers.length > 0 &&
                            item.serial_numbers.map((serial, idx) =>
                              serial && serial.trim() !== "" ? (
                                <tr
                                  key={`serial-row-${item.id}-${idx}`}
                                  className="bg-gray-50 border-b border-gray-100"
                                >
                                  <td className="pl-8 py-1 text-xs text-gray-500">
                                    Serial #{idx + 1}
                                  </td>
                                  <td className="py-1 text-xs text-gray-700 font-medium">
                                    {serial}
                                  </td>
                                  {/* Empty cells to maintain table structure */}
                                  <td
                                    colSpan={isViewMode ? 6 : 7}
                                    className="py-1"
                                  ></td>
                                </tr>
                              ) : null
                            )}
                        </React.Fragment>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={isViewMode ? 8 : 9}
                          className="px-3 py-3 text-center text-sm text-gray-500"
                        >
                          {isViewMode
                            ? "No items in this sale"
                            : "Cart is empty"}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Serial Numbers Detail (collapsed by default) */}
              {/* {cartItems.length > 0 && (
                <div className="mt-4 border p-3 rounded">
                  <h4 className="font-medium mb-2">Serial Numbers Details</h4>
                  <div className="max-h-48 overflow-y-auto">
                    {cartItems.map((item) => (
                      <div key={`serial-details-${item.id}`} className="mb-2">
                        <p className="text-sm font-medium text-gray-700">
                          {item.product_name}
                        </p>
                        <div className="grid grid-cols-3 gap-2 mt-1">
                          {item.serial_numbers.map((serial, idx) => (
                            <div
                              key={`serial-${item.id}-${idx}`}
                              className="text-xs text-gray-600 border-b border-gray-100 pb-1"
                            >
                              {idx + 1}: {serial}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )} */}

              {/* Cart total */}
              <div className="mt-4 pt-4 flex justify-end">
                <div className="w-1/3">
                  <div className="flex justify-between py-2 font-medium">
                    <span>Total:</span>
                    <span>LKR {formatCurrency(calculateTotal())}</span>
                  </div>
                </div>
              </div>

              {/* No PDF Footer here anymore - moved to the dedicated receipt component */}

              {/* {errors.cart && (
                <p className="mt-1 text-sm text-red-600">{errors.cart}</p>
              )} */}
            </div>
          </div>

          {/* Right Panel - Customer Information */}
          <div className="w-1/4 bg-gray-50 p-4 border-l flex flex-col overflow-hidden">
            {!isViewMode && (
              <>
                <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Customer Information
                  </h3>
                  {isNewCustomerMode ? (
                    <div>
                      <div className="mb-3">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {" "}
                          Email (Optional)
                        </label>
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
                      {errors.customerSubmit && (
                        <p className="mt-2 text-sm text-red-600">
                          {errors.customerSubmit}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div>
                      <div className="mb-3">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {" "}
                          Phone Number
                        </label>
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
                                    onClick={() =>
                                      handleCustomerSelect(customer)
                                    }
                                  >
                                    {customer.name} - {customer.phone}
                                  </div>
                                ))
                              ) : (
                                <div className="px-4 py-2 text-gray-500">
                                  No customers found
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        {errors.customerPhone && (
                          <p className="mt-1 text-sm text-red-600">
                            {errors.customerPhone}
                          </p>
                        )}
                      </div>
                      <div className="mb-3">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {" "}
                          Customer Name
                        </label>
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
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5 mr-1"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
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
                    disabled={
                      cartItems.length === 0 ||
                      isSubmitting ||
                      (!customerName && !customerPhone)
                    }
                    className="w-full py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400 text-lg font-medium"
                  >
                    {`Proceed to Payment (LKR ${formatCurrency(
                      calculateTotal()
                    )})`}
                  </button>
                  {errors.submit && (
                    <p className="mt-2 text-sm text-red-600 text-center">
                      {errors.submit}
                    </p>
                  )}
                </div>
              </>
            )}

            {isViewMode && currentSale && (
              <div className="bg-white rounded-lg shadow-sm p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Sale Details
                </h3>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-700">
                      Customer Information
                    </h4>
                    <p className="text-sm">
                      Name: {currentSale.customer_name || "N/A"}
                    </p>
                    <p className="text-sm">
                      Phone: {currentSale.customer_phone || "N/A"}
                    </p>
                    {currentSale.customer_email && (
                      <p className="text-sm">
                        Email: {currentSale.customer_email}
                      </p>
                    )}
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-700">
                      Payment Information
                    </h4>
                    <p className="text-sm">
                      Method: {currentSale.payment_method || "Cash"}
                    </p>
                    <p className="text-sm">
                      Amount Paid: LKR{" "}
                      {formatCurrency(currentSale.amount_paid || 0)}
                    </p>
                    <p className="text-sm">
                      Change Given: LKR{" "}
                      {formatCurrency(currentSale.change_amount || 0)}
                    </p>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-700">
                      Sale Information
                    </h4>
                    <p className="text-sm">
                      Date:{" "}
                      {currentSale.date
                        ? new Date(currentSale.date).toLocaleString()
                        : "N/A"}
                    </p>
                    <p className="text-sm">
                      Processed by: {currentSale.user_name || "N/A"}
                    </p>
                  </div>
                </div>

                <div className="mt-6">
                  <button
                    type="button"
                    onClick={handlePrint}
                    className="w-full py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
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
              <h3 className="text-lg font-medium text-gray-900">
                Payment: LKR {formatCurrency(calculateTotal())}
              </h3>
              <button
                onClick={() => setIsPaymentModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
                disabled={isSubmitting}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Payment Method
              </label>
              <div className="flex items-center space-x-4 border border-gray-300 rounded-lg p-3">
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

            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Amount Received
              </label>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Change
              </label>
              <input
                type="text"
                value={formatCurrency(changeAmount)}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
              />
            </div>

            {/* Payment buttons */}
            {showSuccess ? (
              <button
                type="button"
                onClick={handlePrint}
                className="w-full py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Print Receipt
              </button>
            ) : (
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
                  "Complete Sale"
                )}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AddSaleModal;
