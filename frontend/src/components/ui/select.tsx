import * as React from 'react';
import { cn } from '../../utils/cn';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options: { value: string; label: string }[];
  placeholder?: string;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, options, placeholder, ...props }, ref) => {
    return (
      <select
        ref={ref}
        className={cn(
          'flex h-10 w-full rounded-lg border border-[hsl(var(--input))] bg-[hsl(var(--background))] text-[hsl(var(--foreground))] px-3 py-2 text-sm ring-offset-[hsl(var(--background))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
          className,
        )}
        {...props}
      >
        {placeholder && <option value="" className="bg-[hsl(var(--background))] text-[hsl(var(--muted-foreground))]">{placeholder}</option>}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">{opt.label}</option>
        ))}
      </select>
    );
  },
);
Select.displayName = 'Select';

export { Select };
