import React, { useState, useEffect } from 'react';
import { MdCircle, MdCheck, MdDelete, MdRefresh, MdFilterList, MdOutlineCheckCircle } from 'react-icons/md';
import { toast } from 'react-toastify';
import AdminLayout from './AdminLayout';
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllNotifications,
  formatNotificationTime
} from '../../services/notificationService';

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');
  const [selectedNotifications, setSelectedNotifications] = useState([]);
  const [isSelectMode, setIsSelectMode] = useState(false);

  // Fetch notifications when component mounts or filter changes
  useEffect(() => {
    fetchNotifications();

    // Direct API call for debugging
    const checkDirectAPI = async () => {
      try {
        console.log('Making direct API call to /notifications');
        const response = await fetch('http://localhost:5000/notifications');
        const data = await response.json();
        console.log('Direct API call result:', data);

        // If we got data but the regular fetch didn't work, use this data
        if (data && data.status === 'success' && data.data && data.data.notifications) {
          console.log('Using direct API call data for notifications');
          setNotifications(data.data.notifications);
        }
      } catch (err) {
        console.error('Error in direct API call:', err);
      }
    };

    checkDirectAPI();
  }, [activeFilter]);

  // Function to fetch notifications
  const fetchNotifications = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const filters = {};

      // Apply filters
      if (activeFilter === 'unread') {
        filters.isRead = false;
      } else if (activeFilter === 'read') {
        filters.isRead = true;
      } else if (activeFilter !== 'all') {
        filters.type = activeFilter;
      }

      console.log('Fetching notifications with filters:', filters);
      const data = await getNotifications(filters);
      console.log('Fetched notifications:', data);

      if (data && Array.isArray(data)) {
        setNotifications(data);
        setSelectedNotifications([]);
      } else {
        console.error('Invalid notification data received:', data);
        setError('Received invalid notification data from server');
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError('Failed to load notifications');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle marking a notification as read
  const handleMarkAsRead = async (id) => {
    try {
      await markAsRead(id);
      setNotifications(notifications.map(notification =>
        notification.id === id ? { ...notification, is_read: true, isRead: true } : notification
      ));
      toast.success('Notification marked as read');
    } catch (err) {
      console.error('Error marking notification as read:', err);
      toast.error('Failed to mark notification as read');
    }
  };

  // Handle deleting a notification
  const handleDeleteNotification = async (id) => {
    try {
      await deleteNotification(id);
      setNotifications(notifications.filter(notification => notification.id !== id));
      toast.success('Notification deleted');
    } catch (err) {
      console.error('Error deleting notification:', err);
      toast.error('Failed to delete notification');
    }
  };

  // Handle marking all notifications as read
  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
      setNotifications(notifications.map(notification => ({ ...notification, is_read: true, isRead: true })));
      toast.success('All notifications marked as read');
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
      toast.error('Failed to mark all notifications as read');
    }
  };

  // Handle deleting all notifications
  const handleDeleteAllNotifications = async () => {
    if (window.confirm('Are you sure you want to delete all notifications? This action cannot be undone.')) {
      try {
        await deleteAllNotifications();
        setNotifications([]);
        toast.success('All notifications deleted');
      } catch (err) {
        console.error('Error deleting all notifications:', err);
        toast.error('Failed to delete all notifications');
      }
    }
  };

  // Handle marking selected notifications as read
  const handleMarkSelectedAsRead = async () => {
    try {
      const promises = selectedNotifications.map(id => markAsRead(id));
      await Promise.all(promises);

      setNotifications(notifications.map(notification =>
        selectedNotifications.includes(notification.id)
          ? { ...notification, is_read: true }
          : notification
      ));

      setSelectedNotifications([]);
      setIsSelectMode(false);
      toast.success('Selected notifications marked as read');
    } catch (err) {
      console.error('Error marking selected notifications as read:', err);
      toast.error('Failed to mark selected notifications as read');
    }
  };

  // Handle deleting selected notifications
  const handleDeleteSelected = async () => {
    if (window.confirm('Are you sure you want to delete the selected notifications? This action cannot be undone.')) {
      try {
        const promises = selectedNotifications.map(id => deleteNotification(id));
        await Promise.all(promises);

        setNotifications(notifications.filter(notification =>
          !selectedNotifications.includes(notification.id)
        ));

        setSelectedNotifications([]);
        setIsSelectMode(false);
        toast.success('Selected notifications deleted');
      } catch (err) {
        console.error('Error deleting selected notifications:', err);
        toast.error('Failed to delete selected notifications');
      }
    }
  };

  // Toggle notification selection
  const toggleNotificationSelection = (id) => {
    if (selectedNotifications.includes(id)) {
      setSelectedNotifications(selectedNotifications.filter(notificationId => notificationId !== id));
    } else {
      setSelectedNotifications([...selectedNotifications, id]);
    }
  };

  // Toggle select mode
  const toggleSelectMode = () => {
    setIsSelectMode(!isSelectMode);
    if (isSelectMode) {
      setSelectedNotifications([]);
    }
  };

  // Get notification type styles
  const getNotificationTypeStyles = (type) => {
    switch (type) {
      case 'order':
        return 'bg-blue-100 text-blue-500';
      case 'inventory':
        return 'bg-yellow-100 text-yellow-500';
      case 'repair':
        return 'bg-green-100 text-green-500';
      case 'customer':
        return 'bg-purple-100 text-purple-500';
      case 'payment':
        return 'bg-emerald-100 text-emerald-500';
      default:
        return 'bg-gray-100 text-gray-500';
    }
  };

  return (
    <AdminLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md">
          {/* Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
              <h1 className="text-2xl font-semibold text-gray-800 mb-4 sm:mb-0">Notifications</h1>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={fetchNotifications}
                  className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-md text-gray-700 flex items-center"
                >
                  <MdRefresh className="mr-1" /> Refresh
                </button>

                <button
                  onClick={toggleSelectMode}
                  className={`px-3 py-2 rounded-md flex items-center ${
                    isSelectMode
                      ? 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <MdFilterList className="mr-1" />
                  {isSelectMode ? 'Cancel Selection' : 'Select Multiple'}
                </button>

                {isSelectMode && selectedNotifications.length > 0 && (
                  <>
                    <button
                      onClick={handleMarkSelectedAsRead}
                      className="px-3 py-2 bg-green-100 hover:bg-green-200 rounded-md text-green-700 flex items-center"
                    >
                      <MdOutlineCheckCircle className="mr-1" /> Mark Selected as Read
                    </button>

                    <button
                      onClick={handleDeleteSelected}
                      className="px-3 py-2 bg-red-100 hover:bg-red-200 rounded-md text-red-700 flex items-center"
                    >
                      <MdDelete className="mr-1" /> Delete Selected
                    </button>
                  </>
                )}

                <button
                  onClick={handleMarkAllAsRead}
                  className="px-3 py-2 bg-blue-100 hover:bg-blue-200 rounded-md text-blue-700 flex items-center"
                >
                  <MdCheck className="mr-1" /> Mark All as Read
                </button>

                <button
                  onClick={handleDeleteAllNotifications}
                  className="px-3 py-2 bg-red-100 hover:bg-red-200 rounded-md text-red-700 flex items-center"
                >
                  <MdDelete className="mr-1" /> Delete All
                </button>
              </div>
            </div>

            {/* Filters */}
            <div className="mt-6 flex flex-wrap gap-2">
              <button
                onClick={() => setActiveFilter('all')}
                className={`px-3 py-1.5 rounded-full text-sm font-medium ${
                  activeFilter === 'all'
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All
              </button>

              <button
                onClick={() => setActiveFilter('unread')}
                className={`px-3 py-1.5 rounded-full text-sm font-medium ${
                  activeFilter === 'unread'
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Unread
              </button>

              <button
                onClick={() => setActiveFilter('read')}
                className={`px-3 py-1.5 rounded-full text-sm font-medium ${
                  activeFilter === 'read'
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Read
              </button>

              <button
                onClick={() => setActiveFilter('repair')}
                className={`px-3 py-1.5 rounded-full text-sm font-medium ${
                  activeFilter === 'repair'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Repairs
              </button>

              <button
                onClick={() => setActiveFilter('order')}
                className={`px-3 py-1.5 rounded-full text-sm font-medium ${
                  activeFilter === 'order'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Orders
              </button>

              <button
                onClick={() => setActiveFilter('inventory')}
                className={`px-3 py-1.5 rounded-full text-sm font-medium ${
                  activeFilter === 'inventory'
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Inventory
              </button>

              <button
                onClick={() => setActiveFilter('customer')}
                className={`px-3 py-1.5 rounded-full text-sm font-medium ${
                  activeFilter === 'customer'
                    ? 'bg-purple-100 text-purple-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Customers
              </button>

              <button
                onClick={() => setActiveFilter('payment')}
                className={`px-3 py-1.5 rounded-full text-sm font-medium ${
                  activeFilter === 'payment'
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Payments
              </button>
            </div>
          </div>

          {/* Notification list */}
          <div className="divide-y divide-gray-100">
            {isLoading ? (
              <div className="flex justify-center items-center py-16">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
              </div>
            ) : error ? (
              <div className="text-red-500 text-center py-16">
                <p className="text-xl mb-4">{error}</p>
                <button
                  onClick={fetchNotifications}
                  className="px-4 py-2 bg-indigo-100 hover:bg-indigo-200 rounded-md text-indigo-700"
                >
                  Try again
                </button>
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-gray-500 text-center py-16">
                <p className="text-xl">No notifications found</p>
                <p className="mt-2">Any system notifications will appear here</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-6 ${notification.is_read || notification.isRead ? 'bg-white' : 'bg-blue-50'} hover:bg-gray-50 transition-colors`}
                >
                  <div className="flex">
                    {/* Selection checkbox (when in select mode) */}
                    {isSelectMode && (
                      <div className="mr-4 flex items-start pt-1">
                        <input
                          type="checkbox"
                          checked={selectedNotifications.includes(notification.id)}
                          onChange={() => toggleNotificationSelection(notification.id)}
                          className="h-5 w-5 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                        />
                      </div>
                    )}

                    {/* Status indicator (when not in select mode) */}
                    {!isSelectMode && (
                      <div className="mr-4 mt-1.5">
                        {!(notification.is_read || notification.isRead) && (
                          <MdCircle className="text-blue-500" size={10} />
                        )}
                      </div>
                    )}

                    {/* Content */}
                    <div className="flex-1">
                      <div className="flex flex-wrap justify-between items-start gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <h3 className={`font-medium ${(notification.is_read || notification.isRead) ? 'text-gray-700' : 'text-gray-900'}`}>
                            {notification.title}
                          </h3>
                          <span className={`px-2 py-0.5 text-xs rounded-full ${getNotificationTypeStyles(notification.type)}`}>
                            {notification.type.charAt(0).toUpperCase() + notification.type.slice(1)}
                          </span>
                        </div>
                        <span className="text-xs text-gray-500">
                          {formatNotificationTime(notification.created_at)}
                        </span>
                      </div>

                      <p className={`text-sm ${(notification.is_read || notification.isRead) ? 'text-gray-500' : 'text-gray-700'} mb-3`}>
                        {notification.message}
                      </p>

                      {/* Additional data if available */}
                      {notification.type === 'repair' && (
                        <div className="mt-2 p-3 bg-gray-50 rounded-md text-sm text-gray-600 border border-gray-100">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            <p><strong>Repair ID:</strong> {notification.data?.repairId || notification.reference_id || 'N/A'}</p>
                            <p><strong>Customer:</strong> {notification.data?.customer || 'N/A'}</p>
                            <p><strong>Device:</strong> {notification.data?.deviceType || 'N/A'} {notification.data?.deviceModel || ''}</p>
                            <p><strong>Technician:</strong> {notification.data?.technician || 'Not assigned'}</p>
                            <p className="md:col-span-2"><strong>Status Change:</strong> <span className="text-gray-500">{notification.data?.previousStatus || 'N/A'}</span> → <span className="text-blue-600 font-medium">{notification.data?.newStatus || 'N/A'}</span></p>
                            {notification.data?.timestamp ? (
                              <p className="text-xs text-gray-400">{new Date(notification.data.timestamp).toLocaleString()}</p>
                            ) : (
                              <p className="text-xs text-gray-400">{new Date(notification.created_at).toLocaleString()}</p>
                            )}
                          </div>
                        </div>
                      )}

                      {notification.data && notification.data.error && (
                        <div className="mt-2 p-3 bg-red-50 rounded-md text-sm text-red-600 border border-red-100">
                          <p>Error displaying notification data: {notification.data.error}</p>
                        </div>
                      )}

                      {/* Debug information - will help identify issues */}
                      {process.env.NODE_ENV === 'development' && (
                        <details className="mt-2 text-xs text-gray-400">
                          <summary>Debug Info</summary>
                          <pre className="mt-1 p-2 bg-gray-100 rounded overflow-auto max-h-40">
                            {JSON.stringify(notification, null, 2)}
                          </pre>
                        </details>
                      )}

                      {/* Actions */}
                      <div className="mt-3 flex gap-2">
                        {!(notification.is_read || notification.isRead) && (
                          <button
                            onClick={() => handleMarkAsRead(notification.id)}
                            className="px-3 py-1 bg-green-50 hover:bg-green-100 text-green-700 text-sm rounded-md flex items-center"
                          >
                            <MdCheck className="mr-1" size={16} /> Mark as read
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteNotification(notification.id)}
                          className="px-3 py-1 bg-red-50 hover:bg-red-100 text-red-700 text-sm rounded-md flex items-center"
                        >
                          <MdDelete className="mr-1" size={16} /> Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default NotificationsPage;