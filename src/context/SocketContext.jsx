import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { useAuth } from './AuthContext';
import api from '../api/client';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [connected, setConnected] = useState(false);
  const clientRef = useRef(null);

  // Fetch initial notifications
  useEffect(() => {
    if (user?.id) {
      api.get('/notifications')
        .then((res) => setNotifications(res.data))
        .catch((err) => console.warn('Could not load notifications', err));
    } else {
      setNotifications([]);
    }
  }, [user?.id]);

  // Connect STOMP WebSocket
  useEffect(() => {
    if (!user?.id) {
      if (clientRef.current) {
        clientRef.current.deactivate();
      }
      return;
    }

    const token = localStorage.getItem('accessToken');
    const client = new Client({
      webSocketFactory: () => new SockJS(import.meta.env.VITE_WS_URL || '/ws'),
      connectHeaders: {
        Authorization: token ? `Bearer ${token}` : '',
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onConnect: () => {
        setConnected(true);

        // Subscribe to user alerts
        client.subscribe(`/user/queue/notifications`, (message) => {
          try {
            const notif = JSON.parse(message.body);
            setNotifications((prev) => [notif, ...prev]);
          } catch (e) {
            console.error('Error parsing notification:', e);
          }
        });

        client.subscribe(`/topic/user/${user.id}/notifications`, (message) => {
          try {
            const notif = JSON.parse(message.body);
            setNotifications((prev) => [notif, ...prev]);
          } catch (e) {
            console.error('Error parsing notification:', e);
          }
        });
      },
      onDisconnect: () => {
        setConnected(false);
      },
      onStompError: (frame) => {
        console.warn('STOMP Broker error: ', frame.headers['message']);
      },
    });

    client.activate();
    clientRef.current = client;

    return () => {
      client.deactivate();
    };
  }, [user?.id]);

  const markAsRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    } catch (e) {
      console.warn('Failed to mark read', e);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (e) {
      console.warn('Failed to mark all read', e);
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <SocketContext.Provider
      value={{
        stompClient: clientRef.current,
        connected,
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
