import { forwardRef } from 'react';
import { cn } from '@/lib/utils/cn';
import { getContrastText } from '@/lib/utils/color';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  accentColor?: string;
  children: React.ReactNode;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, disabled, accentColor, children, style, ...props }, ref) => {
    // Use accentColor prop or fall back to CSS variable or default
    const dynamicStyles: React.CSSProperties = { ...style };
    
    if (accentColor) {
      if (variant === 'primary') {
        dynamicStyles.backgroundColor = accentColor;
        dynamicStyles.borderColor = accentColor;
        dynamicStyles.color = getContrastText(accentColor);
      } else if (variant === 'outline') {
        dynamicStyles.borderColor = accentColor;
        dynamicStyles.color = accentColor;
      }
    }

    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center font-medium transition-colors rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed',
          {
            'bg-primary text-white hover:opacity-90 focus:ring-primary': variant === 'primary',
            'bg-accent text-white hover:bg-blue-600 focus:ring-accent': variant === 'secondary',
            'border-2 border-primary text-primary hover:bg-primary-light focus:ring-primary': variant === 'outline',
            'text-gray-text hover:bg-bg-gray focus:ring-gray-300': variant === 'ghost',
            'bg-status-error text-white hover:bg-red-600 focus:ring-status-error': variant === 'danger',
          },
          {
            'px-3 py-1.5 text-sm': size === 'sm',
            'px-4 py-2 text-sm': size === 'md',
            'px-6 py-3 text-base': size === 'lg',
          },
          className
        )}
        style={dynamicStyles}
        disabled={disabled || loading}
        {...props}
      >
        {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button };
export type { ButtonProps };
