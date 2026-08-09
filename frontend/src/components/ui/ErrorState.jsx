import { AlertCircle, RotateCw } from 'lucide-react';
import Button from './Button';

export default function ErrorState({ message = 'Something went wrong while loading this data.', onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-red-100 bg-red-50/50 px-6 py-14 text-center dark:border-red-500/20 dark:bg-red-500/5">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-500 dark:bg-red-500/10 dark:text-red-400">
        <AlertCircle className="h-5.5 w-5.5" />
      </span>
      <h3 className="mt-4 text-sm font-semibold text-slate-800 dark:text-slate-100">Couldn't load this page</h3>
      <p className="mt-1 max-w-sm text-sm text-slate-500 dark:text-slate-400">{message}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" className="mt-5" onClick={onRetry}>
          <RotateCw className="h-3.5 w-3.5" />
          Try again
        </Button>
      )}
    </div>
  );
}
