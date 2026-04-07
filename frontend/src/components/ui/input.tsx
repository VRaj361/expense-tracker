import * as React from 'react';
import { cn } from '../../utils/cn';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    const isDateLike =
      type === 'date' || type === 'datetime-local' || type === 'month' || type === 'time';

    return (
      <input
        type={type}
        className={cn(
          'flex h-10 w-full min-w-0 rounded-lg border border-[hsl(var(--input))] bg-transparent px-3 py-2 text-sm ring-offset-[hsl(var(--background))] file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-[hsl(var(--muted-foreground))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
          // iOS Safari: native date controls are tall and wide; tighten padding and webkit edit box so
          // they align with h-10 text fields and fit inside responsive grids (min-w-0 on parent helps too).
          isDateLike &&
            'box-border max-h-10 py-0 leading-normal text-base sm:text-sm [&::-webkit-datetime-edit]:p-0 [&::-webkit-datetime-edit-fields-wrapper]:p-0 [&::-webkit-datetime-edit-text]:p-0 [&::-webkit-datetime-edit-month-field]:py-0 [&::-webkit-datetime-edit-day-field]:py-0 [&::-webkit-datetime-edit-year-field]:py-0',
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = 'Input';

export { Input };
