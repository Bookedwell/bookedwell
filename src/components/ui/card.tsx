import { cn } from '@/lib/utils/cn';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'sm' | 'md' | 'lg';
}

export function Card({ children, className, padding = 'md' }: CardProps) {
  return (
    <div
      className={cn(
        'bg-white border border-light-gray rounded-xl shadow-sm',
        {
          'p-3': padding === 'sm',
          'p-4 sm:p-6': padding === 'md',
          'p-6 sm:p-8': padding === 'lg',
        },
        className
      )}
    >
      {children}
    </div>
  );
}
