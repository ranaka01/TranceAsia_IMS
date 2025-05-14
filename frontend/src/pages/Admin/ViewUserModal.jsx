import React from "react";

const ViewUserModal = ({ isOpen, onClose, user }) => {
  if (!isOpen || !user) return null;

  // Format the creation date for better readability
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-md p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold">User Details</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          {/* User ID */}
          <div>
            <label className="block text-gray-500 text-sm mb-1">User ID</label>
            <p className="text-gray-800">{user.User_ID || "N/A"}</p>
          </div>

          {/* Username */}
          <div>
            <label className="block text-gray-500 text-sm mb-1">Username</label>
            <p className="text-gray-800">{user.Username || "N/A"}</p>
          </div>

          {/* Full Name (first and last name) */}
          <div>
            <label className="block text-gray-500 text-sm mb-1">Full Name</label>
            <p className="text-gray-800">
              {user.first_name && user.last_name
                ? `${user.first_name} ${user.last_name}`
                : user.first_name || user.last_name || "N/A"}
            </p>
          </div>

          {/* Email */}
          <div>
            <label className="block text-gray-500 text-sm mb-1">Email</label>
            <p className="text-gray-800">{user.Email || "N/A"}</p>
          </div>

          {/* Phone */}
          <div>
            <label className="block text-gray-500 text-sm mb-1">Phone Number</label>
            <p className="text-gray-800">{user.Phone || "N/A"}</p>
          </div>

          {/* Role */}
          <div>
            <label className="block text-gray-500 text-sm mb-1">Role</label>
            <p className="text-gray-800">
              <span className={`px-2 py-1 rounded-full text-xs ${
                user.Role === 'Admin' 
                  ? 'bg-purple-100 text-purple-800' 
                  : user.Role === 'Cashier'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-blue-100 text-blue-800'
              }`}>
                {user.Role || "N/A"}
              </span>
            </p>
          </div>

          {/* Status */}
          <div>
            <label className="block text-gray-500 text-sm mb-1">Status</label>
            <p className="text-gray-800">
              <span className={`px-2 py-1 rounded-full text-xs ${
                user.is_active
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800"
              }`}>
                {user.is_active ? "Active" : "Inactive"}
              </span>
            </p>
          </div>

          {/* Created At */}
          <div>
            <label className="block text-gray-500 text-sm mb-1">Created At</label>
            <p className="text-gray-800">{formatDate(user.created_at)}</p>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ViewUserModal;