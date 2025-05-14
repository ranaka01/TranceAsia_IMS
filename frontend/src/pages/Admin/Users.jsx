import React, { useState, useEffect } from "react";
import Button from "../../components/UI/Button";
import SearchInput from "../../components/UI/SearchInput";
import AddUserModal from "./AddUserModal";
import ViewUserModal from "./ViewUserModal";
import DeleteUserModal from "./DeleteUserModal";
import API from "../../utils/api";
import { jwtDecode } from "jwt-decode";

const Users = () => {
  // State management
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [actionMessage, setActionMessage] = useState(null);
  const [actionError, setActionError] = useState(null);

  // API URL
  const API_URL = "/users";

  // Get current user ID from token
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setCurrentUserId(decoded.userId);
      } catch (error) {
        console.error("Error decoding token:", error);
      }
    }
  }, []);

  // Fetch users from backend API
  const fetchUsers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await API.get(API_URL);
      const data = response.data?.data?.users || [];
      setUsers(data);
      setFilteredUsers(data);
    } catch (err) {
      console.error("Error fetching users:", err);
      if (err.response?.status === 403) {
        setError("You don't have permission to view users. Please contact an administrator.");
      } else {
        setError("Failed to load users. Please try again later.");
      }
      setUsers([]);
      setFilteredUsers([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch users when component mounts
  useEffect(() => {
    fetchUsers();
  }, []);

  // Function to perform the search filtering
  const performSearch = (query) => {
    if (!Array.isArray(users)) {
      setFilteredUsers([]);
      return;
    }

    if (!query || query.trim() === "") {
      setFilteredUsers([...users]);
    } else {
      const filtered = users.filter(
        (user) =>
          user.Username?.toLowerCase().includes(query.toLowerCase()) ||
          user.Email?.toLowerCase().includes(query.toLowerCase()) ||
          (user.Phone && user.Phone.includes(query)) ||
          user.Role?.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredUsers(filtered);
    }
  };

  // Update filtered users when users list changes or search query changes
  useEffect(() => {
    performSearch(searchQuery);
  }, [users, searchQuery]);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
  };

  const handleSearch = () => {
    performSearch(searchQuery);
  };

  const handleAddUser = () => {
    setIsAddModalOpen(true);
  };

  const handleCloseAddModal = () => {
    setIsAddModalOpen(false);
  };

  const handleViewUser = (user) => {
    setCurrentUser(user);
    setIsViewModalOpen(true);
  };

  const handleCloseViewModal = () => {
    setIsViewModalOpen(false);
    setCurrentUser(null);
  };

  const handleDeleteClick = (user) => {
    setCurrentUser(user);
    setIsDeleteModalOpen(true);
  };

  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setCurrentUser(null);
  };

  const handleDeleteUser = async () => {
    if (!currentUser) return;
    
    setIsSubmitting(true);
    setActionError(null);
    setActionMessage(null);
    
    try {
      await API.delete(`${API_URL}/${currentUser.User_ID}`);
      
      // Update local state
      const updatedUsers = users.filter(user => user.User_ID !== currentUser.User_ID);
      setUsers(updatedUsers);
      
      setActionMessage(`User "${currentUser.Username}" has been deleted successfully.`);
      
      // Close delete modal
      setIsDeleteModalOpen(false);
      setCurrentUser(null);
      
      // Auto-dismiss success message after 3 seconds
      setTimeout(() => {
        setActionMessage(null);
      }, 3000);
    } catch (err) {
      console.error("Error deleting user:", err);
      
      if (err.response?.status === 403) {
        setActionError("You don't have permission to delete users.");
      } else if (err.response?.data?.message) {
        setActionError(err.response.data.message);
      } else {
        setActionError("Failed to delete user. Please try again.");
      }
      
      // Auto-dismiss error message after 5 seconds
      setTimeout(() => {
        setActionError(null);
      }, 5000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveUser = async (userData) => {
    setIsSubmitting(true);
    setActionError(null);
    setActionMessage(null);
    
    try {
      await API.post(`${API_URL}/register-user`, userData);
      
      // Show success message
      setActionMessage("User created successfully.");
      
      // Refresh the users list
      fetchUsers();
      
      // Close the modal
      setIsAddModalOpen(false);
      
      // Auto-dismiss success message after 3 seconds
      setTimeout(() => {
        setActionMessage(null);
      }, 3000);
    } catch (err) {
      console.error("Error adding user:", err);
      
      if (err.response?.status === 403) {
        setActionError("You don't have permission to add users.");
      } else if (err.response?.data?.message) {
        setActionError(err.response.data.message);
      } else {
        setActionError("Failed to create user. Please try again.");
      }
      
      // Auto-dismiss error message after 5 seconds
      setTimeout(() => {
        setActionError(null);
      }, 5000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (userId, currentStatus) => {
    setIsSubmitting(true);
    setActionError(null);
    setActionMessage(null);
    
    try {
      const newStatus = currentStatus === 1 ? 0 : 1;
      
      // Prevent deactivating yourself
      if (userId === currentUserId && newStatus === 0) {
        throw new Error("You cannot deactivate your own account while logged in.");
      }
      
      await API.patch(`${API_URL}/${userId}/status`, { is_active: newStatus });
      
      // Update local state
      const updatedUsers = users.map((user) =>
        user.User_ID === userId ? { ...user, is_active: newStatus } : user
      );
      
      setUsers(updatedUsers);
      
      // Show success message
      setActionMessage(`User ${newStatus === 1 ? 'activated' : 'deactivated'} successfully.`);
      
      // Auto-dismiss success message after 3 seconds
      setTimeout(() => {
        setActionMessage(null);
      }, 3000);
    } catch (err) {
      console.error("Error updating user status:", err);
      
      if (err.message === "You cannot deactivate your own account while logged in.") {
        setActionError(err.message);
      } else if (err.response?.status === 403) {
        setActionError("You don't have permission to change user status.");
      } else if (err.response?.data?.message) {
        setActionError(err.response.data.message);
      } else {
        setActionError("Failed to update user status. Please try again.");
      }
      
      // Auto-dismiss error message after 5 seconds
      setTimeout(() => {
        setActionError(null);
      }, 5000);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Ensure filteredUsers is always an array to prevent map errors
  const safeFilteredUsers = Array.isArray(filteredUsers) ? filteredUsers : [];

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-semibold">Users</h1>
      </div>

      <div className="mb-4 flex">
        <div className="flex-grow">
          <SearchInput
            placeholder="Search by username, email, phone, or role"
            value={searchQuery}
            onChange={handleSearchChange}
            onSearch={handleSearch}
          />
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
          {error}
          <button className="ml-2 underline" onClick={fetchUsers}>
            Try Again
          </button>
        </div>
      )}
      
      {/* Action success message */}
      {actionMessage && (
        <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-md flex justify-between items-center">
          <span>{actionMessage}</span>
          <button onClick={() => setActionMessage(null)} className="text-gray-500 hover:text-gray-700">
            ✕
          </button>
        </div>
      )}
      
      {/* Action error message */}
      {actionError && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md flex justify-between items-center">
          <span>{actionError}</span>
          <button onClick={() => setActionError(null)} className="text-gray-500 hover:text-gray-700">
            ✕
          </button>
        </div>
      )}

      {/* Loading state */}
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        /* Users table - with scrollable container */
        <div className="flex-1 overflow-auto mb-16">
          <table className="w-full border-collapse">
            <thead className="sticky top-0 bg-white">
              <tr className="border-b border-gray-200">
                <th className="py-3 px-4 text-left">Username</th>
                <th className="py-3 px-4 text-left">Email</th>
                <th className="py-3 px-4 text-left">Phone</th>
                <th className="py-3 px-4 text-left">Role</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {safeFilteredUsers.length > 0 ? (
                safeFilteredUsers.map((user, index) => (
                  <tr
                    key={`${user.User_ID || index}-${index}`}
                    className="border-b border-gray-200 hover:bg-gray-50"
                  >
                    <td className="py-3 px-4 relative">
                      {user.Username || ""}
                      
                      {/* Currently logged in indicator */}
                      {parseInt(user.User_ID) === currentUserId && (
                        <span 
                          className="absolute top-2 -left-2 h-3 w-3 bg-green-500 rounded-full"
                          title="Currently logged in"
                        ></span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div
                        className={`${
                          user.Email && user.Email.length > 25
                            ? "text-sm"
                            : ""
                        } truncate max-w-[200px]`}
                        title={user.Email || ""}
                      >
                        {user.Email || ""}
                      </div>
                    </td>
                    <td className="py-3 px-4">{user.Phone || ""}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        user.Role === 'Admin' 
                          ? 'bg-purple-100 text-purple-800' 
                          : user.Role === 'Cashier'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {user.Role || ""}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          user.is_active
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {user.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex justify-center space-x-2">
                        {/* View Details Button */}
                        <button
                          onClick={() => handleViewUser(user)}
                          className="p-1 text-blue-600 hover:text-blue-800"
                          title="View Details"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                        </button>
                        
                        {/* Activate/Deactivate Button */}
                        <button
                          onClick={() => handleToggleStatus(user.User_ID, user.is_active)}
                          className={`p-1 ${
                            user.is_active
                              ? "text-red-600 hover:text-red-800"
                              : "text-green-600 hover:text-green-800"
                          }`}
                          disabled={isSubmitting}
                          title={user.is_active ? "Deactivate" : "Activate"}
                        >
                          {user.is_active ? (
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-5 w-5"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                              />
                            </svg>
                          ) : (
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-5 w-5"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                          )}
                        </button>
                        
                        {/* Delete Button */}
                        <button
                          onClick={() => handleDeleteClick(user)}
                          className="p-1 text-red-600 hover:text-red-800"
                          disabled={isSubmitting || parseInt(user.User_ID) === currentUserId}
                          title={parseInt(user.User_ID) === currentUserId ? "Cannot delete your own account" : "Delete User"}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            opacity={parseInt(user.User_ID) === currentUserId ? 0.5 : 1}
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
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="6"
                    className="py-4 px-4 text-center text-gray-500"
                  >
                    No users found matching your search criteria
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Add User button (positioned at bottom right) */}
      <div className="fixed bottom-6 right-6">
        <Button
          variant="primary"
          onClick={handleAddUser}
          className="bg-blue-600 text-white py-2 px-6 rounded hover:bg-blue-700 transition-colors"
          disabled={isSubmitting}
        >
          Add User
        </Button>
      </div>

      {/* Add User Modal */}
      <AddUserModal
        isOpen={isAddModalOpen}
        onClose={handleCloseAddModal}
        onSave={handleSaveUser}
        loading={isSubmitting}
      />

      {/* View User Modal */}
      {isViewModalOpen && currentUser && (
        <ViewUserModal
          isOpen={isViewModalOpen}
          onClose={handleCloseViewModal}
          user={currentUser}
        />
      )}

      {/* Delete User Modal */}
      {isDeleteModalOpen && currentUser && (
        <DeleteUserModal
          isOpen={isDeleteModalOpen}
          onClose={handleCloseDeleteModal}
          onDelete={handleDeleteUser}
          user={currentUser}
          loading={isSubmitting}
        />
      )}
    </div>
  );
};

export default Users;