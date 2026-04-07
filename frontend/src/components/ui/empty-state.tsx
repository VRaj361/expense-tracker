import { cn } from '../../utils/cn';

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-12 text-center', className)}>
      <div className="mb-4 text-[hsl(var(--muted-foreground))]">{icon}</div>
      <h3 className="text-lg font-semibold mb-1">{title}</h3>
      <p className="text-sm text-[hsl(var(--muted-foreground))] mb-4 max-w-sm">{description}</p>
      {action}
    </div>
  );
}
