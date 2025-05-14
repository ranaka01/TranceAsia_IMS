import React, { useState } from 'react';
import { MdCircle, MdCheck, MdDelete } from 'react-icons/md';
import { useNavigate } from 'react-router-dom';

const NotificationPanel = () => {
  const navigate = useNavigate();
  
  // Sample notifications - in a real application, these would be fetched from an API
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: 'New Order',
      message: 'New order #1234 has been placed',
      time: '10 minutes ago',
      read: false,
      type: 'order'
    },
    {
      id: 2,
      title: 'Low Stock Alert',
      message: 'Product "Logitech Mouse" is running low on stock',
      time: '1 hour ago',
      read: false,
      type: 'inventory'
    },
    {
      id: 3,
      title: 'Repair Completed',
      message: 'Repair #5678 has been completed',
      time: '3 hours ago',
      read: true,
      type: 'repair'
    },
    {
      id: 4,
      title: 'New Customer Registration',
      message: 'A new customer has registered: John Doe',
      time: '5 hours ago',
      read: true,
      type: 'customer'
    },
    {
      id: 5,
      title: 'Payment Received',
      message: 'Payment of LKR 15,000 received for order #1230',
      time: '1 day ago',
      read: true,
      type: 'payment'
    }
  ]);

  const markAsRead = (id) => {
    setNotifications(notifications.map(notification => 
      notification.id === id ? { ...notification, read: true } : notification
    ));
  };

  const deleteNotification = (id) => {
    setNotifications(notifications.filter(notification => notification.id !== id));
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(notification => ({ ...notification, read: true })));
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
        <button 
          onClick={markAllAsRead}
          className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
        >
          Mark all as read
        </button>
      </div>

      {/* Notification list */}
      <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
        {notifications.length > 0 ? (
          notifications.map((notification) => (
            <div 
              key={notification.id} 
              className={`p-4 flex ${notification.read ? 'bg-white' : 'bg-blue-50'} hover:bg-gray-50 transition-colors`}
            >
              {/* Status indicator */}
              <div className="mr-3 mt-0.5">
                {!notification.read && (
                  <MdCircle className="text-blue-500" size={8} />
                )}
              </div>
              
              {/* Content */}
              <div className="flex-1 pr-6">
                <div className="flex items-start justify-between mb-1">
                  <h3 className={`font-medium ${notification.read ? 'text-gray-700' : 'text-gray-900'}`}>
                    {notification.title}
                  </h3>
                  <span className="text-xs text-gray-500 ml-2 whitespace-nowrap">
                    {notification.time}
                  </span>
                </div>
                <p className={`text-sm ${notification.read ? 'text-gray-500' : 'text-gray-700'}`}>
                  {notification.message}
                </p>
                
                {/* Type tag */}
                <span className={`inline-block mt-1 px-2 py-0.5 text-xs rounded-full ${getNotificationTypeStyles(notification.type)}`}>
                  {notification.type.charAt(0).toUpperCase() + notification.type.slice(1)}
                </span>
              </div>
              
              {/* Actions */}
              <div className="flex flex-col space-y-2">
                {!notification.read && (
                  <button 
                    onClick={() => markAsRead(notification.id)}
                    className="p-1 text-gray-400 hover:text-green-500 rounded-full hover:bg-gray-100"
                    title="Mark as read"
                  >
                    <MdCheck size={16} />
                  </button>
                )}
                <button 
                  onClick={() => deleteNotification(notification.id)}
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