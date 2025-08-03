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
    iconClass: 'text-green-300',
    borderClass: 'border-green-500/60',
  },
  error: {
    Icon: ToastErrorIcon,
    iconClass: 'text-red-300',
    borderClass: 'border-red-500/60',
  },
  info: {
    Icon: ToastInfoIcon,
    iconClass: 'text-cyan-300',
    borderClass: 'border-cyan-500/60',
  },
};

export const ToastComponent: React.FC<ToastProps> = ({ toast, onDismiss }) => {
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
      className={`w-full max-w-sm p-4 rounded-lg shadow-2xl shadow-black/50 bg-[#101827]/80 backdrop-blur-md border ${borderClass} flex items-start space-x-4 animate-toast-in transition-opacity duration-500 ${isFadingOut ? 'opacity-0' : 'opacity-100'}`}
      role="alert"
    >
      <div className="flex-shrink-0">
        <Icon className={`w-6 h-6 ${iconClass}`} />
      </div>
      <div className="flex-grow text-sm text-[#e0ffff]">{toast.message}</div>
      <div className="flex-shrink-0">
        <button
          onClick={handleDismiss}
          className="p-1 -m-1 rounded-full text-gray-400 hover:text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
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
