import { createPortal } from 'react-dom';
import { CheckCircle2, XCircle, Info, X } from 'lucide-react';
import { useToast, useToastList } from '../../context/ToastContext';
import { cn } from '../../utils/cn';

const ICONS = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
};

const ICON_TONES = {
  success: 'text-emerald-500',
  error: 'text-red-500',
  info: 'text-sky-500',
};

export default function Toaster() {
  const toasts = useToastList();
  const toast = useToast();

  return createPortal(
    <div className="pointer-events-none fixed top-4 right-4 z-[100] flex w-full max-w-sm flex-col gap-2">
      {toasts.map((t) => {
        const Icon = ICONS[t.type] || Info;
        return (
          <div
            key={t.id}
            className="pointer-events-auto flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-3.5 shadow-pop animate-toast-in dark:border-slate-700 dark:bg-slate-800"
          >
            <Icon className={cn('mt-0.5 h-5 w-5 shrink-0', ICON_TONES[t.type])} />
            <p className="flex-1 text-sm text-slate-700 dark:text-slate-200">{t.message}</p>
            <button
              onClick={() => toast.dismiss(t.id)}
              className="text-slate-300 transition-colors hover:text-slate-500 dark:text-slate-600 dark:hover:text-slate-400"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>,
    document.body
  );
}
