import { forwardRef } from 'react';
import { cn } from '@/lib/utils/cn';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={id}
            className="block text-sm font-medium text-navy mb-1"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          className={cn(
            'w-full px-3 py-2 border rounded-lg text-navy placeholder:text-gray-text',
            'focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent',
            'transition-colors',
            error ? 'border-status-error' : 'border-light-gray',
            className
          )}
          {...props}
        />
        {error && (
          <p className="mt-1 text-sm text-status-error">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export { Input };
export type { InputProps };
