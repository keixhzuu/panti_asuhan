import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { useLocation } from 'react-router-dom';

const ToastContext = createContext(null);
const PENDING_TOAST_KEY = 'donasi_pending_toast';

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const location = useLocation();

  const addToast = useCallback(({ title = '', message = '', tone = 'success', duration = 5000 }) => {
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
    setToasts((t) => [{ id, title, message, tone }, ...t]);
    if (duration > 0) {
      setTimeout(() => {
        setToasts((t) => t.filter((x) => x.id !== id));
      }, duration);
    }
    return id;
  }, []);

  const queueToast = useCallback((toast) => {
    sessionStorage.setItem(PENDING_TOAST_KEY, JSON.stringify({ ...toast, createdAt: Date.now() }));
  }, []);

  useEffect(() => {
    const raw = sessionStorage.getItem(PENDING_TOAST_KEY);
    if (!raw) return;

    let pendingToast;
    try {
      pendingToast = JSON.parse(raw);
    } catch {
      sessionStorage.removeItem(PENDING_TOAST_KEY);
      return;
    }

    if (!pendingToast) return;

    sessionStorage.removeItem(PENDING_TOAST_KEY);
    const timeoutId = setTimeout(() => {
      addToast({
        title: pendingToast.title,
        message: pendingToast.message,
        tone: pendingToast.tone || 'success',
        duration: pendingToast.duration ?? 3000,
      });
    }, 150);

    return () => clearTimeout(timeoutId);
  }, [addToast, location.pathname]);

  const removeToast = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  const value = useMemo(() => ({ addToast, queueToast, removeToast }), [addToast, queueToast, removeToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed top-5 right-5 z-50 flex flex-col gap-3 items-end">
        {toasts.map((t) => (
          <div key={t.id} className={`max-w-sm w-full px-4 py-3 rounded-2xl shadow-lg border ${t.tone === 'success' ? 'bg-emerald-50 border-emerald-200' : t.tone === 'danger' ? 'bg-rose-50 border-rose-200' : 'bg-white border-slate-100'}`}>
            <div className="flex items-start gap-3">
              <div className="flex-1">
                {t.title && <div className="font-semibold text-sm text-slate-800">{t.title}</div>}
                {t.message && <div className="text-xs text-slate-600 mt-1">{t.message}</div>}
              </div>
              <button onClick={() => removeToast(t.id)} className="text-slate-400 hover:text-slate-600 text-sm">✕</button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

export default ToastProvider;
