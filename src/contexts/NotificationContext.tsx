import React from "react";
import { createContext, useState, useCallback, ReactNode } from "react";
import { Notification } from "@/types";

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  addNotification: (notification: Omit<Notification, "id" | "createdAt">) => void;
  markAsRead: (userId: string, notificationId: string) => void;
  markAllAsRead: (userId: string) => void;
  getNotifications: (userId: string) => Notification[];
}

export const NotificationContext = createContext<NotificationContextType>({
  notifications: [],
  unreadCount: 0,
  loading: false,
  addNotification: () => {},
  markAsRead: () => {},
  markAllAsRead: () => {},
  getNotifications: () => []
});

export { NotificationContext as NotificationContextNamed };

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider = ({ children }: NotificationProviderProps) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  
  const unreadCount = useCallback(() => {
    return notifications.filter(n => !n.read).length;
  }, [notifications]);
  
  const addNotification = useCallback((notification: Omit<Notification, "id" | "createdAt">) => {
    setLoading(true);
    
    // Create a new notification with a string ID
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(), // Use timestamp as string ID
      createdAt: new Date(),
      read: false
    };
    
    setNotifications(prev => [...prev, newNotification]);
    setLoading(false);
  }, []);
  
  const markAsRead = useCallback((userId: string, notificationId: string) => {
    setLoading(true);
    
    setNotifications(prev => prev.map(notification => {
      if (notification.id === notificationId && notification.userId === userId) {
        return { ...notification, read: true };
      }
      return notification;
    }));
    
    setLoading(false);
  }, []);
  
  const markAllAsRead = useCallback((userId: string) => {
    setLoading(true);
    
    setNotifications(prev => prev.map(notification => {
      if (notification.userId === userId) {
        return { ...notification, read: true };
      }
      return notification;
    }));
    
    setLoading(false);
  }, []);
  
  const getNotifications = useCallback((userId: string): Notification[] => {
    return notifications.filter(notification => notification.userId === userId);
  }, [notifications]);
  
  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount: unreadCount(),
        loading,
        addNotification,
        markAsRead,
        markAllAsRead,
        getNotifications
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};