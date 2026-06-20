'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/navigation';
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
import { LogIn, Loader2 } from 'lucide-react';

function LoginForm() {
  const t = useTranslations('common');
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get('next') || '/';
  const setAuth = useAuthStore((s) => s.setAuth);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await authApi.login(email.trim(), password);
      setAuth(data.accessToken, data.user);
      router.push(next);
      router.refresh();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string | string[] } } })?.response?.data
          ?.message;
      setError(
        Array.isArray(msg) ? msg.join(' ') : msg || t('loginFailed'),
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md">
        <div className="card p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-primary-500/15 flex items-center justify-center">
              <LogIn className="w-6 h-6 text-primary-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">{t('loginTitle')}</h1>
              <p className="text-slate-400 text-sm">{t('loginSubtitle')}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3">
                {error}
              </div>
            )}
            <div>
              <label className="text-xs text-slate-400 mb-1.5 block">{t('email')}</label>
              <input
                type="email"
                autoComplete="email"
                required
                className="input-field"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1.5 block">{t('password')}</label>
              <input
                type="password"
                autoComplete="current-password"
                required
                className="input-field"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 py-3">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
              {t('login')}
            </button>
          </form>

          <p className="text-center text-slate-400 text-sm mt-6">
            {t('noAccount')}{' '}
            <Link href="/register" className="text-primary-400 hover:text-primary-300 font-medium">
              {t('createAccount')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

function LoginFallback() {
  const t = useTranslations('common');
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4 text-slate-400">
      <Loader2 className="w-8 h-8 animate-spin text-primary-400" aria-label={t('loading')} />
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginForm />
    </Suspense>
  );
}
