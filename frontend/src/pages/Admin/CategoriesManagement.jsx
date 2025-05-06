import React, { useState } from "react";
import AddCategoryModal from "./AddCategoryModal";

const CategoriesManagement = ({ 
  categories, 
  setCategories, 
  selectedCategory, 
  setSelectedCategory,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory, 
  isLoading = false
}) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentCategory, setCurrentCategory] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [error, setError] = useState(null);

  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
  };

  const handleAddCategory = () => {
    setIsAddModalOpen(true);
  };

  const handleSaveCategory = async (categoryName) => {
    if (!categoryName || categoryName.trim() === '') {
      return;
    }
    
    // Call the parent component's add function
    const success = await onAddCategory(categoryName);
    
    if (success) {
      setIsAddModalOpen(false);
    }
  };

  const handleEditClick = (category) => {
    // Skip "All categories" - it shouldn't be editable
    if (category.id === 'all') return;
    
    setCurrentCategory(category);
    setIsEditModalOpen(true);
  };

  const handleUpdateCategory = async (newCategoryName) => {
    if (!newCategoryName || newCategoryName.trim() === '' || !currentCategory) {
      setIsEditModalOpen(false);
      return;
    }
    
    // Call the parent component's update function
    const success = await onUpdateCategory(currentCategory.id, newCategoryName);
    
    if (success) {
      setIsEditModalOpen(false);
      setCurrentCategory(null);
    }
  };

  const handleDeleteClick = (category) => {
    // Skip "All categories" - it shouldn't be deletable
    if (category.id === 'all') return;
    
    setCategoryToDelete(category);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (!categoryToDelete) {
      setShowDeleteConfirm(false);
      return;
    }
    
    // Call the parent component's delete function
    const success = await onDeleteCategory(categoryToDelete.id);
    
    if (success) {
      setShowDeleteConfirm(false);
      setCategoryToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
    setCategoryToDelete(null);
  };

  const clearError = () => {
    setError(null);
  };

  return (
    <div className="bg-gray-100 rounded-md p-3 mb-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-medium">Categories</h3>
        <button
          onClick={handleAddCategory}
          className={`bg-blue-600 text-white py-1 px-3 rounded text-sm hover:bg-blue-700 ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
          disabled={isLoading}
        >
          Add New
        </button>
      </div>
      
      {error && (
        <div className="mb-4 p-2 bg-red-100 border border-red-400 text-red-700 rounded-md text-sm flex justify-between">
          <span>{error}</span>
          <button onClick={clearError} className="text-red-700 font-bold">×</button>
        </div>
      )}
      
      {categories.map((category) => (
        <div 
          key={category.id}
          className={`flex justify-between items-center py-3 px-4 rounded-md mb-2 ${
            selectedCategory.id === category.id ? "bg-gray-300" : "bg-white hover:bg-gray-50"
          }`}
          onClick={() => handleCategorySelect(category)}
          style={{ cursor: 'pointer' }}
        >
          <span>{category.name}</span>
          {category.id !== 'all' && (
            <div className="flex space-x-2" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => handleEditClick(category)}
                className="p-1 text-blue-600 hover:text-blue-800"
                title="Edit Category"
                disabled={isLoading}
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
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
              </button>
              <button
                onClick={() => handleDeleteClick(category)}
                className="p-1 text-red-600 hover:text-red-800"
                title="Delete Category"
                disabled={isLoading}
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
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
            </div>
          )}
        </div>
      ))}

      {/* Add Category Modal */}
      <AddCategoryModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={handleSaveCategory}
        title="Add Category"
        buttonText="Save"
        isLoading={isLoading}
      />

      {/* Edit Category Modal */}
      <AddCategoryModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleUpdateCategory}
        initialValue={currentCategory ? currentCategory.name : ""}
        title="Edit Category"
        buttonText="Update"
        isLoading={isLoading}
      />

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-md p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">Confirm Delete</h2>
            <p className="mb-6">
              Are you sure you want to delete the category "{categoryToDelete?.name}"? 
              This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={handleCancelDelete}
                className="px-4 py-2 border border-gray-300 rounded-md"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className={`px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 ${
                  isLoading ? 'opacity-70 cursor-not-allowed' : ''
                }`}
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                    Deleting...
                  </div>
                ) : (
                  'Delete'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoriesManagement;