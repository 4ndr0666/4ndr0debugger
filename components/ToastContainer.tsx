import React from 'react';
import { Toast } from '../types';
import { ToastComponent } from './Toast';

interface ToastContainerProps {
  toasts: Toast[];
  onDismiss: (id: number) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
  return (
    <div
      className="fixed bottom-0 right-0 z-50 p-4 space-y-3 w-full max-w-md"
      aria-live="assertive"
    >
      {toasts.map(toast => (
        <ToastComponent key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
};
