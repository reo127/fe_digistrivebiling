'use client';

import { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext();

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 3000) => {
    const id = Date.now() + Math.random();
    const toast = { id, message, type, duration };

    setToasts((prev) => [...prev, toast]);

    // Auto-dismiss
    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const success = useCallback((message, duration = 3000) => {
    addToast(message, 'success', duration);
  }, [addToast]);

  const error = useCallback((message, duration = 5000) => {
    addToast(message, 'error', duration);
  }, [addToast]);

  const info = useCallback((message, duration = 3000) => {
    addToast(message, 'info', duration);
  }, [addToast]);

  const warning = useCallback((message, duration = 4000) => {
    addToast(message, 'warning', duration);
  }, [addToast]);

  return (
    <ToastContext.Provider value={{ success, error, info, warning, toasts, removeToast }}>
      {children}
    </ToastContext.Provider>
  );
};
