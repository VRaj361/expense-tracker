import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { authAPI } from '../services/api';

export function AuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setTokens, setUser } = useStore();

  useEffect(() => {
    const token = searchParams.get('token');
    const refreshToken = searchParams.get('refreshToken');
    if (token && refreshToken) {
      setTokens(token, refreshToken);
      authAPI.getMe().then((res) => {
        setUser(res.data);
        navigate('/', { replace: true });
      }).catch(() => navigate('/login', { replace: true }));
    } else {
      navigate('/login', { replace: true });
    }
  }, [searchParams, navigate, setTokens, setUser]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin h-8 w-8 border-4 border-[hsl(var(--primary))] border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-[hsl(var(--muted-foreground))]">Signing you in...</p>
      </div>
    </div>
  );
}
