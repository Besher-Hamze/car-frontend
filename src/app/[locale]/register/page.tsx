'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/navigation';
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
import { UserPlus, Loader2, User, Store } from 'lucide-react';
import clsx from 'clsx';

type AccountKind = 'user' | 'seller';

export default function RegisterPage() {
  const t = useTranslations('common');
  const tNav = useTranslations('nav');
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);

  const [accountKind, setAccountKind] = useState<AccountKind>('user');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const accountOptions: {
    value: AccountKind;
    title: string;
    description: string;
    icon: typeof User;
  }[] = [
    {
      value: 'user',
      title: t('user'),
      description: t('userAccountDesc'),
      icon: User,
    },
    {
      value: 'seller',
      title: t('seller'),
      description: t('sellerAccountDesc'),
      icon: Store,
    },
  ];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError(t('nameRequired'));
      return;
    }
    if (password.length < 6) {
      setError(t('passwordTooShort'));
      return;
    }
    setLoading(true);
    try {
      const { data } = await authApi.register(
        email.trim(),
        password,
        trimmedName,
        accountKind,
      );
      setAuth(data.accessToken, data.user);
      router.push(accountKind === 'seller' ? '/seller/cars' : '/');
      router.refresh();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string | string[] } } })?.response?.data
          ?.message;
      setError(
        Array.isArray(msg) ? msg.join(' ') : msg || t('registerFailed'),
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
              <UserPlus className="w-6 h-6 text-primary-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">{t('registerTitle')}</h1>
              <p className="text-slate-400 text-sm">
                {accountKind === 'seller' ? t('registerAsSeller') : t('registerAsUser')}
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3">
                {error}
              </div>
            )}

            <div>
              <p className="text-xs text-slate-400 mb-2">{t('accountType')}</p>
              <div className="grid grid-cols-2 gap-2">
                {accountOptions.map(({ value, title, description, icon: Icon }) => {
                  const active = accountKind === value;
                  return (
                    <button
                      type="button"
                      key={value}
                      onClick={() => setAccountKind(value)}
                      className={clsx(
                        'relative text-right rounded-xl border p-3 transition-all',
                        active
                          ? 'border-primary-500/60 bg-primary-500/10 ring-1 ring-primary-500/30'
                          : 'border-dark-700 bg-dark-800/40 hover:border-dark-600',
                      )}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Icon
                          className={clsx(
                            'w-4 h-4',
                            active ? 'text-primary-400' : 'text-slate-400',
                          )}
                        />
                        <span
                          className={clsx(
                            'text-sm font-semibold',
                            active ? 'text-white' : 'text-slate-300',
                          )}
                        >
                          {title}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-snug">{description}</p>
                    </button>
                  );
                })}
              </div>
              {accountKind === 'seller' && (
                <p className="text-[11px] text-amber-300/90 mt-2">
                  {t('sellerNote')}
                </p>
              )}
            </div>

            <div>
              <label className="text-xs text-slate-400 mb-1.5 block">{t('name')}</label>
              <input
                type="text"
                autoComplete="name"
                required
                minLength={2}
                className="input-field"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
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
              <label className="text-xs text-slate-400 mb-1.5 block">{t('passwordMin')}</label>
              <input
                type="password"
                autoComplete="new-password"
                required
                minLength={6}
                className="input-field"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 py-3">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
              {t('register')}
            </button>
          </form>

          <p className="text-center text-slate-400 text-sm mt-6">
            {t('hasAccount')}{' '}
            <Link href="/login" className="text-primary-400 hover:text-primary-300 font-medium">
              {tNav('loginFull')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
