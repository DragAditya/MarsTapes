import { useEffect } from 'react';
import { useApp } from '@/store/AppContext';
import { CheckCircle, XCircle, Info, X } from 'lucide-react';

export function ToastContainer() {
  const { state } = useApp();

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
      {state.toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  );
}

function ToastItem({ toast }: { toast: { id: string; message: string; type: 'success' | 'error' | 'info' } }) {
  const { dispatch } = useApp();

  useEffect(() => {
    const timer = setTimeout(() => {
      dispatch({ type: 'REMOVE_TOAST', payload: toast.id });
    }, 3000);
    return () => clearTimeout(timer);
  }, [toast.id, dispatch]);

  const icons = {
    success: <CheckCircle className="w-4 h-4 text-emerald-500" />,
    error: <XCircle className="w-4 h-4 text-red-500" />,
    info: <Info className="w-4 h-4 text-blue-500" />,
  };

  const bgColors = {
    success: 'bg-emerald-50 border-emerald-200',
    error: 'bg-red-50 border-red-200',
    info: 'bg-blue-50 border-blue-200',
  };

  return (
    <div
      className={`pointer-events-auto flex items-center gap-2 px-4 py-3 rounded-lg border shadow-lg min-w-[280px] max-w-[400px] ${bgColors[toast.type]} animate-in slide-in-from-bottom-2 fade-in duration-300`}
    >
      {icons[toast.type]}
      <span className="text-sm text-gray-800 flex-1">{toast.message}</span>
      <button
        onClick={() => dispatch({ type: 'REMOVE_TOAST', payload: toast.id })}
        className="p-1 hover:bg-black/5 rounded-md transition-colors"
      >
        <X className="w-3 h-3 text-gray-500" />
      </button>
    </div>
  );
}
