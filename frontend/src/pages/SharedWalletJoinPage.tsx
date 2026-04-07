import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { Wallet, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { sharedWalletAPI } from '../services/api';
import { useStore } from '../store/useStore';

export function SharedWalletJoinPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const { token: authToken } = useStore();
  const navigate = useNavigate();
  const [preview, setPreview] = useState<{
    valid: boolean;
    walletName?: string;
    email?: string;
    role?: string;
    inviterName?: string;
  } | null>(null);

  useEffect(() => {
    if (!token) {
      setPreview({ valid: false });
      return;
    }
    sharedWalletAPI
      .previewInvite(token)
      .then((r) => setPreview(r.data))
      .catch(() => setPreview({ valid: false }));
  }, [token]);

  const acceptMut = useMutation({
    mutationFn: () => sharedWalletAPI.acceptInvite(token),
    onSuccess: (res) => {
      toast.success(`Joined ${res.data.walletName || 'wallet'}`);
      navigate(`/shared-wallets/${res.data.walletId}`, { replace: true });
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || 'Could not accept invite';
      toast.error(typeof msg === 'string' ? msg : 'Could not accept invite');
    },
  });

  const goLogin = () => {
    const ret = `/shared-wallets/join?token=${encodeURIComponent(token)}`;
    sessionStorage.setItem('postLoginRedirect', ret);
    navigate('/login');
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[hsl(var(--background))] px-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-8 pb-6 text-center">
            <XCircle className="h-12 w-12 text-[hsl(var(--destructive))] mx-auto mb-4" />
            <p className="font-medium">Missing invite link</p>
            <p className="text-sm text-[hsl(var(--muted-foreground))] mt-2">Open the link from your invitation email.</p>
            <Button asChild className="mt-6"><Link to="/login">Sign in</Link></Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (preview === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[hsl(var(--background))]">
        <div className="animate-spin h-8 w-8 border-4 border-[hsl(var(--primary))] border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!preview.valid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[hsl(var(--background))] px-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-8 pb-6 text-center">
            <XCircle className="h-12 w-12 text-[hsl(var(--destructive))] mx-auto mb-4" />
            <p className="font-medium">Invalid or expired invite</p>
            <Button asChild variant="outline" className="mt-6"><Link to="/">Home</Link></Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-indigo-950 px-4 py-12">
      <Card className="max-w-md w-full border-[hsl(var(--border))] shadow-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-2xl bg-[hsl(var(--primary))]">
            <Wallet className="h-8 w-8 text-white" />
          </div>
          <CardTitle>Shared wallet invite</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <p className="text-[hsl(var(--foreground))]">
            You’re invited to <strong>{preview.walletName}</strong>
          </p>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            Invited by {preview.inviterName}. Role: <strong>{preview.role}</strong>. Use Google sign-in as{' '}
            <strong>{preview.email}</strong>.
          </p>
          {authToken ? (
            <>
              <Button
                className="w-full gap-2"
                disabled={acceptMut.isPending}
                onClick={() => acceptMut.mutate()}
              >
                <CheckCircle2 className="h-4 w-4" />
                Accept & open wallet
              </Button>
              <Button variant="ghost" className="w-full" asChild>
                <Link to="/shared-wallets">Back to shared wallets</Link>
              </Button>
            </>
          ) : (
            <>
              <Button className="w-full" onClick={goLogin}>
                Sign in to accept
              </Button>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">
                After signing in with Google, you’ll return here automatically.
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
