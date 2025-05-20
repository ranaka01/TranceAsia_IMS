import React, { useState, useEffect } from "react";
import { FaTimes, FaEye, FaPrint, FaSearch, FaEdit } from "react-icons/fa";
import Button from "../../components/UI/Button";
import SearchInput from "../../components/UI/SearchInput";
import { toast } from "react-toastify";
import ViewReturnModal from "./ViewReturnModal";
import {
  getAllSupplierReturns,
  getProductDetailsByPurchaseId,
  createSupplierReturn,
  updateSupplierReturn,
  getSupplierReturnById
} from "../../services/supplierReturnService";

const Return = () => {
  // State for return form
  const [formData, setFormData] = useState({
    purchaseId: "",
    supplierName: "",
    supplierPhone: "",
    supplierEmail: "",
    shopName: "",
    productName: "",
    productId: "",
    supplierId: "",
    purchaseDate: "",
    returnReason: "",
    returnDate: new Date().toISOString().split('T')[0],
    quantity: 1,
    buyingPrice: "",
    notes: ""
  });

  // State for validation errors
  const [errors, setErrors] = useState({});

  // State for supplier fields
  const [areSupplierFieldsReadOnly, setAreSupplierFieldsReadOnly] = useState(false);

  // State for returns table
  const [returns, setReturns] = useState([]);
  const [filteredReturns, setFilteredReturns] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [printingReturns, setPrintingReturns] = useState({});

  // State for modals
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedReturn, setSelectedReturn] = useState(null);
  const [maxQuantity, setMaxQuantity] = useState(0);

  // Fetch returns from API
  const fetchReturns = async () => {
    try {
      setIsLoading(true);
      const returnsData = await getAllSupplierReturns();
      setReturns(returnsData);
      setFilteredReturns(returnsData);
    } catch (error) {
      console.error('Error fetching supplier returns:', error);
      toast.error('Failed to fetch supplier returns');
    } finally {
      setIsLoading(false);
    }
  };

  // No return status options needed anymore


  // Fetch returns from API when component mounts
  useEffect(() => {
    fetchReturns();
  }, []);

  // Handle purchase ID lookup
  const handlePurchaseIdLookup = async () => {
    if (!formData.purchaseId) {
      toast.error("Please enter a purchase ID");
      return;
    }

    try {
      setIsLoading(true);
      const productDetails = await getProductDetailsByPurchaseId(formData.purchaseId);

      if (productDetails) {
        // Set the maximum quantity based on remaining quantity
        const remainingQty = productDetails.remaining_quantity || 0;
        setMaxQuantity(remainingQty);

        // Format purchase date to remove time component
        let formattedPurchaseDate = productDetails.purchase_date;
        if (formattedPurchaseDate && formattedPurchaseDate.includes('T')) {
          formattedPurchaseDate = formattedPurchaseDate.split('T')[0];
        }

        // Populate form with product details
        setFormData({
          ...formData,
          productId: productDetails.product_id,
          productName: productDetails.product_name,
          purchaseDate: formattedPurchaseDate,
          supplierName: productDetails.supplier_name,
          supplierPhone: productDetails.supplier_phone,
          supplierEmail: productDetails.supplier_email || "Not Available",
          shopName: productDetails.shop_name,
          supplierId: productDetails.supplier_id,
          buyingPrice: productDetails.buying_price || "",
          // Keep user-entered fields
          returnDate: formData.returnDate,
          returnReason: formData.returnReason,
          quantity: Math.min(formData.quantity, remainingQty) || 1, // Ensure quantity doesn't exceed available stock
          notes: formData.notes
        });

        // Make supplier fields read-only
        setAreSupplierFieldsReadOnly(true);
        toast.success("Product details found");
      }
    } catch (error) {
      console.error('Error looking up purchase ID:', error);
      toast.error(error.response?.data?.message || 'Failed to find product details');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // No select input changes handler needed anymore

  // Handle search query change
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  // Handle search
  const handleSearch = () => {
    if (!searchQuery.trim()) {
      setFilteredReturns(returns);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = returns.filter(
      item =>
        (item.return_id?.toString() || '').toLowerCase().includes(query) ||
        (item.supplier_name || '').toLowerCase().includes(query) ||
        (item.shop_name || '').toLowerCase().includes(query) ||
        (item.purchase_id?.toString() || '').toLowerCase().includes(query) ||
        (item.product_name || '').toLowerCase().includes(query) ||
        (item.return_reason || '').toLowerCase().includes(query)
    );

    setFilteredReturns(filtered);
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    // Only validate the fields that the user needs to fill in
    // or that are required for the API
    if (!formData.purchaseId) {
      newErrors.purchaseId = "Purchase ID is required";
    }

    if (!formData.productId) {
      newErrors.productId = "Product ID is required. Please use the lookup button to find a valid product.";
    }

    if (!formData.supplierId) {
      newErrors.supplierId = "Supplier ID is required. Please use the lookup button to find a valid product.";
    }

    if (!formData.returnReason) {
      newErrors.returnReason = "Return reason is required";
    }

    if (!formData.returnDate) {
      newErrors.returnDate = "Return date is required";
    }

    // Validate quantity
    if (!formData.quantity) {
      newErrors.quantity = "Quantity is required";
    } else if (formData.quantity <= 0) {
      newErrors.quantity = "Quantity must be greater than 0";
    } else if (formData.quantity > maxQuantity) {
      newErrors.quantity = `Quantity cannot exceed available stock of ${maxQuantity} units`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fix the errors in the form");
      return;
    }

    try {
      setIsLoading(true);

      // Prepare data for API
      const returnData = {
        purchase_id: parseInt(formData.purchaseId),
        product_id: parseInt(formData.productId),
        supplier_id: parseInt(formData.supplierId),
        return_date: formData.returnDate,
        return_reason: formData.returnReason,
        quantity: parseInt(formData.quantity),
        notes: formData.notes
      };

      if (isEditMode && selectedReturn) {
        // Call API to update supplier return
        await updateSupplierReturn(selectedReturn.return_id, returnData);
        toast.success(`Supplier return #${selectedReturn.return_id} updated successfully`);
      } else {
        // Call API to create supplier return
        await createSupplierReturn(returnData);
        toast.success("Supplier return processed successfully");
      }

      // Reset form - completely reset all fields after successful submission
      setFormData({
        purchaseId: "",
        supplierName: "",
        supplierPhone: "",
        supplierEmail: "",
        shopName: "",
        productName: "",
        productId: "",
        supplierId: "",
        purchaseDate: "",
        returnReason: "",
        returnDate: new Date().toISOString().split('T')[0],
        quantity: 1,
        buyingPrice: "",
        notes: ""
      });

      // Reset edit mode and selected return
      setIsEditMode(false);
      setSelectedReturn(null);
      setMaxQuantity(0);

      setAreSupplierFieldsReadOnly(false);

      // Refresh the returns list
      fetchReturns();
    } catch (error) {
      console.error('Error processing supplier return:', error);

      // Extract specific error message from the response
      let errorMessage = 'Failed to process supplier return';

      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;

        // Handle specific error cases with more user-friendly messages
        if (errorMessage.includes('Not enough remaining quantity')) {
          errorMessage = `Insufficient quantity available for refund. ${errorMessage}`;
        }
      }

      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle view return details
  const handleViewReturn = async (returnItem) => {
    try {
      // Fetch the latest return details to ensure we have the most up-to-date data
      const returnDetails = await getSupplierReturnById(returnItem.return_id);

      if (returnDetails) {
        console.log("Fetched return details:", returnDetails);

        // Format dates to ensure consistency
        if (returnDetails.purchase_date) {
          // Handle ISO format (with T)
          if (typeof returnDetails.purchase_date === 'string' && returnDetails.purchase_date.includes('T')) {
            returnDetails.purchase_date = returnDetails.purchase_date.split('T')[0];
          }
          // Handle MySQL date format (YYYY-MM-DD HH:MM:SS)
          else if (typeof returnDetails.purchase_date === 'string' && returnDetails.purchase_date.includes(' ') && returnDetails.purchase_date.includes(':')) {
            returnDetails.purchase_date = returnDetails.purchase_date.split(' ')[0];
          }
        }

        if (returnDetails.return_date) {
          // Handle ISO format (with T)
          if (typeof returnDetails.return_date === 'string' && returnDetails.return_date.includes('T')) {
            returnDetails.return_date = returnDetails.return_date.split('T')[0];
          }
          // Handle MySQL date format (YYYY-MM-DD HH:MM:SS)
          else if (typeof returnDetails.return_date === 'string' && returnDetails.return_date.includes(' ') && returnDetails.return_date.includes(':')) {
            returnDetails.return_date = returnDetails.return_date.split(' ')[0];
          }
        }

        // If purchase_date is still missing, try to get it from the purchases table
        if (!returnDetails.purchase_date && returnDetails.purchase_id) {
          try {
            const productDetails = await getProductDetailsByPurchaseId(returnDetails.purchase_id);
            if (productDetails && productDetails.purchase_date) {
              let formattedPurchaseDate = productDetails.purchase_date;

              // Format the purchase date from product details
              if (typeof formattedPurchaseDate === 'string' && formattedPurchaseDate.includes('T')) {
                formattedPurchaseDate = formattedPurchaseDate.split('T')[0];
              } else if (typeof formattedPurchaseDate === 'string' && formattedPurchaseDate.includes(' ') && formattedPurchaseDate.includes(':')) {
                formattedPurchaseDate = formattedPurchaseDate.split(' ')[0];
              }

              returnDetails.purchase_date = formattedPurchaseDate;
            }
          } catch (error) {
            console.error('Error fetching product details for purchase date:', error);
          }
        }

        setSelectedReturn(returnDetails);
      } else {
        // Fallback to the row data if API call fails
        // Format dates in the row data
        const formattedReturnItem = { ...returnItem };

        if (formattedReturnItem.purchase_date) {
          // Handle ISO format (with T)
          if (typeof formattedReturnItem.purchase_date === 'string' && formattedReturnItem.purchase_date.includes('T')) {
            formattedReturnItem.purchase_date = formattedReturnItem.purchase_date.split('T')[0];
          }
          // Handle MySQL date format (YYYY-MM-DD HH:MM:SS)
          else if (typeof formattedReturnItem.purchase_date === 'string' && formattedReturnItem.purchase_date.includes(' ') && formattedReturnItem.purchase_date.includes(':')) {
            formattedReturnItem.purchase_date = formattedReturnItem.purchase_date.split(' ')[0];
          }
        }

        if (formattedReturnItem.return_date) {
          // Handle ISO format (with T)
          if (typeof formattedReturnItem.return_date === 'string' && formattedReturnItem.return_date.includes('T')) {
            formattedReturnItem.return_date = formattedReturnItem.return_date.split('T')[0];
          }
          // Handle MySQL date format (YYYY-MM-DD HH:MM:SS)
          else if (typeof formattedReturnItem.return_date === 'string' && formattedReturnItem.return_date.includes(' ') && formattedReturnItem.return_date.includes(':')) {
            formattedReturnItem.return_date = formattedReturnItem.return_date.split(' ')[0];
          }
        }

        setSelectedReturn(formattedReturnItem);
      }

      setIsViewModalOpen(true);
    } catch (error) {
      console.error('Error fetching return details for view:', error);

      // Fallback to the row data if API call fails
      // Format dates in the row data
      const formattedReturnItem = { ...returnItem };

      if (formattedReturnItem.purchase_date) {
        // Handle ISO format (with T)
        if (typeof formattedReturnItem.purchase_date === 'string' && formattedReturnItem.purchase_date.includes('T')) {
          formattedReturnItem.purchase_date = formattedReturnItem.purchase_date.split('T')[0];
        }
        // Handle MySQL date format (YYYY-MM-DD HH:MM:SS)
        else if (typeof formattedReturnItem.purchase_date === 'string' && formattedReturnItem.purchase_date.includes(' ') && formattedReturnItem.purchase_date.includes(':')) {
          formattedReturnItem.purchase_date = formattedReturnItem.purchase_date.split(' ')[0];
        }
      }

      if (formattedReturnItem.return_date) {
        // Handle ISO format (with T)
        if (typeof formattedReturnItem.return_date === 'string' && formattedReturnItem.return_date.includes('T')) {
          formattedReturnItem.return_date = formattedReturnItem.return_date.split('T')[0];
        }
        // Handle MySQL date format (YYYY-MM-DD HH:MM:SS)
        else if (typeof formattedReturnItem.return_date === 'string' && formattedReturnItem.return_date.includes(' ') && formattedReturnItem.return_date.includes(':')) {
          formattedReturnItem.return_date = formattedReturnItem.return_date.split(' ')[0];
        }
      }

      setSelectedReturn(formattedReturnItem);
      setIsViewModalOpen(true);
    }
  };

  // Handle edit return
  const handleEditReturn = async (returnItem) => {
    try {
      setIsLoading(true);

      // Fetch the return details to get the most up-to-date information
      const returnDetails = await getSupplierReturnById(returnItem.return_id);

      if (returnDetails) {
        // Get product details to set max quantity
        const productDetails = await getProductDetailsByPurchaseId(returnDetails.purchase_id);

        if (productDetails) {
          // Calculate max quantity: current remaining quantity + the quantity of this return
          const maxQty = (productDetails.remaining_quantity || 0) + parseInt(returnDetails.quantity || 0);
          setMaxQuantity(maxQty);

          // Format purchase date to remove time component
          let formattedPurchaseDate = productDetails.purchase_date;
          if (formattedPurchaseDate && formattedPurchaseDate.includes('T')) {
            formattedPurchaseDate = formattedPurchaseDate.split('T')[0];
          }

          // Format return date to remove time component
          let formattedReturnDate = returnDetails.return_date;
          if (formattedReturnDate && formattedReturnDate.includes('T')) {
            formattedReturnDate = formattedReturnDate.split('T')[0];
          }

          // Set form data with return details
          setFormData({
            purchaseId: returnDetails.purchase_id.toString(),
            supplierName: returnDetails.supplier_name,
            supplierPhone: returnDetails.supplier_phone || "",
            supplierEmail: returnDetails.supplier_email || "",
            shopName: returnDetails.shop_name,
            productName: returnDetails.product_name,
            productId: returnDetails.product_id.toString(),
            supplierId: returnDetails.supplier_id.toString(),
            purchaseDate: formattedPurchaseDate,
            returnReason: returnDetails.return_reason,
            returnDate: formattedReturnDate,
            quantity: parseInt(returnDetails.quantity),
            buyingPrice: productDetails.buying_price || "",
            notes: returnDetails.notes || ""
          });

          // Set edit mode and selected return
          setIsEditMode(true);
          setSelectedReturn(returnDetails);

          // Make supplier and product fields read-only for data integrity
          // but keep other fields editable
          setAreSupplierFieldsReadOnly(true);

          // Scroll to the form
          window.scrollTo({ top: 0, behavior: 'smooth' });

          toast.info(`Editing return ID: ${returnDetails.return_id}`);
        }
      }
    } catch (error) {
      console.error('Error fetching return details:', error);
      toast.error('Failed to load return details for editing');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle print return receipt
  const handlePrintReturn = async (returnItem) => {
    try {
      // Check if this return is already being printed
      if (printingReturns[returnItem.return_id]) {
        toast.info("Receipt is already being generated, please wait...");
        return;
      }

      // Mark this return as being printed
      setPrintingReturns(prev => ({
        ...prev,
        [returnItem.return_id]: true
      }));

      console.log("Starting print process for return ID:", returnItem.return_id);
      setIsLoading(true);

      // Prepare a copy of the return item with properly formatted dates
      const formattedReturnItem = { ...returnItem };
      console.log("Original return item:", returnItem);

      // Format dates in the return item
      if (formattedReturnItem.purchase_date) {
        if (typeof formattedReturnItem.purchase_date === 'string' && formattedReturnItem.purchase_date.includes('T')) {
          formattedReturnItem.purchase_date = formattedReturnItem.purchase_date.split('T')[0];
        } else if (typeof formattedReturnItem.purchase_date === 'string' && formattedReturnItem.purchase_date.includes(' ') && formattedReturnItem.purchase_date.includes(':')) {
          formattedReturnItem.purchase_date = formattedReturnItem.purchase_date.split(' ')[0];
        }
      }

      if (formattedReturnItem.return_date) {
        if (typeof formattedReturnItem.return_date === 'string' && formattedReturnItem.return_date.includes('T')) {
          formattedReturnItem.return_date = formattedReturnItem.return_date.split('T')[0];
        } else if (typeof formattedReturnItem.return_date === 'string' && formattedReturnItem.return_date.includes(' ') && formattedReturnItem.return_date.includes(':')) {
          formattedReturnItem.return_date = formattedReturnItem.return_date.split(' ')[0];
        }
      }

      console.log("Formatted return item:", formattedReturnItem);

      try {
        // Fetch the latest return details to ensure we have the most up-to-date data
        console.log("Fetching latest return details from API...");
        const returnDetails = await getSupplierReturnById(returnItem.return_id);
        console.log("API response for return details:", returnDetails);

        if (returnDetails) {
          // Format dates in the return details
          if (returnDetails.purchase_date) {
            if (typeof returnDetails.purchase_date === 'string' && returnDetails.purchase_date.includes('T')) {
              returnDetails.purchase_date = returnDetails.purchase_date.split('T')[0];
            } else if (typeof returnDetails.purchase_date === 'string' && returnDetails.purchase_date.includes(' ') && returnDetails.purchase_date.includes(':')) {
              returnDetails.purchase_date = returnDetails.purchase_date.split(' ')[0];
            }
          }

          if (returnDetails.return_date) {
            if (typeof returnDetails.return_date === 'string' && returnDetails.return_date.includes('T')) {
              returnDetails.return_date = returnDetails.return_date.split('T')[0];
            } else if (typeof returnDetails.return_date === 'string' && returnDetails.return_date.includes(' ') && returnDetails.return_date.includes(':')) {
              returnDetails.return_date = returnDetails.return_date.split(' ')[0];
            }
          }

          console.log("Formatted return details for PDF generation:", returnDetails);

          // Import the PDF generator functions dynamically to reduce initial load time
          console.log("Importing PDF generator functions...");
          const { generateSupplierReturnReceipt, printPDF } = await import('../../utils/supplierReturnPdfGenerator');
          console.log("PDF generator functions imported successfully");

          // Generate the PDF document
          console.log("Generating PDF document...");
          const doc = generateSupplierReturnReceipt(returnDetails);
          console.log("PDF document generated successfully:", doc);

          // Open the PDF in a new window
          console.log("Opening PDF in new window...");
          printPDF(doc);
          console.log("PDF should be opened or downloaded now");

          toast.success(`Generated receipt for supplier return #${returnDetails.return_id}`);
        } else {
          console.error("Return details not found in API response");
          throw new Error('Failed to fetch return details');
        }
      } catch (fetchError) {
        console.warn('Error fetching return details, using row data instead:', fetchError);

        // Fallback to the formatted row data if API call fails
        console.log("Using fallback method with formatted row data");
        const { generateSupplierReturnReceipt, printPDF } = await import('../../utils/supplierReturnPdfGenerator');
        console.log("Generating PDF from row data...");
        const doc = generateSupplierReturnReceipt(formattedReturnItem);
        console.log("Opening PDF from row data...");
        printPDF(doc);

        toast.success(`Generated receipt for supplier return #${formattedReturnItem.return_id}`);
      }
    } catch (error) {
      console.error('Error generating return receipt:', error);
      console.error('Error details:', error.message, error.stack);
      toast.error(`Failed to generate return receipt: ${error.message}`);
    } finally {
      setIsLoading(false);
      console.log("Print process completed");

      // After a delay, mark this return as no longer being printed
      // This allows the user to try again if needed after a short cooldown
      setTimeout(() => {
        setPrintingReturns(prev => {
          const newState = { ...prev };
          delete newState[returnItem.return_id];
          return newState;
        });
      }, 5000); // 5 second cooldown
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-6">Supplier Return Management</h1>

      {/* Return Form Section */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-medium mb-4">
          {isEditMode ? `Edit Supplier Return #${selectedReturn?.return_id}` : "Process New Supplier Return"}
        </h2>

        <form onSubmit={handleSubmit}>
          {/* Form Grid - 3 columns for desktop, 1 for mobile */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {/* Purchase ID */}
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-1">
                Purchase ID <span className="text-red-500">*</span>
              </label>
              <div className="relative flex">
                <input
                  type="text"
                  name="purchaseId"
                  value={formData.purchaseId}
                  onChange={handleChange}
                  placeholder="Enter purchase ID"
                  className={`w-full px-3 py-2 border ${errors.purchaseId ? 'border-red-500' : 'border-gray-300'} ${areSupplierFieldsReadOnly ? 'bg-gray-50' : ''} rounded-l-md`}
                  readOnly={areSupplierFieldsReadOnly}
                />
                <button
                  type="button"
                  onClick={handlePurchaseIdLookup}
                  disabled={areSupplierFieldsReadOnly}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-r-md flex items-center justify-center disabled:bg-gray-400"
                  title="Look up purchase details"
                >
                  <FaSearch size={16} />
                </button>
                {formData.purchaseId && areSupplierFieldsReadOnly && (
                  <button
                    type="button"
                    onClick={() => {
                      setFormData({
                        ...formData,
                        purchaseId: "",
                        supplierName: "",
                        supplierPhone: "",
                        supplierEmail: "",
                        shopName: "",
                        productName: "",
                        productId: "",
                        supplierId: "",
                        purchaseDate: ""
                      });
                      setAreSupplierFieldsReadOnly(false);
                    }}
                    className="absolute right-12 top-2.5 text-gray-400 hover:text-gray-600"
                    title="Clear purchase information"
                  >
                    <FaTimes size={16} />
                  </button>
                )}
              </div>
              {errors.purchaseId && (
                <p className="mt-1 text-sm text-red-500">{errors.purchaseId}</p>
              )}
            </div>

            {/* Supplier Name */}
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-1">
                Supplier Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="supplierName"
                value={formData.supplierName}
                onChange={handleChange}
                placeholder="Supplier name"
                className={`w-full px-3 py-2 border ${errors.supplierName ? 'border-red-500' : 'border-gray-300'} ${areSupplierFieldsReadOnly ? 'bg-gray-50' : ''} rounded-md`}
                readOnly={areSupplierFieldsReadOnly}
              />
              {errors.supplierName && (
                <p className="mt-1 text-sm text-red-500">{errors.supplierName}</p>
              )}
            </div>

            {/* Shop Name */}
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-1">
                Shop Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="shopName"
                value={formData.shopName}
                onChange={handleChange}
                placeholder="Shop name"
                className={`w-full px-3 py-2 border ${errors.shopName ? 'border-red-500' : 'border-gray-300'} ${areSupplierFieldsReadOnly ? 'bg-gray-50' : ''} rounded-md`}
                readOnly={areSupplierFieldsReadOnly}
              />
              {errors.shopName && (
                <p className="mt-1 text-sm text-red-500">{errors.shopName}</p>
              )}
            </div>

            {/* Supplier Phone */}
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-1">
                Supplier Phone <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="supplierPhone"
                value={formData.supplierPhone}
                onChange={handleChange}
                placeholder="07X XXXXXXX"
                className={`w-full px-3 py-2 border ${errors.supplierPhone ? 'border-red-500' : 'border-gray-300'} ${areSupplierFieldsReadOnly ? 'bg-gray-50' : ''} rounded-md`}
                readOnly={areSupplierFieldsReadOnly}
              />
              {errors.supplierPhone && (
                <p className="mt-1 text-sm text-red-500">{errors.supplierPhone}</p>
              )}
            </div>

            {/* Supplier Email */}
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-1">
                Supplier Email
              </label>
              <input
                type="text"
                name="supplierEmail"
                value={formData.supplierEmail}
                onChange={handleChange}
                placeholder="supplier@example.com"
                className={`w-full px-3 py-2 border ${errors.supplierEmail ? 'border-red-500' : 'border-gray-300'} ${areSupplierFieldsReadOnly ? 'bg-gray-50' : ''} rounded-md`}
                readOnly={areSupplierFieldsReadOnly}
              />
              {errors.supplierEmail && (
                <p className="mt-1 text-sm text-red-500">{errors.supplierEmail}</p>
              )}
            </div>

            {/* Product Name */}
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-1">
                Product Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="productName"
                value={formData.productName}
                onChange={handleChange}
                placeholder="Product name"
                className={`w-full px-3 py-2 border ${errors.productName ? 'border-red-500' : 'border-gray-300'} ${areSupplierFieldsReadOnly ? 'bg-gray-50' : ''} rounded-md`}
                readOnly={areSupplierFieldsReadOnly}
              />
              {errors.productName && (
                <p className="mt-1 text-sm text-red-500">{errors.productName}</p>
              )}
            </div>

            {/* Purchase Date */}
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-1">
                Purchase Date
              </label>
              <input
                type="text"
                name="purchaseDate"
                value={formData.purchaseDate}
                onChange={handleChange}
                placeholder="YYYY-MM-DD"
                className={`w-full px-3 py-2 border border-gray-300 ${areSupplierFieldsReadOnly ? 'bg-gray-50' : ''} rounded-md`}
                readOnly={areSupplierFieldsReadOnly}
              />
            </div>

            {/* Purchase Price */}
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-1">
                Purchase Price
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500">Rs.</span>
                </div>
                <input
                  type="text"
                  name="buyingPrice"
                  value={formData.buyingPrice ? parseFloat(formData.buyingPrice).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "N/A"}
                  readOnly
                  className="w-full pl-12 pr-3 py-2 border border-gray-300 bg-gray-50 rounded-md"
                />
              </div>
            </div>

            {/* Total Value */}
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-1">
                Total Value
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500">Rs.</span>
                </div>
                <input
                  type="text"
                  readOnly
                  value={
                    formData.buyingPrice && formData.quantity
                      ? (parseFloat(formData.buyingPrice) * parseInt(formData.quantity)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                      : "N/A"
                  }
                  className="w-full pl-12 pr-3 py-2 border border-gray-300 bg-gray-50 rounded-md"
                />
              </div>
            </div>

            {/* Return Date - Read-only except in edit mode */}
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-1">
                Return Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="returnDate"
                value={formData.returnDate}
                onChange={handleChange}
                readOnly={!isEditMode}
                className={`w-full px-3 py-2 border ${errors.returnDate ? 'border-red-500' : 'border-gray-300'} ${!isEditMode ? 'bg-gray-50' : ''} rounded-md`}
              />
              {errors.returnDate && (
                <p className="mt-1 text-sm text-red-500">{errors.returnDate}</p>
              )}
            </div>

            {/* Return Reason */}
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-1">
                Return Reason <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="returnReason"
                value={formData.returnReason}
                onChange={handleChange}
                placeholder="Enter return reason"
                className={`w-full px-3 py-2 border ${errors.returnReason ? 'border-red-500' : 'border-gray-300'} ${isEditMode ? 'bg-white' : ''} rounded-md`}
              />
              {errors.returnReason && (
                <p className="mt-1 text-sm text-red-500">{errors.returnReason}</p>
              )}
            </div>

            {/* Quantity */}
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-1">
                Quantity <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="quantity"
                value={formData.quantity}
                onChange={handleChange}
                min="1"
                max={maxQuantity}
                placeholder="Enter quantity"
                className={`w-full px-3 py-2 border ${errors.quantity ? 'border-red-500' : 'border-gray-300'} ${isEditMode ? 'bg-white' : ''} rounded-md`}
              />
              {errors.quantity && (
                <p className="mt-1 text-sm text-red-500">{errors.quantity}</p>
              )}
              {maxQuantity > 0 && (
                <p className="mt-1 text-xs text-gray-500">Maximum available: {maxQuantity}</p>
              )}
            </div>

            {/* No Return Status field needed anymore */}
          </div>

          {/* Notes */}
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-medium mb-1">
              Additional Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Enter any additional notes about the return"
              className={`w-full px-3 py-2 border border-gray-300 rounded-md h-24 resize-none ${isEditMode ? 'bg-white' : ''}`}
            ></textarea>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-3">
            {isEditMode && (
              <Button
                type="button"
                variant="secondary"
                className="px-6"
                onClick={() => {
                  // Reset form and edit mode
                  setFormData({
                    purchaseId: "",
                    supplierName: "",
                    supplierPhone: "",
                    supplierEmail: "",
                    shopName: "",
                    productName: "",
                    productId: "",
                    supplierId: "",
                    purchaseDate: "",
                    returnReason: "",
                    returnDate: new Date().toISOString().split('T')[0],
                    quantity: 1,
                    buyingPrice: "",
                    notes: ""
                  });
                  setIsEditMode(false);
                  setSelectedReturn(null);
                  setAreSupplierFieldsReadOnly(false);
                  setMaxQuantity(0);
                }}
              >
                Cancel
              </Button>
            )}
            <Button
              type="submit"
              variant="primary"
              className="px-6"
            >
              {isEditMode ? "Update Supplier Return" : "Process Supplier Return"}
            </Button>
          </div>
        </form>
      </div>

      {/* Returns Table Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <h2 className="text-xl font-medium mb-4 md:mb-0">Supplier Return History</h2>

          <div className="w-full md:w-auto">
            <SearchInput
              placeholder="Search by ID, supplier, product, or status"
              value={searchQuery}
              onChange={handleSearchChange}
              onSearch={handleSearch}
              className="w-full md:w-64"
            />
          </div>
        </div>

        {/* Loading state */}
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          /* Returns table - with scrollable container */
          <div className="flex-1 overflow-auto mb-4">
            <table className="w-full border-collapse">
              <thead className="sticky top-0 bg-white">
                <tr className="border-b border-gray-200">
                  <th className="py-3 px-4 text-left">Return ID</th>
                  <th className="py-3 px-4 text-left">Return Date</th>
                  <th className="py-3 px-4 text-left">Purchase Date</th>
                  <th className="py-3 px-4 text-left">Supplier</th>
                  <th className="py-3 px-4 text-left">Shop Name</th>
                  <th className="py-3 px-4 text-left">Purchase ID</th>
                  <th className="py-3 px-4 text-left">Product</th>
                  <th className="py-3 px-4 text-left">Return Reason</th>
                  <th className="py-3 px-4 text-right">Refund Value</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredReturns.length > 0 ? (
                  filteredReturns.map((returnItem) => (
                    <tr
                      key={returnItem.return_id}
                      className={`border-b border-gray-200 ${
                        printingReturns[returnItem.return_id]
                          ? "bg-blue-50"
                          : "hover:bg-gray-50"
                      }`}
                    >
                      <td className="py-3 px-4">{returnItem.return_id}</td>
                      <td className="py-3 px-4">
                        {returnItem.return_date && returnItem.return_date.includes('T')
                          ? returnItem.return_date.split('T')[0]
                          : returnItem.return_date}
                      </td>
                      <td className="py-3 px-4">
                        {returnItem.purchase_date && returnItem.purchase_date.includes('T')
                          ? returnItem.purchase_date.split('T')[0]
                          : returnItem.purchase_date || (returnItem.created_at?.includes('T') ? returnItem.created_at.split('T')[0] : returnItem.created_at)}
                      </td>
                      <td className="py-3 px-4">{returnItem.supplier_name}</td>
                      <td className="py-3 px-4">{returnItem.shop_name}</td>
                      <td className="py-3 px-4">{returnItem.purchase_id}</td>
                      <td className="py-3 px-4">{returnItem.product_name}</td>
                      <td className="py-3 px-4">{returnItem.return_reason}</td>
                      <td className="py-3 px-4 text-right">
                        {returnItem.buying_price && returnItem.quantity
                          ? `Rs. ${(parseFloat(returnItem.buying_price) * parseInt(returnItem.quantity)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                          : "N/A"}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex justify-center space-x-2">
                          <button
                            onClick={() => handleViewReturn(returnItem)}
                            className="text-blue-600 hover:text-blue-800"
                            title="View Details"
                          >
                            <FaEye size={16} />
                          </button>
                          <button
                            onClick={() => handleEditReturn(returnItem)}
                            className={`${
                              printingReturns[returnItem.return_id]
                                ? "text-gray-400 cursor-not-allowed"
                                : "text-green-600 hover:text-green-800"
                            }`}
                            title={printingReturns[returnItem.return_id] ? "Cannot edit while printing" : "Edit Return"}
                            disabled={printingReturns[returnItem.return_id]}
                          >
                            <FaEdit size={16} />
                          </button>
                          <button
                            onClick={() => handlePrintReturn(returnItem)}
                            className={`${
                              printingReturns[returnItem.return_id]
                                ? "text-gray-400 cursor-not-allowed"
                                : "text-purple-600 hover:text-purple-800"
                            }`}
                            title={printingReturns[returnItem.return_id] ? "Generating Receipt..." : "Print Receipt"}
                            disabled={printingReturns[returnItem.return_id]}
                          >
                            <FaPrint size={16} className={printingReturns[returnItem.return_id] ? "animate-pulse" : ""} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="10" className="py-4 text-center text-gray-500">
                      No supplier returns found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* View Return Modal */}
      <ViewReturnModal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        returnItem={selectedReturn}
      />

      {/* Add custom styles for react-select error state */}
      <style jsx>{`
        .react-select-error .react-select__control {
          border-color: #ef4444;
        }
      `}</style>
    </div>
  );
};

export default Return;