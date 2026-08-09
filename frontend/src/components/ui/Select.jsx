import { forwardRef } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn, slugify } from '../../utils/cn';
import Field from './Field';
import { inputClasses } from './Input';

const Select = forwardRef(function Select(
  { label, required, error, hint, className, id, name, children, placeholder, ...props },
  ref
) {
  const resolvedName = name || (label ? slugify(label) : undefined);
  const inputId = id || resolvedName;
  return (
    <Field label={label} required={required} error={error} hint={hint} htmlFor={inputId}>
      <div className="relative">
        <select
          ref={ref}
          id={inputId}
          name={resolvedName}
          className={cn(inputClasses(error), 'appearance-none pr-9', className)}
          defaultValue={props.value === undefined ? '' : undefined}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {children}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
      </div>
    </Field>
  );
});

export default Select;
