'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Image from 'next/image';
import Link from 'next/link';
import { carsApi, sparePartsApi } from '../../../lib/api';
import { useAuthStore } from '../../../lib/auth-store';
import { CarCard } from '../../../components/cars/CarCard';
import { SparePartCard } from '../../../components/cars/SparePartCard';
import { useCompareStore, useFavoritesStore } from '../../../lib/store';
import {
  formatPrice,
  getCategoryLabel,
  getEngineTypeLabel,
  getConditionLabel,
  getAccidentHistoryLabel,
  scoreToPercent,
  accidentTypeToPercent,
  parseEngineSmokeField,
  Car,
} from '../../../types';
import { ConditionScoreBar } from '../../../components/cars/ConditionScoreBar';
import { AiPriceLabelBadge } from '../../../components/cars/AiPriceLabelBadge';
import {
  Heart, GitCompare, Fuel, Zap, Shield, Star, Eye, Users,
  Gauge, Settings, Ruler, Package, ChevronLeft, CheckCircle2,
  Wrench, Calendar, Pencil, Trash2, ZoomIn
} from 'lucide-react';
import { clsx } from 'clsx';
import { resolveCarImagesUrl, resolveCarImageUrl } from '../../../lib/image-url';
import { ImageLightbox } from '../../../components/ui/ImageLightbox';

