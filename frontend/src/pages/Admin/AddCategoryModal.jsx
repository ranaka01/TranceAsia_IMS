import React, { useState, useEffect } from "react";

const AddCategoryModal = ({ 
  isOpen, 
  onClose, 
  onSave, 
  initialValue = "", 
  title = "Add Category",
  buttonText = "Save",
  isLoading = false
}) => {
  const [categoryName, setCategoryName] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      setCategoryName(initialValue);
      setError("");
    }
  }, [isOpen, initialValue]);

  const handleChange = (e) => {
    setCategoryName(e.target.value);
    if (error) setError("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!categoryName || categoryName.trim() === "") {
      setError("Category name is required");
      return;
    }
    
    if (categoryName.trim().length < 3) {
      setError("Category name must be at least 3 characters");
      return;
    }
    
    onSave(categoryName.trim());
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-100 bg-opacity-10 flex items-center justify-center z-50">


      <div className="bg-white rounded-md p-5 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            disabled={isLoading}
          >
            ✕
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-1">
              Category Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={categoryName}
              onChange={handleChange}
              placeholder="Enter category name"
              className={`w-full px-3 py-2 border ${error ? 'border-red-500' : 'border-gray-300'} rounded-md`}
              required
              disabled={isLoading}
            />
            {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
          </div>
          
          <button
            type="submit"
            className={`w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                Processing...
              </div>
            ) : (
              buttonText
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddCategoryModal;