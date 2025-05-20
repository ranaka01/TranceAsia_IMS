import React, { useState, useEffect, useRef } from 'react';
import { MdCircle, MdCheck, MdDelete, MdRefresh, MdFilterList, MdOutlineCheckCircle, MdWifi, MdWifiOff } from 'react-icons/md';
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
import websocketService from '../../services/websocketService';

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');
  const [selectedNotifications, setSelectedNotifications] = useState([]);
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);

  // Keep track of notification listeners
  const notificationListeners = useRef([]);

  // Process notification to ensure consistent format
  const processNotification = (notification) => {
    // Ensure notification has all required fields
    return {
      id: notification.id || Math.random().toString(36).substring(2, 9),
      title: notification.title || 'Notification',
      message: notification.message || 'No message provided',
      type: notification.type || 'system',
      is_read: notification.is_read || notification.isRead || false,
      isRead: notification.is_read || notification.isRead || false,
      created_at: notification.created_at || new Date().toISOString(),
      data: notification.data || {},
      reference_id: notification.reference_id || null
    };
  };

  // Helper function to check if notification is read
  const isNotificationRead = (notification) => {
    return notification.is_read || notification.isRead;
  };

  // Function to fetch notifications
  const fetchNotifications = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Get token from localStorage for authentication
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      // Make direct API call
      const response = await fetch('http://localhost:5000/notifications', { headers });
      const data = await response.json();
      console.log('Direct API call result:', data);

      if (data && data.status === 'success') {
        let notificationsArray = [];

        if (data.data && Array.isArray(data.data.notifications)) {
          notificationsArray = data.data.notifications;
        } else if (data.data && Array.isArray(data.data)) {
          notificationsArray = data.data;
        }

        console.log('Extracted notifications array:', notificationsArray);
        console.log('Notifications array length:', notificationsArray.length);

        if (notificationsArray.length === 0) {
          console.warn('No notifications found in response');
          setNotifications([]);
        } else {
          console.log('First notification in array:', notificationsArray[0]);

          // Process notifications to ensure consistent format
          const processedNotifications = notificationsArray.map(processNotification);

          console.log('Setting notifications state with processed data:', processedNotifications);

          // Force a new array reference to ensure React detects the change
          setNotifications([...processedNotifications]);
          setSelectedNotifications([]);
        }
      } else {
        console.error('API response does not have success status:', data);
        setError('API returned an error response');
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError('Failed to load notifications. Please try refreshing the page.');
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
          ? { ...notification, is_read: true, isRead: true }
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

  // Debug function for direct API call
  const debugApiCall = async () => {
    try {
      // Get token from localStorage for authentication
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const response = await fetch('http://localhost:5000/notifications', { headers });
      const data = await response.json();
      console.log('Debug API call result:', data);

      if (data && data.status === 'success') {
        let notificationsArray = [];

        if (data.data && Array.isArray(data.data.notifications)) {
          notificationsArray = data.data.notifications;
        } else if (data.data && Array.isArray(data.data)) {
          notificationsArray = data.data;
        }

        console.log('Debug notifications array:', notificationsArray);

        if (notificationsArray.length > 0) {
          // Process notifications to ensure they have required fields
          const processedNotifications = notificationsArray.map(processNotification);

          console.log('Processed notifications:', processedNotifications);
          alert(`Found ${processedNotifications.length} notifications in API response. Setting state now.`);

          // Force update the state with a new array reference
          setNotifications([...processedNotifications]);
        } else {
          alert('No notifications found in the API response.');
          setNotifications([]);
        }
      } else {
        alert('API response format is not as expected. Check console for details.');
      }
    } catch (err) {
      console.error('Debug API call error:', err);
      alert(`Error: ${err.message}`);
    }
  };

  // Initialize WebSocket connection and set up event listeners
  useEffect(() => {
    console.log('Initializing WebSocket connection...');

    // Connect to WebSocket server
    websocketService.connect();

    // Set up connection status listener
    const connectionListener = websocketService.on('connection', (data) => {
      console.log('WebSocket connection status:', data.connected);
      setWsConnected(data.connected);

      if (data.connected) {
        toast.success('Real-time notifications connected');
      } else {
        toast.warn('Real-time notifications disconnected');
      }
    });

    // Set up notification listener
    const notificationListener = websocketService.on('notification', (notification) => {
      console.log('Received notification via WebSocket:', notification);

      // Process the notification
      const processedNotification = processNotification(notification);

      // Add to notifications state
      setNotifications(prev => {
        // Check if notification already exists
        const exists = prev.some(n => n.id === processedNotification.id);
        if (exists) {
          return prev;
        }
        // Add new notification at the beginning
        return [processedNotification, ...prev];
      });

      // Show toast notification
      toast.info(`New notification: ${notification.title}`);
    });

    // Set up notification update listener
    const updateListener = websocketService.on('notification_update', (update) => {
      console.log('Received notification update via WebSocket:', update);

      if (update.type === 'read') {
        // Update single notification read status
        setNotifications(prev =>
          prev.map(notification =>
            notification.id === update.id
              ? { ...notification, is_read: true, isRead: true }
              : notification
          )
        );
      } else if (update.type === 'read_all') {
        // Mark all notifications as read
        setNotifications(prev =>
          prev.map(notification => ({ ...notification, is_read: true, isRead: true }))
        );
      } else if (update.type === 'delete') {
        // Remove deleted notification
        setNotifications(prev =>
          prev.filter(notification => notification.id !== update.id)
        );
      } else if (update.type === 'delete_all') {
        // Clear all notifications
        setNotifications([]);
      }
    });

    // Store listeners for cleanup
    notificationListeners.current = [
      connectionListener,
      notificationListener,
      updateListener
    ];

    // Initial fetch of notifications
    fetchNotifications();

    // Clean up WebSocket connection and listeners on unmount
    return () => {
      console.log('Cleaning up WebSocket connection and listeners');

      // Remove all listeners
      notificationListeners.current.forEach(unsubscribe => {
        if (typeof unsubscribe === 'function') {
          unsubscribe();
        }
      });

      // Disconnect WebSocket
      websocketService.disconnect();
    };
  }, []); // Empty dependency array means this runs once on mount

  // Fetch notifications when filter changes
  useEffect(() => {
    fetchNotifications();
  }, [activeFilter]);

  // Debug notifications state changes
  useEffect(() => {
    console.log('Notifications state updated:', notifications);
    console.log('Notifications length:', notifications.length);
    if (notifications.length > 0) {
      console.log('First notification:', notifications[0]);
    }
  }, [notifications]);

  return (
    <AdminLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md">
          {/* Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
              <div className="flex items-center mb-4 sm:mb-0">
                <h1 className="text-2xl font-semibold text-gray-800 mr-3">Notifications</h1>
                {/* WebSocket connection indicator */}
                {wsConnected ? (
                  <div className="flex items-center text-green-600 text-sm">
                    <MdWifi className="mr-1" />
                    <span>Real-time</span>
                  </div>
                ) : (
                  <div className="flex items-center text-red-500 text-sm">
                    <MdWifiOff className="mr-1" />
                    <span>Offline</span>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={fetchNotifications}
                  className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-md text-gray-700 flex items-center"
                >
                  <MdRefresh className="mr-1" /> Refresh
                </button>

                <button
                  onClick={debugApiCall}
                  className="px-3 py-2 bg-purple-100 hover:bg-purple-200 rounded-md text-purple-700 flex items-center"
                >
                  Debug API
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
          </div>

          {/* Debug Info */}
          <div className="p-4 bg-yellow-50 border-b border-yellow-200">
            <details>
              <summary className="text-sm font-medium text-yellow-700 cursor-pointer">Debug Information (Expand/Collapse)</summary>
              <div className="mt-2 p-2 bg-white rounded text-xs">
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2 bg-blue-50 rounded">
                    <h3 className="font-bold text-blue-700 mb-1">Notifications State</h3>
                    <p>Notifications Count: <span className="font-mono bg-white px-1 rounded">{notifications.length}</span></p>
                    <p>Loading State: <span className="font-mono bg-white px-1 rounded">{isLoading ? 'Loading...' : 'Not Loading'}</span></p>
                    <p>Error State: <span className="font-mono bg-white px-1 rounded">{error ? error : 'No Error'}</span></p>
                    <p>Active Filter: <span className="font-mono bg-white px-1 rounded">{activeFilter}</span></p>
                    <p>WebSocket: <span className={`font-mono bg-white px-1 rounded ${wsConnected ? 'text-green-600' : 'text-red-500'}`}>{wsConnected ? 'Connected' : 'Disconnected'}</span></p>
                  </div>

                  <div className="p-2 bg-green-50 rounded">
                    <h3 className="font-bold text-green-700 mb-1">API Information</h3>
                    <p>Backend URL: <span className="font-mono bg-white px-1 rounded">http://localhost:5000</span></p>
                    <p>Endpoint: <span className="font-mono bg-white px-1 rounded">/notifications</span></p>
                    <p>Authentication: <span className="font-mono bg-white px-1 rounded">{localStorage.getItem('token') ? 'Token Present' : 'No Token'}</span></p>
                  </div>
                </div>

                <div className="mt-2">
                  <h3 className="font-bold text-gray-700 mb-1">Notifications Data</h3>
                  <pre className="p-2 bg-gray-50 rounded overflow-auto max-h-40 text-xs">
                    {JSON.stringify(notifications, null, 2)}
                  </pre>
                </div>

                <div className="mt-2 flex flex-wrap gap-2">
                  <button
                    onClick={() => {
                      console.log('Current notifications state:', notifications);
                      alert(`Logged ${notifications.length} notifications to console`);
                    }}
                    className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs"
                  >
                    Log to Console
                  </button>

                  <button
                    onClick={() => {
                      const mockNotifications = [
                        {
                          id: 999,
                          title: 'Test Notification',
                          message: 'This is a test notification added for debugging',
                          type: 'system',
                          is_read: false,
                          isRead: false,
                          created_at: new Date().toISOString()
                        }
                      ];
                      setNotifications(prev => [...mockNotifications, ...prev]);
                      alert('Added test notification');
                    }}
                    className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs"
                  >
                    Add Test Notification
                  </button>

                  <button
                    onClick={() => {
                      if (websocketService.isConnected()) {
                        websocketService.disconnect();
                        toast.info('WebSocket disconnected manually');
                      } else {
                        websocketService.connect();
                        toast.info('WebSocket connection initiated');
                      }
                    }}
                    className={`px-2 py-1 rounded text-xs ${wsConnected ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}
                  >
                    {wsConnected ? 'Disconnect WebSocket' : 'Connect WebSocket'}
                  </button>
                </div>
              </div>
            </details>
          </div>

          {/* Filters */}
          <div className="mt-6 flex flex-wrap gap-2 p-6 border-b border-gray-200">
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
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="mt-3 flex gap-2">
                        {!isNotificationRead(notification) && (
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
