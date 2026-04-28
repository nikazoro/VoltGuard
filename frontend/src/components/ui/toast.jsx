import { createContext, useContext, useState, useCallback } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

const ToastContext = createContext(null);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((toast) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { ...toast, id }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, toast.duration || 3000);

    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    ({ title, description, variant = 'default', duration = 3000 }) => {
      addToast({ title, description, variant, duration });
    },
    [addToast]
  );

  return (
    <ToastContext.Provider value={{ toast, addToast, removeToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-md">
        {toasts.map((t) => (
          <Toast key={t.id} {...t} onClose={() => removeToast(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

const Toast = ({ title, description, variant, onClose }) => {
  const icons = {
    default: Info,
    success: CheckCircle,
    error: AlertCircle,
    destructive: AlertCircle,
  };

  const Icon = icons[variant] || icons.default;

  return (
    <div
      className={cn(
        'pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-6 pr-8 shadow-lg transition-all',
        'animate-in slide-in-from-right-full',
        {
          'bg-background border-border': variant === 'default',
          'bg-green-50 border-green-200': variant === 'success',
          'bg-red-50 border-red-200': variant === 'error' || variant === 'destructive',
        }
      )}
    >
      <div className="flex gap-3 items-start">
        <Icon
          className={cn('h-5 w-5 mt-0.5', {
            'text-blue-600': variant === 'default',
            'text-green-600': variant === 'success',
            'text-red-600': variant === 'error' || variant === 'destructive',
          })}
        />
        <div className="grid gap-1">
          {title && <div className="text-sm font-semibold">{title}</div>}
          {description && (
            <div className="text-sm opacity-90">{description}</div>
          )}
        </div>
      </div>
      <button
        onClick={onClose}
        className="absolute right-2 top-2 rounded-md p-1 opacity-70 ring-offset-background transition-opacity hover:opacity-100"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};