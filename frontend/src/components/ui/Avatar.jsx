import { cn } from '../../utils/cn';
import { initials } from '../../utils/formatters';

const PALETTE = [
  'bg-primary-100 text-primary-700',
  'bg-emerald-100 text-emerald-700',
  'bg-amber-100 text-amber-700',
  'bg-sky-100 text-sky-700',
  'bg-rose-100 text-rose-700',
  'bg-violet-100 text-violet-700',
];

function paletteIndex(seed) {
  if (!seed) return 0;
  let sum = 0;
  for (let i = 0; i < seed.length; i += 1) sum += seed.charCodeAt(i);
  return sum % PALETTE.length;
}

const SIZES = {
  sm: 'h-7 w-7 text-[11px]',
  md: 'h-9 w-9 text-xs',
  lg: 'h-11 w-11 text-sm',
};

export default function Avatar({ name, src, size = 'md', className }) {
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={cn('rounded-full object-cover', SIZES[size], className)}
      />
    );
  }
  return (
    <span
      className={cn(
        'flex items-center justify-center rounded-full font-semibold',
        PALETTE[paletteIndex(name)],
        SIZES[size],
        className
      )}
    >
      {initials(name)}
    </span>
  );
}
