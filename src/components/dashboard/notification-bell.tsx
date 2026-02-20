'use client';

import { useState, useEffect } from 'react';
import { Bell, X, Check, Calendar, RefreshCw, XCircle, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { nl } from 'date-fns/locale';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  created_at: string;
  read: boolean;
  booking_id?: string;
  customer_name?: string;
}

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications?limit=10');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Poll every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const markAllRead = async () => {
    setLoading(true);
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAllRead: true }),
      });
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark as read:', error);
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'new_booking':
        return <Calendar className="w-4 h-4 text-green-500" />;
      case 'booking_changed':
        return <RefreshCw className="w-4 h-4 text-blue-500" />;
      case 'booking_cancelled':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'no_show':
        return <Clock className="w-4 h-4 text-orange-500" />;
      default:
        return <Bell className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div className="relative">
      {/* Bell button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <Bell className={`w-5 h-5 ${unreadCount > 0 ? 'animate-ring' : ''}`} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Panel */}
          <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-200 z-50 overflow-hidden">
            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Notificaties</h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    disabled={loading}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Alles gelezen
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              </div>
            </div>

            {/* Notifications list */}
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="py-8 text-center">
                  <Bell className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">Geen notificaties</p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors ${
                      !notification.read ? 'bg-blue-50/50' : ''
                    }`}
                  >
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 mt-0.5">
                        {getIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm ${!notification.read ? 'font-medium text-gray-900' : 'text-gray-700'}`}>
                          {notification.title}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5 truncate">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {formatDistanceToNow(new Date(notification.created_at), { 
                            addSuffix: true, 
                            locale: nl 
                          })}
                        </p>
                      </div>
                      {!notification.read && (
                        <div className="flex-shrink-0">
                          <div className="w-2 h-2 bg-blue-500 rounded-full" />
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}

      {/* Ring animation styles */}
      <style jsx global>{`
        @keyframes ring {
          0%, 100% { transform: rotate(0deg); }
          10%, 30% { transform: rotate(14deg); }
          20%, 40% { transform: rotate(-14deg); }
          50%, 70% { transform: rotate(6deg); }
          60%, 80% { transform: rotate(-6deg); }
          90% { transform: rotate(0deg); }
        }
        .animate-ring {
          animation: ring 1s ease-in-out;
          animation-iteration-count: 3;
        }
      `}</style>
    </div>
  );
}
