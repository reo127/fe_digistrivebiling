'use client';

import { useEffect, useState } from 'react';
import { HiCheckCircle, HiXCircle, HiInformationCircle, HiExclamationCircle, HiX } from 'react-icons/hi';

const Toast = ({ toast, onRemove }) => {
  const [progress, setProgress] = useState(100);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (toast.duration <= 0) return;

    const interval = 50; // Update every 50ms
    const decrement = (interval / toast.duration) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        const newProgress = prev - decrement;
        if (newProgress <= 0) {
          clearInterval(timer);
          return 0;
        }
        return newProgress;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [toast.duration]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      onRemove(toast.id);
    }, 300);
  };

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return <HiCheckCircle className="w-6 h-6 text-green-500" />;
      case 'error':
        return <HiXCircle className="w-6 h-6 text-red-500" />;
      case 'warning':
        return <HiExclamationCircle className="w-6 h-6 text-yellow-500" />;
      case 'info':
      default:
        return <HiInformationCircle className="w-6 h-6 text-blue-500" />;
    }
  };

  const getStyles = () => {
    switch (toast.type) {
      case 'success':
        return 'bg-white border-l-4 border-green-500 shadow-lg';
      case 'error':
        return 'bg-white border-l-4 border-red-500 shadow-lg';
      case 'warning':
        return 'bg-white border-l-4 border-yellow-500 shadow-lg';
      case 'info':
      default:
        return 'bg-white border-l-4 border-blue-500 shadow-lg';
    }
  };

  const getProgressBarColor = () => {
    switch (toast.type) {
      case 'success':
        return 'bg-green-500';
      case 'error':
        return 'bg-red-500';
      case 'warning':
        return 'bg-yellow-500';
      case 'info':
      default:
        return 'bg-blue-500';
    }
  };

  return (
    <div
      className={`
        ${getStyles()}
        rounded-lg p-4 mb-3 min-w-[320px] max-w-md
        transform transition-all duration-300 ease-in-out
        ${isExiting ? 'translate-x-full opacity-0' : 'translate-x-0 opacity-100'}
        hover:shadow-xl
      `}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          {getIcon()}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 break-words">
            {toast.message}
          </p>
        </div>

        <button
          onClick={handleClose}
          className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Close notification"
        >
          <HiX className="w-5 h-5" />
        </button>
      </div>

      {/* Progress bar */}
      {toast.duration > 0 && (
        <div className="mt-2 h-1 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full ${getProgressBarColor()} transition-all duration-50 ease-linear`}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
};

export default Toast;
