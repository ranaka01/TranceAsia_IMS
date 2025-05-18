import React from "react";

const DeleteUserModal = ({ isOpen, onClose, onDelete, user, loading }) => {
  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 bg-gray-100 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-md p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Delete User</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            disabled={loading}
          >
            ✕
          </button>
        </div>

        <div className="mb-6">
          <p className="text-gray-700 mb-4">
            Are you sure you want to delete the user <strong>{user.Username}</strong>?
          </p>
          <p className="text-gray-700 mb-2">
            This action cannot be undone. All data associated with this user will be permanently removed.
          </p>
          <p className="text-red-600 text-sm">
            Note: Deleting a user may affect related data in the system.
          </p>
        </div>

        <div className="flex justify-end space-x-4">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={onDelete}
            className={`px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors ${
              loading ? "opacity-70 cursor-not-allowed" : ""
            }`}
            disabled={loading}
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                Deleting...
              </div>
            ) : (
              "Delete"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteUserModal;