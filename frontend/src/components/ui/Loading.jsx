import { Loader2 } from 'lucide-react';
import { cn } from '../../utils/cn';

export function Spinner({ className }) {
  return <Loader2 className={cn('h-4 w-4 animate-spin', className)} />;
}

export function PageLoader({ label = 'Loading…' }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-24 text-slate-400 dark:text-slate-500">
      <Loader2 className="h-6 w-6 animate-spin text-primary-500" />
      <p className="text-sm">{label}</p>
    </div>
  );
}

export function TableSkeleton({ rows = 5, cols = 5 }) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-card dark:border-slate-800 dark:bg-slate-900">
      <div className="divide-y divide-slate-100 dark:divide-slate-800">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="flex items-center gap-6 px-4 py-4">
            {Array.from({ length: cols }).map((_, c) => (
              <div
                key={c}
                className="h-3.5 flex-1 animate-pulse rounded bg-slate-100 dark:bg-slate-800"
                style={{ animationDelay: `${(r * cols + c) * 30}ms` }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function CardSkeleton({ className }) {
  return <div className={cn('animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800', className)} />;
}
