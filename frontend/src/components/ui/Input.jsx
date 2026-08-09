import { forwardRef } from 'react';
import { cn, slugify } from '../../utils/cn';
import Field from './Field';

const baseInputClasses =
  'w-full rounded-lg border bg-white px-3 h-9.5 text-sm text-slate-800 placeholder:text-slate-400 ' +
  'transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 ' +
  'disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed ' +
  'dark:bg-slate-800 dark:text-slate-200 dark:placeholder:text-slate-500 dark:disabled:bg-slate-800/50 dark:disabled:text-slate-500';

export const inputClasses = (error) =>
  cn(
    baseInputClasses,
    error
      ? 'border-red-300 focus:ring-red-500/20 focus:border-red-400 dark:border-red-500/40'
      : 'border-slate-200 dark:border-slate-700'
  );

const Input = forwardRef(function Input(
  { label, required, error, hint, className, icon: Icon, id, name, ...props },
  ref
) {
  const resolvedName = name || (label ? slugify(label) : undefined);
  const inputId = id || resolvedName;
  return (
    <Field label={label} required={required} error={error} hint={hint} htmlFor={inputId}>
      <div className="relative">
        {Icon && <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />}
        <input
          ref={ref}
          id={inputId}
          name={resolvedName}
          className={cn(inputClasses(error), Icon && 'pl-9', className)}
          {...props}
        />
      </div>
    </Field>
  );
});

export default Input;
