'use client';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { carsApi } from '../lib/api';
import { CarCard } from '../components/cars/CarCard';
import { CarCardSkeleton, StatsSkeleton } from '../components/ui/Skeletons';
import {
  Car, Wrench, Scale, ChevronLeft, TrendingUp, Shield, Zap,
  Search, Star, Award, Users
} from 'lucide-react';
import { CATEGORIES, formatPrice } from '../types';

export default function HomePage() {
  const { data: featuredData, isLoading: loadingFeatured } = useQuery({
    queryKey: ['featured-cars'],
    queryFn: () => carsApi.getFeatured(6).then(r => r.data),
  });

  const { data: stats, isLoading: loadingStats } = useQuery({
    queryKey: ['stats'],
    queryFn: () => carsApi.getStats().then(r => r.data),
  });

  return (
    <div className="min-h-screen">
      {/* ===== HERO ===== */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden bg-hero-pattern">
        {/* Ambient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950" />
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-primary-500/8 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-amber-500/6 rounded-full blur-3xl" />

        {/* Grid Lines */}
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: 'linear-gradient(#f97316 1px, transparent 1px), linear-gradient(90deg, #f97316 1px, transparent 1px)', backgroundSize: '60px 60px' }}
        />

        <div className="page-container relative z-10 py-20">
          <div className="max-w-3xl">
            {/* Tag */}
            <div className="inline-flex items-center gap-2 bg-primary-500/10 border border-primary-500/20 text-primary-400 px-4 py-2 rounded-full text-sm font-medium mb-8 animate-fade-up">
              <span className="w-2 h-2 rounded-full bg-primary-400 animate-pulse-slow" />
              أكبر منصة سيارات في المنطقة
            </div>

            <h1 className="text-5xl md:text-7xl font-display font-black text-white leading-tight mb-6 animate-fade-up" style={{ animationDelay: '0.1s', opacity: 0 }}>
              اكتشف سيارة
              <span className="block gradient-text">أحلامك</span>
            </h1>

            <p className="text-xl text-slate-400 leading-relaxed mb-10 max-w-xl animate-fade-up" style={{ animationDelay: '0.2s', opacity: 0 }}>
              استعرض آلاف السيارات، قارن المواصفات، واعثر على قطع الغيار المناسبة — كل ما تحتاجه في مكان واحد.
            </p>

            {/* Search Bar */}
            <div className="flex flex-col sm:flex-row gap-3 mb-8 animate-fade-up" style={{ animationDelay: '0.3s', opacity: 0 }}>
              <div className="flex-1 relative">
                <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="text"
                  placeholder="ابحث عن سيارة... (BMW X5، كامري 2024...)"
                  className="input-field pr-12 h-14 text-base"
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      const val = (e.target as HTMLInputElement).value;
                      window.location.href = `/cars?search=${encodeURIComponent(val)}`;
                    }
                  }}
                />
              </div>
              <Link href="/cars" className="btn-primary h-14 px-8 flex items-center justify-center whitespace-nowrap text-base">
                ابحث الآن
              </Link>
            </div>

            {/* Quick Links */}
            <div className="flex flex-wrap gap-2 animate-fade-up" style={{ animationDelay: '0.4s', opacity: 0 }}>
              {CATEGORIES.slice(0, 5).map(cat => (
                <Link
                  key={cat.value}
                  href={`/cars?category=${cat.value}`}
                  className="flex items-center gap-2 bg-dark-800/80 hover:bg-dark-700 border border-dark-700 hover:border-dark-600 text-slate-300 hover:text-white px-4 py-2 rounded-xl text-sm transition-all"
                >
                  <span>{cat.icon}</span>
                  <span>{cat.labelAr}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Floating Stats Cards */}
          <div className="hidden lg:flex absolute left-8 top-1/2 -translate-y-1/2 flex-col gap-3">
            {[
              { icon: Car, label: 'سيارة', value: stats?.totalCars || '500+' },
              { icon: Award, label: 'ماركة', value: stats?.totalBrands || '50+' },
              { icon: Users, label: 'مستخدم', value: '10K+' },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="glass rounded-2xl p-4 flex items-center gap-3 min-w-[160px] animate-float">
                <div className="w-10 h-10 rounded-xl bg-primary-500/20 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-primary-400" />
                </div>
                <div>
                  <p className="text-white font-bold text-xl leading-none">{value}</p>
                  <p className="text-slate-400 text-xs mt-0.5">{label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== STATS ===== */}
      <section className="py-16 bg-dark-900/50 border-y border-dark-800">
        <div className="page-container">
          {loadingStats ? <StatsSkeleton /> : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { icon: Car, label: 'إجمالي السيارات', value: stats?.totalCars?.toLocaleString('ar') || '0', color: 'text-primary-400' },
                { icon: Award, label: 'ماركة عالمية', value: stats?.totalBrands || '0', color: 'text-amber-400' },
                { icon: Wrench, label: 'قطعة غيار', value: '500+', color: 'text-blue-400' },
                { icon: Star, label: 'تقييم المتوسط', value: '4.7', color: 'text-emerald-400' },
              ].map(({ icon: Icon, label, value, color }) => (
                <div key={label} className="stat-card group hover:border-dark-600 transition-colors">
                  <div className={`w-12 h-12 rounded-2xl bg-dark-700 flex items-center justify-center group-hover:scale-110 transition-transform ${color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <p className={`text-3xl font-black ${color}`}>{value}</p>
                  <p className="text-slate-400 text-sm">{label}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ===== CATEGORIES ===== */}
      <section className="py-20">
        <div className="page-container">
          <div className="flex items-end justify-between mb-10">
            <div>
              <h2 className="section-title">تصفح حسب الفئة</h2>
              <p className="section-subtitle">اختر الفئة التي تناسب احتياجاتك</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {CATEGORIES.map((cat, i) => (
              <Link
                key={cat.value}
                href={`/cars?category=${cat.value}`}
                className="card p-6 flex flex-col items-center gap-3 text-center group hover:border-primary-500/40 hover:-translate-y-1 transition-all duration-300"
                style={{ animationDelay: `${i * 0.05}s` }}
              >
                <span className="text-4xl group-hover:scale-110 transition-transform duration-300">{cat.icon}</span>
                <span className="text-white font-semibold">{cat.labelAr}</span>
                <span className="text-xs text-slate-500 group-hover:text-primary-400 transition-colors">استعرض الآن ←</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FEATURED CARS ===== */}
      <section className="py-20 bg-dark-900/30">
        <div className="page-container">
          <div className="flex items-end justify-between mb-10">
            <div>
              <h2 className="section-title">السيارات المميزة</h2>
              <p className="section-subtitle">الأكثر مشاهدة وتقييماً على المنصة</p>
            </div>
            <Link href="/cars" className="hidden md:flex items-center gap-2 text-primary-400 hover:text-primary-300 font-medium transition-colors">
              عرض الكل
              <ChevronLeft className="w-4 h-4" />
            </Link>
          </div>

          {loadingFeatured ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => <CarCardSkeleton key={i} />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {(featuredData as any[] || []).map((car: any) => (
                <CarCard key={car._id} car={car} />
              ))}
            </div>
          )}

          <div className="flex justify-center mt-10">
            <Link href="/cars" className="btn-secondary flex items-center gap-2">
              <Car className="w-4 h-4" />
              استعرض جميع السيارات
            </Link>
          </div>
        </div>
      </section>

      {/* ===== FEATURES ===== */}
      <section className="py-20">
        <div className="page-container">
          <div className="text-center mb-14">
            <h2 className="section-title">لماذا AutoArabia؟</h2>
            <p className="section-subtitle">نوفر لك كل ما تحتاجه لاتخاذ قرار شراء مستنير</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: Scale,
                title: 'مقارنة ذكية',
                desc: 'قارن بين 4 سيارات في نفس الوقت بناءً على أكثر من 15 معيار تقني وتشغيلي مع تحليل تلقائي',
                color: 'from-primary-500 to-amber-500',
                link: '/compare',
                linkLabel: 'جرب المقارنة',
              },
              {
                icon: Wrench,
                title: 'قطع الغيار',
                desc: 'قاعدة بيانات ضخمة لقطع الغيار الأصلية والمعادلة مع التوافق الكامل مع موديل سيارتك',
                color: 'from-blue-500 to-cyan-500',
                link: '/spare-parts',
                linkLabel: 'ابحث عن قطعة',
              },
              {
                icon: Shield,
                title: 'بيانات موثوقة',
                desc: 'جميع المواصفات محدثة ومتحقق منها من مصادر رسمية لضمان دقة المعلومات',
                color: 'from-emerald-500 to-teal-500',
                link: '/cars',
                linkLabel: 'استعرض السيارات',
              },
            ].map(({ icon: Icon, title, desc, color, link, linkLabel }) => (
              <div key={title} className="card p-7 group hover:border-dark-600 transition-all">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center mb-5 shadow-lg group-hover:scale-105 transition-transform`}>
                  <Icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-white font-bold text-xl mb-3">{title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed mb-5">{desc}</p>
                <Link href={link} className="text-primary-400 hover:text-primary-300 text-sm font-medium flex items-center gap-1 transition-colors">
                  {linkLabel}
                  <ChevronLeft className="w-4 h-4" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CTA Banner ===== */}
      <section className="py-20 px-4">
        <div className="page-container">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary-600 via-primary-500 to-amber-500 p-12 text-center">
            <div className="absolute inset-0 bg-hero-pattern opacity-10" />
            <div className="relative z-10">
              <Zap className="w-12 h-12 text-white/80 mx-auto mb-4" />
              <h2 className="text-3xl md:text-4xl font-display font-black text-white mb-4">
                هل أنت مستعد للعثور على سيارتك؟
              </h2>
              <p className="text-white/80 text-lg mb-8 max-w-xl mx-auto">
                ابدأ رحلتك الآن واستعرض مئات السيارات من أفضل الماركات العالمية
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/cars" className="bg-white text-primary-600 font-bold px-8 py-3 rounded-xl hover:bg-white/90 transition-colors shadow-lg">
                  استعرض السيارات
                </Link>
                <Link href="/compare" className="bg-white/20 text-white font-bold px-8 py-3 rounded-xl hover:bg-white/30 transition-colors border border-white/30">
                  ابدأ المقارنة
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