export default function CarDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const id = params.id as string;
  const authUser = useAuthStore((s) => s.user);
  const isAdmin = authUser?.role === 'admin';

  const { data: car, isLoading } = useQuery<Car>({
    queryKey: ['car', id],
    queryFn: () => carsApi.getOne(id).then(r => r.data),
  });

  const { data: similarCars } = useQuery({
    queryKey: ['similar', id],
    queryFn: () => carsApi.getSimilar(id).then(r => r.data),
    enabled: !!car,
  });

  const { data: spareParts } = useQuery({
    queryKey: ['spare-parts-car', id],
    queryFn: () => sparePartsApi.getByCar(id).then(r => r.data),
    enabled: !!car,
  });

  const { addCar, removeCar, isSelected, selectedCars } = useCompareStore();
  const { toggle, isFavorite } = useFavoritesStore();
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  useEffect(() => {
    setSelectedImageIndex(0);
    setLightboxOpen(false);
  }, [id]);

  if (isLoading) return <DetailSkeleton />;
  if (!car) return <div className="text-center py-20 text-white">السيارة غير موجودة</div>;

  const allImages: string[] = [];
  const mainImage = resolveCarImageUrl(car.imageUrl);
  if (mainImage) allImages.push(mainImage);
  for (const url of resolveCarImagesUrl(car.images) ?? []) {
    if (url && !allImages.includes(url)) allImages.push(url);
  }
  const activeImage = allImages[selectedImageIndex] ?? allImages[0];

  const selected = isSelected(car._id);
  const favorite = isFavorite(car._id);

  const hasConditionDetails =
    (car.mileage != null && car.mileage >= 0) ||
    !!car.motorCondition ||
    !!car.electricalCondition ||
    !!car.oilCondition ||
    !!car.engineSmokeLevel ||
    car.isEngineSmoking === true ||
    car.isEngineSmoking === false ||
    !!car.chassisCondition ||
    !!car.accidentHistoryType ||
    !!car.accidentHistoryLevel ||
    !!car.tiresCondition;

  const specs = [
    { icon: Gauge, label: 'قوة المحرك', value: car.horsepower ? `${car.horsepower} حصان` : '—', color: 'text-primary-400' },
    { icon: Zap, label: 'عزم الدوران', value: car.torque ? `${car.torque} نيوتن.متر` : '—', color: 'text-amber-400' },
    { icon: Gauge, label: '0-100 كم/س', value: car.acceleration ? `${car.acceleration} ث` : '—', color: 'text-blue-400' },
    { icon: Gauge, label: 'السرعة القصوى', value: car.topSpeed ? `${car.topSpeed} كم/س` : '—', color: 'text-emerald-400' },
    { icon: Fuel, label: 'استهلاك الوقود', value: car.engineType === 'electric' ? 'كهربائي' : (car.fuelConsumption ? `${car.fuelConsumption} لتر/100كم` : '—'), color: 'text-green-400' },
    { icon: Users, label: 'عدد المقاعد', value: car.seatingCapacity ? `${car.seatingCapacity} مقاعد` : '—', color: 'text-purple-400' },
    { icon: Package, label: 'حجم الصندوق', value: car.cargoVolume ? `${car.cargoVolume} لتر` : '—', color: 'text-cyan-400' },
    { icon: Ruler, label: 'وزن السيارة', value: car.weight ? `${car.weight.toLocaleString()} كجم` : '—', color: 'text-rose-400' },
  ];

  return (
    <div className="min-h-screen py-8 bg-dark-950">
      <div className="page-container">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-slate-500 mb-6">
          <Link href="/" className="hover:text-white transition-colors">الرئيسية</Link>
          <ChevronLeft className="w-4 h-4" />
          <Link href="/cars" className="hover:text-white transition-colors">السيارات</Link>
          <ChevronLeft className="w-4 h-4" />
          <span className="text-slate-300">{car.brand} {car.model}</span>
        </nav>

        <div className="space-y-8 mb-12">
          {/* Images */}
          <section className="space-y-3 max-w-4xl mx-auto w-full">
            <button
              type="button"
              onClick={() => activeImage && setLightboxOpen(true)}
              disabled={!activeImage}
              className={clsx(
                'relative aspect-[16/10] w-full rounded-2xl overflow-hidden bg-dark-900 border border-dark-800 text-right block',
                activeImage && 'cursor-zoom-in group',
              )}
              aria-label="عرض الصورة بحجم كامل"
            >
              {activeImage ? (
                <>
                  <Image
                    key={activeImage}
                    src={activeImage}
                    alt={`${car.brand} ${car.model}`}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                    priority={selectedImageIndex === 0}
                    sizes="(max-width: 1024px) 100vw, 60vw"
                  />
                  <span className="absolute bottom-3 left-3 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-black/55 text-white/90 text-xs opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    <ZoomIn className="w-3.5 h-3.5" />
                    اضغط للتكبير
                  </span>
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-8xl bg-gradient-to-br from-dark-800 to-dark-900">
                  🚗
                </div>
              )}
              <div className="absolute top-4 right-4 flex flex-col gap-2 pointer-events-none">
                <span
                  className={clsx(
                    'badge',
                    car.condition === 'new'
                      ? 'badge-green'
                      : car.condition === 'certified'
                        ? 'badge-blue'
                        : 'badge-orange',
                  )}
                >
                  {getConditionLabel(car.condition)}
                </span>
                <span className="badge badge-orange">{getCategoryLabel(car.category)}</span>
              </div>
            </button>

            <ImageLightbox
              open={lightboxOpen}
              src={activeImage}
              alt={`${car.brand} ${car.model}`}
              onClose={() => setLightboxOpen(false)}
            />

            {allImages.length > 1 && (
              <div
                className="flex gap-2 overflow-x-auto pb-1 scroll-smooth [scrollbar-width:thin] [-ms-overflow-style:none] [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-thumb]:bg-dark-700 [&::-webkit-scrollbar-thumb]:rounded-full"
                role="list"
                aria-label="معرض صور السيارة"
              >
                {allImages.map((src, index) => {
                  const isActive = index === selectedImageIndex;
                  return (
                    <button
                      key={src}
                      type="button"
                      role="listitem"
                      aria-label={`صورة ${index + 1}`}
                      aria-pressed={isActive}
                      onClick={() => setSelectedImageIndex(index)}
                      className={clsx(
                        'relative shrink-0 w-24 h-16 sm:w-28 sm:h-[4.5rem] rounded-xl overflow-hidden border-2 transition-all',
                        isActive
                          ? 'border-primary-500 ring-2 ring-primary-500/40 opacity-100'
                          : 'border-dark-700 opacity-70 hover:opacity-100 hover:border-dark-500',
                      )}
                    >
                      <Image src={src} alt="" fill className="object-cover" sizes="112px" />
                    </button>
                  );
                })}
              </div>
            )}
          </section>

          {/* Info — below images */}
          <section className="flex flex-col gap-6">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
              <div className="flex-1 min-w-0">
                <p className="text-primary-400 font-semibold text-sm mb-1">{car.brand}</p>
                <h1 className="text-3xl sm:text-4xl font-display font-black text-white mb-2">{car.model}</h1>
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="bg-dark-700 text-slate-300 px-3 py-1 rounded-lg text-sm font-medium flex items-center gap-1.5">
                    <Calendar className="w-4 h-4" />
                    {car.year}
                  </span>
                  {car.rating > 0 && (
                    <span className="flex items-center gap-1.5 text-sm">
                      <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                      <span className="text-white font-medium">{car.rating}</span>
                      <span className="text-slate-500">({car.reviewsCount} تقييم)</span>
                    </span>
                  )}
                  <span className="flex items-center gap-1.5 text-sm text-slate-500">
                    <Eye className="w-4 h-4" />
                    {car.views.toLocaleString('ar')} مشاهدة
                  </span>
                </div>
              </div>

              <div className="card p-5 lg:min-w-[240px] shrink-0 space-y-3">
                <div>
                  <p className="text-slate-400 text-sm mb-1">السعر</p>
                  <p className="text-3xl sm:text-4xl font-black text-primary-400">
                    {formatPrice(car.price, car.currency)}
                  </p>
                  {car.condition !== 'new' && car.mileage != null && car.mileage > 0 && (
                    <p className="text-slate-500 text-sm mt-1">{car.mileage.toLocaleString('ar')} كم</p>
                  )}
                </div>
                <AiPriceLabelBadge car={car} />
              </div>
            </div>

            {/* Quick Info */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'نوع المحرك', value: getEngineTypeLabel(car.engineType), icon: '⚙️' },
                { label: 'ناقل الحركة', value: car.transmission === 'automatic' ? 'أوتوماتيك' : car.transmission === 'manual' ? 'يدوي' : car.transmission || '—', icon: '⚡' },
                { label: 'الدفع', value: car.driveType || '—', icon: '🔄' },
                { label: 'اللون', value: car.color || '—', icon: '🎨' },
              ].map(({ label, value, icon }) => (
                <div key={label} className="bg-dark-800/60 border border-dark-700 rounded-xl p-3">
                  <p className="text-slate-500 text-xs mb-1">{icon} {label}</p>
                  <p className="text-white text-sm font-medium">{value}</p>
                </div>
              ))}
            </div>

            {hasConditionDetails && (
              <div className="card p-5 sm:p-6">
                <h3 className="text-white font-bold text-base mb-4 border-b border-dark-700 pb-2">
                  حالة السيارة (تفاصيل إضافية)
                </h3>
                <div className="space-y-4">
                  {car.mileage != null && car.mileage >= 0 && (
                    <div className="flex justify-between gap-2 text-sm pb-2 border-b border-dark-800/80">
                      <span className="text-slate-400">شقد ماشية</span>
                      <span className="text-white font-semibold">{car.mileage.toLocaleString('ar')} كم</span>
                    </div>
                  )}
                  {scoreToPercent(car.motorCondition) != null && (
                    <ConditionScoreBar label="موتور" percent={scoreToPercent(car.motorCondition)!} />
                  )}
                  {scoreToPercent(car.electricalCondition) != null && (
                    <ConditionScoreBar label="حالة الكهرباء" percent={scoreToPercent(car.electricalCondition)!} />
                  )}
                  {scoreToPercent(car.oilCondition) != null && (
                    <ConditionScoreBar label="زيت" percent={scoreToPercent(car.oilCondition)!} />
                  )}
                  {(() => {
                    const smoke = parseEngineSmokeField(car.engineSmokeLevel, car.isEngineSmoking);
                    const smokePct = scoreToPercent(smoke);
                    if (smokePct == null) return null;
                    return (
                      <ConditionScoreBar
                        label="مبخوخة"
                        percent={smokePct}
                        subtitle={smokePct >= 50 ? 'نعم' : 'لا'}
                        higherIsBetter={false}
                      />
                    );
                  })()}
                  {scoreToPercent(car.chassisCondition) != null && (
                    <ConditionScoreBar label="شاسيه" percent={scoreToPercent(car.chassisCondition)!} />
                  )}
                  {(() => {
                    const accPct =
                      accidentTypeToPercent(car.accidentHistoryType) ??
                      scoreToPercent(car.accidentHistoryLevel);
                    if (accPct == null) return null;
                    return (
                      <ConditionScoreBar
                        label="قصة / نص قصة / بدون قص"
                        percent={accPct}
                        subtitle={
                          car.accidentHistoryType
                            ? getAccidentHistoryLabel(car.accidentHistoryType)
                            : undefined
                        }
                      />
                    );
                  })()}
                  {scoreToPercent(car.tiresCondition) != null && (
                    <ConditionScoreBar label="حالة الدواليب" percent={scoreToPercent(car.tiresCondition)!} />
                  )}
                </div>
              </div>
            )}

            {/* Admin */}
            {isAdmin && (
              <div className="flex flex-wrap gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/25">
                <Link
                  href={`/admin/cars/${car._id}/edit`}
                  className="flex-1 min-w-[120px] flex items-center justify-center gap-2 py-2.5 rounded-xl bg-dark-800 border border-amber-500/30 text-amber-400 text-sm font-medium hover:bg-amber-500/10 transition-colors"
                >
                  <Pencil className="w-4 h-4" />
                  تعديل (مسؤول)
                </Link>
                <button
                  type="button"
                  onClick={async () => {
                    if (!confirm(`حذف ${car.brand} ${car.model} نهائياً؟`)) return;
                    try {
                      await carsApi.delete(car._id);
                      queryClient.invalidateQueries({ queryKey: ['cars'] });
                      router.push('/cars');
                    } catch {
                      alert('فشل الحذف');
                    }
                  }}
                  className="flex-1 min-w-[120px] flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 text-sm font-medium hover:bg-red-500/25 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  حذف
                </button>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col gap-3">
              <div className="flex gap-3">
                <button
                  onClick={() => toggle(car._id)}
                  className={clsx(
                    'flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border font-medium transition-all',
                    favorite
                      ? 'bg-red-500/15 border-red-500/30 text-red-400'
                      : 'bg-dark-800 border-dark-700 text-slate-400 hover:text-red-400 hover:border-red-500/30'
                  )}
                >
                  <Heart className="w-5 h-5" fill={favorite ? 'currentColor' : 'none'} />
                  {favorite ? 'في المفضلة' : 'أضف للمفضلة'}
                </button>
                <button
                  onClick={() => selected ? removeCar(car._id) : (selectedCars.length < 4 && addCar(car))}
                  className={clsx(
                    'flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border font-medium transition-all',
                    selected
                      ? 'bg-primary-500/15 border-primary-500/30 text-primary-400'
                      : 'bg-dark-800 border-dark-700 text-slate-400 hover:text-primary-400 hover:border-primary-500/30'
                  )}
                >
                  <GitCompare className="w-5 h-5" />
                  {selected ? 'في المقارنة' : 'أضف للمقارنة'}
                </button>
              </div>
              <Link href="/compare" className="btn-primary flex items-center justify-center gap-2 py-3">
                قارن الآن
              </Link>
            </div>
          </section>
        </div>

        {/* Specs Grid */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <Settings className="w-6 h-6 text-primary-400" />
            المواصفات التقنية
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {specs.map(({ icon: Icon, label, value, color }) => (
              <div key={label} className="card p-5 flex flex-col gap-2">
                <Icon className={`w-5 h-5 ${color}`} />
                <p className="text-slate-400 text-xs">{label}</p>
                <p className={`font-bold text-lg ${color}`}>{value}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Features */}
        <section className="mb-12 grid md:grid-cols-3 gap-6">
          {[
            { title: 'ميزات الأمان', items: car.safetyFeatures, icon: Shield, color: 'text-emerald-400' },
            { title: 'ميزات تقنية', items: car.techFeatures, icon: Zap, color: 'text-blue-400' },
            { title: 'ميزات الراحة', items: car.comfortFeatures, icon: Settings, color: 'text-amber-400' },
          ].map(({ title, items, icon: Icon, color }) => items && items.length > 0 ? (
            <div key={title} className="card p-6">
              <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                <Icon className={`w-5 h-5 ${color}`} />
                {title}
              </h3>
              <ul className="space-y-2">
                {items.map(f => (
                  <li key={f} className="flex items-center gap-2 text-sm text-slate-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          ) : null)}
        </section>

        {/* Spare Parts */}
        {spareParts && (spareParts as any[]).length > 0 && (
          <section className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <Wrench className="w-6 h-6 text-primary-400" />
                قطع الغيار المتوافقة
              </h2>
              <Link href={`/spare-parts?brand=${car.brand}`} className="text-primary-400 hover:text-primary-300 text-sm flex items-center gap-1">
                عرض الكل <ChevronLeft className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {(spareParts as any[]).slice(0, 4).map((part: any) => (
                <SparePartCard key={part._id} part={part} />
              ))}
            </div>
          </section>
        )}

        {/* Similar Cars */}
        {similarCars && (similarCars as any[]).length > 0 && (
          <section>
            <h2 className="text-2xl font-bold text-white mb-6">سيارات مشابهة</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              {(similarCars as any[]).slice(0, 4).map((c: any) => <CarCard key={c._id} car={c} />)}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="page-container py-8 animate-pulse space-y-6">
      <div className="h-4 skeleton rounded w-48" />
      <div className="space-y-8">
        <div className="max-w-4xl mx-auto aspect-[16/10] skeleton rounded-2xl" />
        <div className="space-y-4">
          <div className="h-10 skeleton rounded w-2/3" />
          <div className="h-24 skeleton rounded" />
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-16 skeleton rounded-xl" />
            ))}
          </div>
          <div className="h-40 skeleton rounded-xl" />
        </div>
      </div>
    </div>
  );
}
