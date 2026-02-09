import { cn } from '@/lib/utils/cn';

interface BadgeProps {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  children: React.ReactNode;
  className?: string;
}

export function Badge({ variant = 'default', children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        {
          'bg-bg-gray text-gray-text': variant === 'default',
          'bg-green-100 text-status-success': variant === 'success',
          'bg-yellow-100 text-status-warning': variant === 'warning',
          'bg-red-100 text-status-error': variant === 'error',
          'bg-blue-100 text-status-info': variant === 'info',
        },
        className
      )}
    >
      {children}
    </span>
  );
}
