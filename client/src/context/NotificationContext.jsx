import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from './AuthContext';
import { INITIAL_NOTIFICATIONS } from '../data/mockData';

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
  const [unreadCount, setUnreadCount] = useState(() => INITIAL_NOTIFICATIONS.filter(n => !n.is_read).length);
  const [toastMessage, setToastMessage] = useState(null);

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const data = await api.getNotifications();
      if (data && data.notifications && data.notifications.length > 0) {
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (err) {
      // Graceful fallback to mock notifications
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, [user]);

  const showToast = (message, title = 'Notice') => {
    setToastMessage({ message, title });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const markAllRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    setUnreadCount(0);
    try {
      await api.markNotificationRead('all');
    } catch (err) {
      // Mock mode handled
    }
  };

  const markOneRead = (id) => {
    setNotifications(prev => prev.map(n => n.notification_id === id ? { ...n, is_read: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      fetchNotifications,
      showToast,
      markAllRead,
      markOneRead
    }}>
      {children}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          backgroundColor: '#111111',
          color: '#FFFFFF',
          border: '1px solid #333333',
          padding: '16px 22px',
          borderRadius: '2px',
          zIndex: 9999,
          maxWidth: '380px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          fontFamily: 'var(--font-main)',
          fontSize: '0.85rem'
        }}>
          <div style={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.1em', marginBottom: '4px', color: '#BEBEBA' }}>
            {toastMessage.title}
          </div>
          <div>{toastMessage.message}</div>
        </div>
      )}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
