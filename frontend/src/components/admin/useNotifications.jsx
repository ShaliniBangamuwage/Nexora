import { useState, useEffect } from 'react';

// API_BASE owns the /api prefix — individual paths must NOT repeat it.
const RAW_API_URL =
  (import.meta.env.VITE_API_URL_RAILWAY && import.meta.env.VITE_API_URL_RAILWAY !== 'undefined' ? import.meta.env.VITE_API_URL_RAILWAY : 'http://localhost:5000');

const API_BASE = `${RAW_API_URL.replace(/\/$/, '')}/api`;

const apiFetch = async (url, options = {}) => {
  const res = await fetch(`${API_BASE}${url}`, options);

  const data = res.headers
    .get('content-type')
    ?.includes('application/json')
    ? await res.json()
    : null;

  if (!res.ok) {
    throw new Error(data?.message || 'Request failed');
  }

  return data;
};


export const useNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null); // last fetch error, if any


  // Fetch admin notifications
  const refresh = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await apiFetch(
        '/notifications?recipientType=admin'
      );

      setNotifications(data || []);

    } catch (err) {
      console.error('Failed to load notifications:', err);
      setError(err.message);

    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    refresh();
  }, []);



  // Mark single notification as read
  const markAsRead = async (id) => {
    try {
      await apiFetch(`/notifications/${id}/read`, {
        method: 'PATCH',
      });

      await refresh();

    } catch (err) {
      console.error('Failed to mark as read:', err);
      throw err; // let the calling component decide how to surface this
    }
  };



  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      await apiFetch('/notifications/read-all', {
        method: 'PATCH',
      });

      await refresh();

    } catch (err) {
      console.error('Failed to mark all as read:', err);
      throw err;
    }
  };



  // Delete notification
  const deleteById = async (id) => {
    try {
      await apiFetch(`/notifications/${id}`, {
        method: 'DELETE',
      });

      await refresh();

    } catch (err) {
      console.error('Failed to delete notification:', err);
      throw err;
    }
  };



  // Mark order received
  const markReceived = async (id) => {
    try {
      await apiFetch(`/notifications/${id}/mark-received`, {
        method: 'PATCH',
      });

      await refresh();

    } catch (err) {
      console.error('Failed to mark order as received:', err);
      throw err;
    }
  };



  return {
    notifications,
    loading,
    error,

    refresh,

    markAsRead,
    markAllAsRead,
    deleteById,
    markReceived,
  };
};