import React, { useEffect, useState } from 'react';
import { Toast } from '../types';
import { ToastErrorIcon, ToastInfoIcon, ToastSuccessIcon } from './Icons';

interface ToastProps {
  toast: Toast;
  onDismiss: (id: number) => void;
}

const toastConfig = {
  success: {
    Icon: ToastSuccessIcon,
    iconClass: 'text-green-400',
    borderClass: 'border-green-500',
  },
  error: {
    Icon: ToastErrorIcon,
    iconClass: 'text-[var(--red-color)]',
    borderClass: 'border-[var(--red-color)]',
  },
  info: {
    Icon: ToastInfoIcon,
    iconClass: 'text-[var(--hud-color)]',
    borderClass: 'border-[var(--hud-color)]',
  },
};

export const ToastComponent = ({ toast, onDismiss }: ToastProps) => {
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsFadingOut(true);
      const dismissTimer = setTimeout(() => {
        onDismiss(toast.id);
      }, 500); // Wait for fade-out animation
      return () => clearTimeout(dismissTimer);
    }, 3000); // 3 seconds visible

    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  const handleDismiss = () => {
    setIsFadingOut(true);
    setTimeout(() => onDismiss(toast.id), 500);
  };
  
  const { Icon, iconClass, borderClass } = toastConfig[toast.type];

  return (
    <div
      className={`w-full max-w-sm p-4 bg-black/90 backdrop-blur-sm border-l-4 ${borderClass} flex items-start space-x-4 transition-all duration-500 ${isFadingOut ? 'opacity-0 translate-x-full' : 'opacity-100 translate-x-0'}`}
      role="alert"
    >
      <div className="flex-shrink-0">
        <Icon className={`w-6 h-6 ${iconClass}`} />
      </div>
      <div className="flex-grow text-sm text-[var(--hud-color)] uppercase tracking-wider">{toast.message}</div>
      <div className="flex-shrink-0">
        <button
          onClick={handleDismiss}
          className="p-1 -m-1 rounded-full text-gray-400 hover:text-white hover:bg-white/10 focus:outline-none focus:ring-1 focus:ring-inset focus:ring-white"
          aria-label="Dismiss"
        >
          <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
};