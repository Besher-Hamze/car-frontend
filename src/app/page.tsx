'use client';
import Link from 'next/link';
import Image from 'next/image';
import { useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { carsApi } from '../lib/api';
import { CarCard } from '../components/cars/CarCard';
import { CarCardSkeleton, StatsSkeleton } from '../components/ui/Skeletons';
import {
  Car, Scale, ChevronLeft, ChevronRight, Shield, Zap,
  Search, Star, Award, Calendar, Sparkles,
  Users, SlidersHorizontal
} from 'lucide-react';
import { CATEGORIES, formatPrice } from '../types';
import { resolveCarImageUrl } from '../lib/image-url';

export default function HomePage() {
  const { data: featuredData, isLoading: loadingFeatured } = useQuery({
    queryKey: ['featured-cars'],
    queryFn: () => carsApi.getFeatured(10).then(r => r.data),
  });

  const { data: stats, isLoading: loadingStats } = useQuery({
    queryKey: ['stats'],
    queryFn: () => carsApi.getStats().then(r => r.data),
  });

  const { data: newestData, isLoading: loadingNewest } = useQuery({
    queryKey: ['newest-cars'],
    queryFn: () =>
      carsApi
        .getAll({ page: 1, limit: 3, sortBy: 'createdAt', sortOrder: 'desc' })
        .then((r) => r.data),
  });
  const newestCars: any[] = (newestData as any)?.data || [];

  const carouselRef = useRef<HTMLDivElement>(null);
  const scrollByAmount = (dir: 'prev' | 'next') => {
    const el = carouselRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>('[data-carousel-item]');
    const step = card ? card.offsetWidth + 24 : el.clientWidth * 0.8;
    el.scrollBy({ left: dir === 'next' ? -step : step, behavior: 'smooth' });
  };

  const featuredCars = (featuredData as any[]) || [];

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
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            {/* Content — right column (start in RTL) */}
            <div className="order-1 lg:order-1 max-w-xl">
              {/* Tag */}
              <div className="inline-flex items-center gap-2 bg-primary-500/10 border border-primary-500/20 text-primary-400 px-4 py-2 rounded-full text-sm font-medium mb-8 animate-fade-up">
                <span className="w-2 h-2 rounded-full bg-primary-400 animate-pulse-slow" />
                أكبر منصة سيارات في المنطقة
              </div>

              <h1 className="text-5xl md:text-7xl font-display font-black text-white leading-tight mb-6 animate-fade-up" style={{ animationDelay: '0.1s', opacity: 0 }}>
                اكتشف سيارة
                <span className="block gradient-text">أحلامك</span>
              </h1>

              <p className="text-xl text-slate-400 leading-relaxed mb-10 animate-fade-up" style={{ animationDelay: '0.2s', opacity: 0 }}>
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

            {/* Newest Cars — left column (end in RTL) */}
            <div className="order-2 lg:order-2 hidden md:block">
              <div className="flex items-center justify-between mb-4">
                <div className="inline-flex items-center gap-2 text-primary-400 text-sm font-semibold">
                  <Sparkles className="w-4 h-4" />
                  أحدث السيارات المضافة
                </div>
                <Link
                  href="/cars"
                  className="text-slate-400 hover:text-primary-400 text-xs flex items-center gap-1 transition-colors"
                >
                  عرض الكل
                  <ChevronLeft className="w-3.5 h-3.5" />
                </Link>
              </div>

              {loadingNewest ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="h-24 skeleton rounded-2xl" />
                  ))}
                </div>
              ) : newestCars.length === 0 ? (
                <div className="glass rounded-2xl p-6 text-center text-slate-400 text-sm">
                  لا توجد سيارات حديثة بعد
                </div>
              ) : (
                <div className="space-y-3">
                  {newestCars.slice(0, 3).map((car: any, i: number) => {
                    const src = resolveCarImageUrl(car.imageUrl);
                    return (
                      <Link
                        key={car._id}
                        href={`/cars/${car._id}`}
                        className="glass rounded-2xl p-3 flex items-center gap-4 group hover:border-primary-500/40 hover:-translate-y-0.5 transition-all animate-fade-up"
                        style={{ animationDelay: `${0.2 + i * 0.1}s`, opacity: 0 }}
                      >
                        <div className="relative w-28 h-20 shrink-0 rounded-xl overflow-hidden bg-dark-800">
                          {src ? (
                            <Image
                              src={src}
                              alt={`${car.brand} ${car.model}`}
                              fill
                              className="object-cover group-hover:scale-105 transition-transform duration-500"
                              sizes="112px"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-3xl bg-gradient-to-br from-dark-800 to-dark-900">
                              🚗
                            </div>
                          )}
                          <span className="absolute top-1 right-1 bg-primary-500/90 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                            جديد
                          </span>
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="text-slate-400 text-[11px] font-medium truncate">
                            {car.brand}
                          </p>
                          <p className="text-white font-bold text-base leading-tight truncate group-hover:text-primary-400 transition-colors">
                            {car.model}
                          </p>
                          <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-1">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {car.year}
                            </span>
                            <span className="text-primary-400 font-bold">
                              {formatPrice(car.price, car.currency)}
                            </span>
                          </div>
                        </div>

                        <ChevronLeft className="w-4 h-4 text-slate-500 group-hover:text-primary-400 transition-colors shrink-0" />
                      </Link>
                    );
                  })}

                  {/* Mini stat row under cars */}
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    {[
                      { icon: Car, label: 'سيارة', value: stats?.totalCars || '500+' },
                      { icon: Award, label: 'ماركة', value: stats?.totalBrands || '50+' },
                    ].map(({ icon: Icon, label, value }) => (
                      <div
                        key={label}
                        className="glass rounded-xl px-3 py-2.5 flex items-center gap-2.5"
                      >
                        <div className="w-8 h-8 rounded-lg bg-primary-500/20 flex items-center justify-center">
                          <Icon className="w-4 h-4 text-primary-400" />
                        </div>
                        <div className="leading-tight">
                          <p className="text-white font-bold text-sm">{value}</p>
                          <p className="text-slate-400 text-[10px]">{label}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
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
                { icon: SlidersHorizontal, label: 'تقييم AI', value: 'حلب', color: 'text-blue-400' },
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

      {/* ===== FEATURED CARS (CAROUSEL) ===== */}
      <section className="py-20 bg-dark-900/30">
        <div className="page-container">
          <div className="flex items-end justify-between mb-10 gap-4">
            <div>
              <h2 className="section-title">السيارات المميزة</h2>
              <p className="section-subtitle">اسحب يميناً ويساراً لاستعراض المزيد</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => scrollByAmount('prev')}
                aria-label="السابق"
                className="hidden sm:flex w-10 h-10 rounded-xl bg-dark-800 border border-dark-700 text-slate-300 hover:text-white hover:border-primary-500/40 transition-all items-center justify-center"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={() => scrollByAmount('next')}
                aria-label="التالي"
                className="hidden sm:flex w-10 h-10 rounded-xl bg-dark-800 border border-dark-700 text-slate-300 hover:text-white hover:border-primary-500/40 transition-all items-center justify-center"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <Link
                href="/cars"
                className="hidden md:flex items-center gap-2 text-primary-400 hover:text-primary-300 font-medium transition-colors mr-2"
              >
                عرض الكل
                <ChevronLeft className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {loadingFeatured ? (
            <div className="flex gap-6 overflow-hidden">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="shrink-0 w-[85%] sm:w-[60%] md:w-[46%] lg:w-[32%]">
                  <CarCardSkeleton />
                </div>
              ))}
            </div>
          ) : featuredCars.length === 0 ? (
            <div className="text-center py-16 text-slate-400">لا توجد سيارات مميزة بعد</div>
          ) : (
            <div
              ref={carouselRef}
              className="flex gap-6 overflow-x-auto snap-x snap-mandatory pb-4 scroll-smooth [scrollbar-width:thin] [-ms-overflow-style:none] [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-thumb]:bg-dark-700 [&::-webkit-scrollbar-thumb]:rounded-full"
            >
              {featuredCars.map((car: any) => (
                <div
                  key={car._id}
                  data-carousel-item
                  className="shrink-0 snap-start w-[85%] sm:w-[60%] md:w-[46%] lg:w-[32%]"
                >
                  <CarCard car={car} />
                </div>
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
                icon: SlidersHorizontal,
                title: 'فلترة ذكية',
                desc: 'فلترة حسب السعر والماركة والحالة مع ترتيب افتراضي حسب ملاءمة السعر (AI) في سوق حلب',
                color: 'from-blue-500 to-cyan-500',
                link: '/cars?sort=aiMatch-asc',
                linkLabel: 'ابدأ الفلترة',
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
