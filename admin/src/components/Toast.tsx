import React, { useEffect } from 'react';
import {
  CheckCircle2,
  AlertCircle,
  Info,
  AlertTriangle,
  X,
} from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
  timestamp?: number;
  durationMs?: number;
}

export interface ToastProps {
  toast: ToastItem;
  onDismiss: (id: string) => void;
}

export const Toast: React.FC<ToastProps> = ({ toast, onDismiss }) => {
  const { id, type, message, durationMs = 4500 } = toast;

  useEffect(() => {
    if (durationMs <= 0) return;
    const timer = setTimeout(() => {
      onDismiss(id);
    }, durationMs);

    return () => clearTimeout(timer);
  }, [id, durationMs, onDismiss]);

  // Color theme mapping
  const styles: Record<ToastType, { container: string; iconColor: string; Icon: React.ElementType }> = {
    success: {
      container: 'bg-emerald-950 text-emerald-50 border-emerald-700/80 shadow-emerald-950/40',
      iconColor: 'text-emerald-400',
      Icon: CheckCircle2,
    },
    error: {
      container: 'bg-rose-950 text-rose-50 border-rose-700/80 shadow-rose-950/40',
      iconColor: 'text-rose-400',
      Icon: AlertCircle,
    },
    info: {
      container: 'bg-sky-950 text-sky-50 border-sky-700/80 shadow-sky-950/40',
      iconColor: 'text-sky-400',
      Icon: Info,
    },
    warning: {
      container: 'bg-amber-950 text-amber-50 border-amber-700/80 shadow-amber-950/40',
      iconColor: 'text-amber-400',
      Icon: AlertTriangle,
    },
  };

  const currentStyle = styles[type] || styles.info;
  const IconComponent = currentStyle.Icon;

  return (
    <div
      role="alert"
      className={`pointer-events-auto w-full max-w-sm rounded-xl p-3.5 shadow-xl border flex items-start justify-between gap-3 text-xs font-medium backdrop-blur-xs transition-all duration-300 transform translate-y-0 opacity-100 ${currentStyle.container}`}
    >
      <div className="flex items-start gap-2.5 min-w-0">
        <IconComponent size={18} className={`${currentStyle.iconColor} shrink-0 mt-0.5`} />
        <span className="leading-snug break-words whitespace-pre-line">{message}</span>
      </div>
      <button
        type="button"
        aria-label="Close notification"
        onClick={() => onDismiss(id)}
        className="text-white/60 hover:text-white shrink-0 p-1 rounded-md hover:bg-white/10 transition-colors"
      >
        <X size={14} />
      </button>
    </div>
  );
};

export default Toast;
