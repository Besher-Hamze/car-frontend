'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authApi } from '../../lib/api';
import { useAuthStore } from '../../lib/auth-store';
import { UserPlus, Loader2 } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (password.length < 6) {
      setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      return;
    }
    setLoading(true);
    try {
      const { data } = await authApi.register(email.trim(), password, name.trim() || undefined);
      setAuth(data.accessToken, data.user);
      router.push('/');
      router.refresh();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string | string[] } } })?.response?.data
          ?.message;
      setError(
        Array.isArray(msg) ? msg.join(' ') : msg || 'فشل إنشاء الحساب',
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
              <h1 className="text-2xl font-bold text-white">إنشاء حساب</h1>
              <p className="text-slate-400 text-sm">سجّل كمستخدم لاستعراض المنصة</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3">
                {error}
              </div>
            )}
            <div>
              <label className="text-xs text-slate-400 mb-1.5 block">الاسم (اختياري)</label>
              <input
                type="text"
                className="input-field"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1.5 block">البريد الإلكتروني</label>
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
              <label className="text-xs text-slate-400 mb-1.5 block">كلمة المرور (6 أحرف على الأقل)</label>
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
              تسجيل
            </button>
          </form>

          <p className="text-center text-slate-400 text-sm mt-6">
            لديك حساب بالفعل؟{' '}
            <Link href="/login" className="text-primary-400 hover:text-primary-300 font-medium">
              تسجيل الدخول
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
