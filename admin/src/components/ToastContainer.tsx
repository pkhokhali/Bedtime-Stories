import React from 'react';
import { Toast, type ToastItem } from './Toast';

export interface ToastContainerProps {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
  position?: 'bottom-right' | 'top-right' | 'bottom-left' | 'top-left' | 'top-center' | 'bottom-center';
}

export const ToastContainer: React.FC<ToastContainerProps> = ({
  toasts,
  onDismiss,
  position = 'bottom-right',
}) => {
  if (!toasts || toasts.length === 0) return null;

  const positionClasses: Record<string, string> = {
    'bottom-right': 'bottom-5 right-5 flex-col',
    'top-right': 'top-5 right-5 flex-col-reverse',
    'bottom-left': 'bottom-5 left-5 flex-col',
    'top-left': 'top-5 left-5 flex-col-reverse',
    'bottom-center': 'bottom-5 left-1/2 -translate-x-1/2 flex-col items-center',
    'top-center': 'top-5 left-1/2 -translate-x-1/2 flex-col-reverse items-center',
  };

  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className={`fixed z-50 flex gap-2.5 max-w-sm w-full px-4 sm:px-0 pointer-events-none ${
        positionClasses[position] || positionClasses['bottom-right']
      }`}
    >
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
};

export default ToastContainer;
