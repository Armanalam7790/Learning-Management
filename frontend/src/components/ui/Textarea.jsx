import { forwardRef } from 'react';
import { cn, slugify } from '../../utils/cn';
import Field from './Field';
import { inputClasses } from './Input';

const Textarea = forwardRef(function Textarea(
  { label, required, error, hint, className, id, name, rows = 4, ...props },
  ref
) {
  const resolvedName = name || (label ? slugify(label) : undefined);
  const inputId = id || resolvedName;
  return (
    <Field label={label} required={required} error={error} hint={hint} htmlFor={inputId}>
      <textarea
        ref={ref}
        id={inputId}
        name={resolvedName}
        rows={rows}
        className={cn(inputClasses(error), 'h-auto py-2 resize-none', className)}
        {...props}
      />
    </Field>
  );
});

export default Textarea;
