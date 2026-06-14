'use client';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Car, Home, Menu, X, Scale, LogIn, UserPlus, LogOut, Shield, Store, SlidersHorizontal } from 'lucide-react';
import { useCompareStore } from '../../lib/store';
import { useAuthStore } from '../../lib/auth-store';
import { clsx } from 'clsx';

const navLinks = [
  { href: '/', label: 'الرئيسية', icon: Home },
  { href: '/cars', label: 'السيارات', icon: Car },
  { href: '/compare', label: 'المقارنة', icon: Scale },
  { href: '/cars?sort=aiMatch-asc', label: 'فلترة', icon: SlidersHorizontal },
];

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { selectedCars } = useCompareStore();
  const { user, token, logout } = useAuthStore();

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  return (
    <header
      className={clsx(
        'fixed top-0 inset-x-0 z-50 transition-all duration-300',
        scrolled
          ? 'bg-dark-900/95 backdrop-blur-xl border-b border-dark-700/50 shadow-xl shadow-black/20'
          : 'bg-transparent'
      )}
    >
      <div className="page-container">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="relative w-11 h-11 rounded-xl bg-white/95 flex items-center justify-center shadow-lg shadow-black/20 group-hover:scale-105 transition-transform overflow-hidden p-1">
              <Image
                src="/autoarabia.png"
                alt="AutoArabia"
                width={40}
                height={40}
                className="object-contain"
                priority
              />
            </div>
            <div>
              <span className="font-display font-bold text-lg text-white leading-none">AutoArabia</span>
              <span className="block text-[10px] text-slate-500 leading-none">منصة السيارات</span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={clsx(
                  'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200',
                  pathname === href
                    ? 'bg-primary-500/15 text-primary-400 border border-primary-500/20'
                    : 'text-slate-400 hover:text-white hover:bg-dark-800'
                )}
              >
                <Icon className="w-4 h-4" />
                {label}
                {href === '/compare' && selectedCars.length > 0 && (
                  <span className="w-5 h-5 rounded-full bg-primary-500 text-white text-[10px] font-bold flex items-center justify-center">
                    {selectedCars.length}
                  </span>
                )}
              </Link>
            ))}
          </nav>

          {/* CTA + Mobile */}
          <div className="flex items-center gap-2 md:gap-3">
            {user?.role === 'seller' && (
              <Link
                href="/seller/cars"
                className="hidden md:flex items-center gap-1.5 text-sm py-2 px-3 rounded-xl border border-primary-500/30 text-primary-400 hover:bg-primary-500/10 transition-colors"
              >
                <Store className="w-4 h-4" />
                سياراتي
              </Link>
            )}
            {user?.role === 'admin' && (
              <Link
                href="/admin/cars"
                className="hidden md:flex items-center gap-1.5 text-sm py-2 px-3 rounded-xl border border-amber-500/30 text-amber-400 hover:bg-amber-500/10 transition-colors"
              >
                <Shield className="w-4 h-4" />
                الإدارة
              </Link>
            )}
            {token && user ? (
              <div className="hidden md:flex items-center gap-2">
                <span className="text-xs text-slate-500 max-w-[120px] truncate" title={user.email}>
                  {user.name || user.email}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-dark-700 text-slate-400">
                  {user.role === 'admin' ? 'مسؤول' : user.role === 'seller' ? 'بائع' : 'مستخدم'}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    router.refresh();
                  }}
                  className="flex items-center gap-1.5 text-sm py-2 px-3 rounded-xl text-slate-400 hover:text-white hover:bg-dark-800 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  خروج
                </button>
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-2">
                <Link
                  href="/login"
                  className="flex items-center gap-1.5 text-sm py-2 px-3 rounded-xl text-slate-300 hover:text-white hover:bg-dark-800 transition-colors"
                >
                  <LogIn className="w-4 h-4" />
                  دخول
                </Link>
                <Link
                  href="/register"
                  className="flex items-center gap-1.5 text-sm py-2 px-3 rounded-xl border border-dark-600 text-slate-300 hover:border-primary-500/40 hover:text-primary-400 transition-colors"
                >
                  <UserPlus className="w-4 h-4" />
                  تسجيل
                </Link>
              </div>
            )}
            <Link href="/cars" className="hidden md:flex btn-primary text-sm py-2 px-5">
              استعرض السيارات
            </Link>
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-dark-800 transition-colors"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden bg-dark-900/98 backdrop-blur-xl border-t border-dark-700/50">
          <nav className="page-container py-4 flex flex-col gap-1">
            {navLinks.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                className={clsx(
                  'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all',
                  pathname === href
                    ? 'bg-primary-500/15 text-primary-400'
                    : 'text-slate-400 hover:text-white hover:bg-dark-800'
                )}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            ))}
            {user?.role === 'seller' && (
              <Link
                href="/seller/cars"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-primary-400 hover:bg-dark-800"
              >
                <Store className="w-4 h-4" />
                سياراتي
              </Link>
            )}
            {user?.role === 'admin' && (
              <Link
                href="/admin/cars"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-amber-400 hover:bg-dark-800"
              >
                <Shield className="w-4 h-4" />
                إدارة السيارات
              </Link>
            )}
            {token && user ? (
              <button
                type="button"
                onClick={() => {
                  logout();
                  setMobileOpen(false);
                  router.refresh();
                }}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-dark-800 w-full text-right"
              >
                <LogOut className="w-4 h-4" />
                تسجيل الخروج ({user.email})
              </button>
            ) : (
              <div className="flex flex-col gap-1 pt-2 border-t border-dark-700/50">
                <Link
                  href="/login"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-300 hover:bg-dark-800"
                >
                  <LogIn className="w-4 h-4" />
                  تسجيل الدخول
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-primary-400 hover:bg-dark-800"
                >
                  <UserPlus className="w-4 h-4" />
                  إنشاء حساب
                </Link>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
