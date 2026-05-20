import React from 'react';
import { Toast } from '../types.ts';
import { ToastComponent } from './Toast.tsx';

interface ToastContainerProps {
  toasts: Toast[];
  onDismiss: (id: number) => void;
}

export const ToastContainer = ({ toasts, onDismiss }: ToastContainerProps) => {
  // Only show the last 3 toasts to prevent screen clutter during bulk operations
  const visibleToasts = toasts.slice(-3);

  return (
    <div
      className="fixed bottom-0 right-0 z-50 p-4 space-y-3 w-full max-w-md"
      aria-live="assertive"
    >
      {visibleToasts.map(toast => (
        <ToastComponent key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
};