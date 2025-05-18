import React, { useState, useEffect } from "react";
import axios from "axios";
import Select from "react-select";

const AddPurchaseModal = ({ isOpen, onClose, onSave }) => {
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [filteredSuppliers, setFilteredSuppliers] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [formData, setFormData] = useState({
    product_id: "",
    supplier_id: "",
    quantity: "",
    warranty: "12 months",
    buying_price: "",
    selling_price: "",
    date: new Date().toISOString().split("T")[0],
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // API config
  const API = axios.create({
    baseURL: "http://localhost:5000",
    timeout: 10000,
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
    },
  });

  // Fetch products and suppliers when modal opens
  useEffect(() => {
    if (!isOpen) return;
    resetForm();

    Promise.all([API.get("/products"), API.get("/suppliers")])
      .then(([productsRes, suppliersRes]) => {
        const productsData = productsRes.data?.data?.products || [];
        const suppliersData = suppliersRes.data?.data?.suppliers || [];

        setProducts(productsData);
        setSuppliers(suppliersData);

        // Initially, filtered suppliers is all suppliers
        setFilteredSuppliers(suppliersData);
      })
      .catch((err) => {
        console.error("Error fetching data:", err);
        setProducts([]);
        setSuppliers([]);
        setFilteredSuppliers([]);
      });
  }, [isOpen]);

  const resetForm = () => {
    setFormData({
      product_id: "",
      supplier_id: "",
      quantity: "",
      warranty: "12 months",
      buying_price: "",
      selling_price: "",
      date: new Date().toISOString().split("T")[0],
    });
    setErrors({});
    setIsSubmitting(false);
    setSelectedProduct(null);
    setSelectedSupplier(null);
    setFilteredSuppliers(suppliers); // reset filtered suppliers to all
  };

  // Handle controlled input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) validateField(name, value);
  };

  // Validation logic
  const validateField = (name, value) => {
    let error = "";
    switch (name) {
      case "product_id":
        if (!value) error = "Product is required";
        break;
      case "supplier_id":
        if (!value) error = "Supplier is required";
        break;
      case "quantity":
        if (!value) error = "Quantity is required";
        else if (isNaN(value) || parseInt(value) <= 0)
          error = "Quantity must be a positive number";
        break;
      case "buying_price":
        if (!value) error = "Buying price is required";
        else if (isNaN(value) || parseFloat(value) <= 0)
          error = "Buying price must be a positive number";
        break;
      case "selling_price":
        if (!value) error = "Selling price is required";
        else if (isNaN(value) || parseFloat(value) <= 0)
          error = "Selling price must be a positive number";
        else if (parseFloat(value) <= parseFloat(formData.buying_price || 0))
          error = "Selling price should be higher than buying price";
        break;
      case "date":
        if (!value) error = "Date is required";
        break;
      default:
        break;
    }
    setErrors((prev) => ({
      ...prev,
      [name]: error,
    }));
    return !error;
  };

  const validateForm = () => {
    return (
      validateField("product_id", formData.product_id) &&
      validateField("supplier_id", formData.supplier_id) &&
      validateField("quantity", formData.quantity) &&
      validateField("buying_price", formData.buying_price) &&
      validateField("selling_price", formData.selling_price) &&
      validateField("date", formData.date)
    );
  };

  // Submit handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsSubmitting(true);

    try {
      const purchaseData = {
        ...formData,
        remaining_quantity: formData.quantity,
      };

      await onSave(purchaseData);
      onClose();
    } catch (err) {
      console.error("Error creating purchase:", err);
      setErrors((prev) => ({
        ...prev,
        general: "Failed to create purchase. Please try again.",
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Options for react-select
  const productOptions = products.map((p) => ({
    value: p.product_id || p.id,
    label: p.name || p.title || "Unnamed Product",
    raw: p,
  }));

  const supplierOptions = filteredSuppliers.map((s) => ({
    value: s.supplier_id || s.id,
    label: s.name || s.shop_name || "Unnamed Supplier",
    raw: s,
  }));

  // When product is selected, filter suppliers accordingly
  const handleProductSelect = async (option) => {
    const product = option ? option.raw : null;
    setSelectedProduct(product);

    if (product) {
      setFormData((prevFormData) => ({
        ...prevFormData,
        product_id: product.product_id || product.id || "",
        supplier_id: "",
      }));
      setSelectedSupplier(null);

      try {
        const response = await API.get(
          `/products/${product.product_id || product.id}/suppliers`
        );

        // The backend returns suppliers directly without wrapping in data.suppliers
        // Check different possible response structures
        let relatedSuppliers = [];
        if (Array.isArray(response.data)) {
          // If response.data is already an array of suppliers
          relatedSuppliers = response.data;
        } else if (response.data?.data?.suppliers) {
          // If response has nested data.suppliers structure
          relatedSuppliers = response.data.data.suppliers;
        } else if (response.data?.suppliers) {
          // If response has suppliers directly in data
          relatedSuppliers = response.data.suppliers;
        }

        console.log("Suppliers fetched for product:", relatedSuppliers);
        setFilteredSuppliers(relatedSuppliers);

        // Auto-select if only one supplier available
        if (relatedSuppliers.length === 1) {
          const onlySupplier = relatedSuppliers[0];
          setFormData((prevFormData) => ({
            ...prevFormData,
            supplier_id: onlySupplier.supplier_id || onlySupplier.id,
          }));
          setSelectedSupplier(onlySupplier);
        }
      } catch (err) {
        console.error("Error fetching suppliers for product:", err);
        setFilteredSuppliers([]);
      }
    } else {
      // Reset if product deselected
      setFormData((prevFormData) => ({
        ...prevFormData,
        product_id: "",
        supplier_id: "",
      }));
      setSelectedSupplier(null);
      setFilteredSuppliers(suppliers); // reset to all suppliers
    }

    setErrors((prevErrors) => ({ ...prevErrors, product_id: undefined }));
  };

  // Handle supplier selection
  const handleSupplierSelect = (option) => {
    const supplier = option ? option.raw : null;
    setSelectedSupplier(supplier);

    if (supplier) {
      // Get supplier ID, handling different possible formats
      const supplierId = supplier.supplier_id || supplier.id || "";
      console.log("Selected supplier:", supplier, "with ID:", supplierId);

      setFormData((prev) => ({
        ...prev,
        supplier_id: supplierId,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        supplier_id: "",
      }));
    }

    setErrors((prev) => ({ ...prev, supplier_id: undefined }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-100 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-md p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">New Purchase</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            disabled={isSubmitting}
          >
            ✕
          </button>
        </div>
        <form onSubmit={handleSubmit} noValidate>
          {errors.general && (
            <div className="mb-4 p-2 bg-red-100 border border-red-400 text-red-700 rounded">
              {errors.general}
            </div>
          )}

          {/* Product Selection */}
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">
              Product <span className="text-red-500">*</span>
            </label>
            <Select
              options={productOptions}
              value={
                productOptions.find(
                  (opt) => opt.value === formData.product_id
                ) || null
              }
              onChange={handleProductSelect}
              placeholder="Search or select a product"
              isSearchable
              isClearable
              classNamePrefix="react-select"
              menuPlacement="auto"
            />
            {errors.product_id && (
              <p className="mt-1 text-sm text-red-500">{errors.product_id}</p>
            )}
          </div>

          {/* Supplier Selection */}
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">
              Supplier <span className="text-red-500">*</span>
            </label>
            <Select
              options={supplierOptions}
              value={
                supplierOptions.find(
                  (opt) => opt.value === formData.supplier_id
                ) || null
              }
              onChange={handleSupplierSelect}
              placeholder="Search or select a supplier"
              isSearchable
              isClearable
              classNamePrefix="react-select"
              menuPlacement="auto"
              isDisabled={!selectedProduct}
              noOptionsMessage={() =>
                selectedProduct
                  ? "No suppliers found for selected product"
                  : "Select a product first"
              }
            />
            {errors.supplier_id && (
              <p className="mt-1 text-sm text-red-500">{errors.supplier_id}</p>
            )}
          </div>

          {/* Quantity */}
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">
              Quantity <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="1"
              name="quantity"
              value={formData.quantity}
              onChange={handleChange}
              disabled={isSubmitting}
              className={`w-full px-3 py-2 border rounded ${
                errors.quantity ? "border-red-500" : "border-gray-300"
              }`}
              required
            />
            {errors.quantity && (
              <p className="mt-1 text-sm text-red-500">{errors.quantity}</p>
            )}
          </div>

          {/* Warranty */}
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Warranty</label>
            <select
              name="warranty"
              value={formData.warranty}
              onChange={handleChange}
              disabled={isSubmitting}
              className="w-full px-3 py-2 border border-gray-300 rounded"
            >
              <option value="No Warranty">No Warranty</option>
              <option value="3 months">3 months</option>
              <option value="6 months">6 months</option>
              <option value="12 months">12 months</option>
              <option value="24 months">24 months</option>
              <option value="36 months">36 months</option>
              <option value="Service warranty only">Service Warranty only</option>

            </select>
          </div>

          {/* Buying Price */}
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">
              Buying Price <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              name="buying_price"
              value={formData.buying_price}
              onChange={handleChange}
              disabled={isSubmitting}
              className={`w-full px-3 py-2 border rounded ${
                errors.buying_price ? "border-red-500" : "border-gray-300"
              }`}
              required
            />
            {errors.buying_price && (
              <p className="mt-1 text-sm text-red-500">{errors.buying_price}</p>
            )}
          </div>

          {/* Selling Price */}
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">
              Selling Price <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              name="selling_price"
              value={formData.selling_price}
              onChange={handleChange}
              disabled={isSubmitting}
              className={`w-full px-3 py-2 border rounded ${
                errors.selling_price ? "border-red-500" : "border-gray-300"
              }`}
              required
            />
            {errors.selling_price && (
              <p className="mt-1 text-sm text-red-500">{errors.selling_price}</p>
            )}
          </div>

          {/* Date */}
          <div className="mb-6">
            <label className="block text-gray-700 mb-2">
              Purchase Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              disabled={isSubmitting}
              className={`w-full px-3 py-2 border rounded ${
                errors.date ? "border-red-500" : "border-gray-300"
              }`}
              required
            />
            {errors.date && (
              <p className="mt-1 text-sm text-red-500">{errors.date}</p>
            )}
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-4 py-2 rounded text-white ${
                isSubmitting ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {isSubmitting ? "Saving..." : "Save Purchase"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddPurchaseModal;
