import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from './dialog';
import { Button } from './button';
import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'destructive' | 'default';
  loading?: boolean;
  onConfirm: () => void;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'destructive',
  loading = false,
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${
              variant === 'destructive'
                ? 'bg-red-100 dark:bg-red-900/30'
                : 'bg-amber-100 dark:bg-amber-900/30'
            }`}>
              <AlertTriangle className={`h-5 w-5 ${
                variant === 'destructive'
                  ? 'text-red-600 dark:text-red-400'
                  : 'text-amber-600 dark:text-amber-400'
              }`} />
            </div>
            <div>
              <DialogTitle>{title}</DialogTitle>
              <DialogDescription className="mt-1">{description}</DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button
            variant={variant === 'destructive' ? 'destructive' : 'default'}
            onClick={() => { onConfirm(); onOpenChange(false); }}
            disabled={loading}
          >
            {loading ? 'Deleting...' : confirmLabel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
