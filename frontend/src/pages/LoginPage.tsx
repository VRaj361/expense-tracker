import { Wallet } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useStore } from '../store/useStore';
import { Navigate } from 'react-router-dom';

export function LoginPage() {
  const { token } = useStore();
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

  if (token) return <Navigate to="/" replace />;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-indigo-950 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[hsl(var(--primary))] mb-4">
            <Wallet className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold mb-2">FinTrack</h1>
          <p className="text-[hsl(var(--muted-foreground))]">
            Smart expense tracking for smarter finances
          </p>
        </div>
        <div className="bg-[hsl(var(--card))] rounded-2xl shadow-xl border border-[hsl(var(--border))] p-8">
          <h2 className="text-xl font-semibold text-center mb-6">Sign in to continue</h2>
          <a href={`${apiUrl}/auth/google`}>
            <Button size="lg" className="w-full gap-3 h-12 text-base" variant="outline">
              <svg viewBox="0 0 24 24" className="h-5 w-5">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Continue with Google
            </Button>
          </a>
          <p className="text-xs text-center text-[hsl(var(--muted-foreground))] mt-6">
            By signing in, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
        <div className="mt-8 grid grid-cols-3 gap-4 text-center">
          <div className="p-3 rounded-xl bg-[hsl(var(--card))]/50 border border-[hsl(var(--border))]">
            <p className="text-2xl font-bold text-[hsl(var(--primary))]">Free</p>
            <p className="text-xs text-[hsl(var(--muted-foreground))]">Forever</p>
          </div>
          <div className="p-3 rounded-xl bg-[hsl(var(--card))]/50 border border-[hsl(var(--border))]">
            <p className="text-2xl font-bold text-emerald-500">Secure</p>
            <p className="text-xs text-[hsl(var(--muted-foreground))]">Google Auth</p>
          </div>
          <div className="p-3 rounded-xl bg-[hsl(var(--card))]/50 border border-[hsl(var(--border))]">
            <p className="text-2xl font-bold text-amber-500">Smart</p>
            <p className="text-xs text-[hsl(var(--muted-foreground))]">AI Powered</p>
          </div>
        </div>
      </div>
    </div>
  );
}
