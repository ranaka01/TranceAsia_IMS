import React, { useState, useEffect } from 'react';
import { MdCircle, MdCheck, MdDelete, MdRefresh } from 'react-icons/md';
import { useNavigate } from 'react-router-dom';
import {
  getNotifications,
  markAsRead as markNotificationAsRead,
  markAllAsRead as markAllNotificationsAsRead,
  deleteNotification as deleteNotificationApi,
  formatNotificationTime
} from '../../services/notificationService';
import { toast } from 'react-toastify';

const NotificationPanel = () => {
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch notifications when component mounts
  useEffect(() => {
    fetchNotifications();
  }, []);

  // Function to fetch notifications
  const fetchNotifications = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getNotifications({ limit: 10 });
      setNotifications(data);
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
      const response = await markNotificationAsRead(id);

      if (response.status === 'error') {
        toast.error(response.message || 'Failed to mark notification as read');
        return;
      }

      setNotifications(notifications.map(notification =>
        notification.id === id ? { ...notification, is_read: true } : notification
      ));
    } catch (err) {
      console.error('Error marking notification as read:', err);
      toast.error('Failed to mark notification as read');
    }
  };

  // Handle deleting a notification
  const handleDeleteNotification = async (id) => {
    try {
      const response = await deleteNotificationApi(id);

      if (response.status === 'error') {
        toast.error(response.message || 'Failed to delete notification');
        return;
      }

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
      const response = await markAllNotificationsAsRead();

      if (response.status === 'error') {
        toast.error(response.message || 'Failed to mark all notifications as read');
        return;
      }

      setNotifications(notifications.map(notification => ({ ...notification, is_read: true })));
      toast.success('All notifications marked as read');
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
      toast.error('Failed to mark all notifications as read');
    }
  };

  // Navigate to the Notifications page
  const handleViewAllNotifications = () => {
    navigate('/admin/notifications');
  };

  // Get notification type icon/color
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
    <div className="bg-white divide-y divide-gray-100">
      {/* Header actions */}
      <div className="flex justify-between items-center p-3 border-b border-gray-200">
        <span className="font-semibold">Notifications</span>
        <div className="flex space-x-2">
          <button
            onClick={fetchNotifications}
            className="text-gray-500 hover:text-gray-700"
            title="Refresh notifications"
          >
            <MdRefresh size={18} />
          </button>
          <button
            onClick={handleMarkAllAsRead}
            className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
          >
            Mark all as read
          </button>
        </div>
      </div>

      {/* Notification list */}
      <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="text-red-500 text-center py-4">
            {error}
            <button
              onClick={fetchNotifications}
              className="block mx-auto mt-2 text-blue-500 hover:text-blue-700"
            >
              Try again
            </button>
          </div>
        ) : notifications.length > 0 ? (
          notifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-4 flex ${notification.is_read ? 'bg-white' : 'bg-blue-50'} hover:bg-gray-50 transition-colors`}
            >
              {/* Status indicator */}
              <div className="mr-3 mt-0.5">
                {!notification.is_read && (
                  <MdCircle className="text-blue-500" size={8} />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 pr-6">
                <div className="flex items-start justify-between mb-1">
                  <h3 className={`font-medium ${notification.is_read ? 'text-gray-700' : 'text-gray-900'}`}>
                    {notification.title}
                  </h3>
                  <span className="text-xs text-gray-500 ml-2 whitespace-nowrap">
                    {formatNotificationTime(notification.created_at)}
                  </span>
                </div>
                <p className={`text-sm ${notification.is_read ? 'text-gray-500' : 'text-gray-700'}`}>
                  {notification.message}
                </p>

                {/* Type tag */}
                <span className={`inline-block mt-1 px-2 py-0.5 text-xs rounded-full ${getNotificationTypeStyles(notification.type)}`}>
                  {notification.type.charAt(0).toUpperCase() + notification.type.slice(1)}
                </span>

                {/* Additional data if available */}
                {notification.data && notification.type === 'repair' && (
                  <div className="mt-2 p-2 bg-gray-50 rounded text-xs text-gray-600">
                    <p><strong>Repair ID:</strong> {notification.data.repairId}</p>
                    <p><strong>Device:</strong> {notification.data.deviceType} {notification.data.deviceModel}</p>
                    <p><strong>Status:</strong> {notification.data.previousStatus} → {notification.data.newStatus}</p>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex flex-col space-y-2">
                {!notification.is_read && (
                  <button
                    onClick={() => handleMarkAsRead(notification.id)}
                    className="p-1 text-gray-400 hover:text-green-500 rounded-full hover:bg-gray-100"
                    title="Mark as read"
                  >
                    <MdCheck size={16} />
                  </button>
                )}
                <button
                  onClick={() => handleDeleteNotification(notification.id)}
                  className="p-1 text-gray-400 hover:text-red-500 rounded-full hover:bg-gray-100"
                  title="Delete notification"
                >
                  <MdDelete size={16} />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="p-6 text-center text-gray-500">
            No notifications
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 bg-gray-50 border-t border-gray-200 text-center">
        <button
          onClick={handleViewAllNotifications}
          className="text-indigo-600 text-sm font-medium hover:text-indigo-800"
        >
          View all notifications
        </button>
      </div>
    </div>
  );
};

export default NotificationPanel;