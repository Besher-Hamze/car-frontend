'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useRouter, Link } from '@/i18n/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Image from 'next/image';
import { carsApi } from '@/lib/api';
import { useCompareStore, useFavoritesStore } from '@/lib/store';
import { useOptionLabels } from '@/lib/i18n-options';
import {
  formatPrice,
  scoreToPercent,
  accidentTypeToPercent,
  parseEngineSmokeField,
  Car,
} from '@/types';
import { ConditionScoreBar } from '@/components/cars/ConditionScoreBar';
import { AiPriceLabelBadge } from '@/components/cars/AiPriceLabelBadge';
import {
  Heart, GitCompare, Fuel, Zap, Shield, Star, Eye, Users,
  Gauge, Settings, Ruler, Package, ChevronLeft, CheckCircle2,
  Calendar, Pencil, Trash2, ZoomIn
} from 'lucide-react';
import { clsx } from 'clsx';
import { resolveCarImagesUrl, resolveCarImageUrl } from '@/lib/image-url';
import { ImageLightbox } from '@/components/ui/ImageLightbox';
import { CarCard } from '@/components/cars/CarCard';
import { useAuthStore } from '@/lib/auth-store';

export default function CarDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const locale = useLocale();
  const t = useTranslations('common');
  const td = useTranslations('carDetail');
  const {
    getCategoryLabel,
    getConditionLabel,
    getEngineTypeLabel,
    getTransmissionLabel,
    getDriveTypeLabel,
    getColorLabel,
    getAccidentHistoryLabel,
  } = useOptionLabels();

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

  const { addCar, removeCar, isSelected, selectedCars } = useCompareStore();
  const { toggle, isFavorite } = useFavoritesStore();
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  useEffect(() => {
    setSelectedImageIndex(0);
    setLightboxOpen(false);
  }, [id]);

  if (isLoading) return <DetailSkeleton />;
  if (!car) return <div className="text-center py-20 text-white">{t('notFound')}</div>;

  const allImages: string[] = [];
  const mainImage = resolveCarImageUrl(car.imageUrl);
  if (mainImage) allImages.push(mainImage);
  for (const url of resolveCarImagesUrl(car.images) ?? []) {
    if (url && !allImages.includes(url)) allImages.push(url);
  }
  const activeImage = allImages[selectedImageIndex] ?? allImages[0];

  const selected = isSelected(car._id);
  const favorite = isFavorite(car._id);
  const dash = '—';

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
    {
      icon: Gauge,
      label: td('horsepowerLabel'),
      value: car.horsepower ? t('horsepower', { hp: String(car.horsepower) }) : dash,
      color: 'text-primary-400',
    },
    {
      icon: Zap,
      label: t('torque'),
      value: car.torque ? td('torqueValue', { value: String(car.torque) }) : dash,
      color: 'text-amber-400',
    },
    {
      icon: Gauge,
      label: td('accelerationLabel'),
      value: car.acceleration ? td('accelerationValue', { value: String(car.acceleration) }) : dash,
      color: 'text-blue-400',
    },
    {
      icon: Gauge,
      label: t('topSpeed'),
      value: car.topSpeed ? td('topSpeedValue', { value: String(car.topSpeed) }) : dash,
      color: 'text-emerald-400',
    },
    {
      icon: Fuel,
      label: td('fuelConsumptionLabel'),
      value:
        car.engineType === 'electric'
          ? getEngineTypeLabel('electric')
          : car.fuelConsumption
            ? td('fuelConsumptionValue', { value: String(car.fuelConsumption) })
            : dash,
      color: 'text-green-400',
    },
    {
      icon: Users,
      label: td('seatingLabel'),
      value: car.seatingCapacity ? t('seats', { count: car.seatingCapacity }) : dash,
      color: 'text-purple-400',
    },
    {
      icon: Package,
      label: t('cargoVolume'),
      value: car.cargoVolume ? td('cargoValue', { value: String(car.cargoVolume) }) : dash,
      color: 'text-cyan-400',
    },
    {
      icon: Ruler,
      label: t('weight'),
      value: car.weight ? td('weightValue', { value: car.weight.toLocaleString(locale) }) : dash,
      color: 'text-rose-400',
    },
  ];

  const transmissionLabel = car.transmission
    ? getTransmissionLabel(car.transmission)
    : dash;
  const driveLabel = car.driveType ? getDriveTypeLabel(car.driveType) : dash;
  const colorLabel = car.color ? getColorLabel(car.color) : dash;

  return (
    <div className="min-h-screen py-8 bg-dark-950">
      <div className="page-container">
        <nav className="flex items-center gap-2 text-sm text-slate-500 mb-6">
          <Link href="/" className="hover:text-white transition-colors">{t('home')}</Link>
          <ChevronLeft className="w-4 h-4" />
          <Link href="/cars" className="hover:text-white transition-colors">{t('cars')}</Link>
          <ChevronLeft className="w-4 h-4" />
          <span className="text-slate-300">{car.brand} {car.model}</span>
        </nav>

        <div className="space-y-8 mb-12">
          <section className="space-y-3 max-w-4xl mx-auto w-full">
            <button
              type="button"
              onClick={() => activeImage && setLightboxOpen(true)}
              disabled={!activeImage}
              className={clsx(
                'relative aspect-[16/10] w-full rounded-2xl overflow-hidden bg-dark-900 border border-dark-800 text-right block',
                activeImage && 'cursor-zoom-in group',
              )}
              aria-label={td('viewFullImage')}
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
                    {td('clickToZoom')}
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
                aria-label={td('galleryAria')}
              >
                {allImages.map((src, index) => {
                  const isActive = index === selectedImageIndex;
                  return (
                    <button
                      key={src}
                      type="button"
                      role="listitem"
                      aria-label={t('imageAlt', { n: index + 1 })}
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
                      <span className="text-slate-500">
                        ({td('reviewsCount', { count: car.reviewsCount })})
                      </span>
                    </span>
                  )}
                  <span className="flex items-center gap-1.5 text-sm text-slate-500">
                    <Eye className="w-4 h-4" />
                    {td('viewsCount', { count: car.views.toLocaleString(locale) })}
                  </span>
                </div>
              </div>

              <div className="card p-5 lg:min-w-[240px] shrink-0 space-y-3">
                <div>
                  <p className="text-slate-400 text-sm mb-1">{t('price')}</p>
                  <p className="text-3xl sm:text-4xl font-black text-primary-400">
                    {formatPrice(car.price, car.currency)}
                  </p>
                  {car.condition !== 'new' && car.mileage != null && car.mileage > 0 && (
                    <p className="text-slate-500 text-sm mt-1">
                      {car.mileage.toLocaleString(locale)} {t('km')}
                    </p>
                  )}
                </div>
                <AiPriceLabelBadge car={car} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { label: t('engineType'), value: getEngineTypeLabel(car.engineType), icon: '⚙️' },
                { label: t('transmission'), value: transmissionLabel, icon: '⚡' },
                { label: t('driveType'), value: driveLabel, icon: '🔄' },
                { label: t('color'), value: colorLabel, icon: '🎨' },
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
                  {td('conditionExtraTitle')}
                </h3>
                <div className="space-y-4">
                  {car.mileage != null && car.mileage >= 0 && (
                    <div className="flex justify-between gap-2 text-sm pb-2 border-b border-dark-800/80">
                      <span className="text-slate-400">{t('mileage')}</span>
                      <span className="text-white font-semibold">
                        {car.mileage.toLocaleString(locale)} {t('km')}
                      </span>
                    </div>
                  )}
                  {scoreToPercent(car.motorCondition) != null && (
                    <ConditionScoreBar label={t('motor')} percent={scoreToPercent(car.motorCondition)!} />
                  )}
                  {scoreToPercent(car.electricalCondition) != null && (
                    <ConditionScoreBar label={t('electrical')} percent={scoreToPercent(car.electricalCondition)!} />
                  )}
                  {scoreToPercent(car.oilCondition) != null && (
                    <ConditionScoreBar label={t('oil')} percent={scoreToPercent(car.oilCondition)!} />
                  )}
                  {(() => {
                    const smoke = parseEngineSmokeField(car.engineSmokeLevel, car.isEngineSmoking);
                    const smokePct = scoreToPercent(smoke);
                    if (smokePct == null) return null;
                    return (
                      <ConditionScoreBar
                        label={t('engineSmokeField')}
                        percent={smokePct}
                        subtitle={smokePct >= 50 ? t('yes') : t('no')}
                        higherIsBetter={false}
                      />
                    );
                  })()}
                  {scoreToPercent(car.chassisCondition) != null && (
                    <ConditionScoreBar label={t('chassis')} percent={scoreToPercent(car.chassisCondition)!} />
                  )}
                  {(() => {
                    const accPct =
                      accidentTypeToPercent(car.accidentHistoryType) ??
                      scoreToPercent(car.accidentHistoryLevel);
                    if (accPct == null) return null;
                    return (
                      <ConditionScoreBar
                        label={t('accidentField')}
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
                    <ConditionScoreBar label={t('tires')} percent={scoreToPercent(car.tiresCondition)!} />
                  )}
                </div>
              </div>
            )}

            {isAdmin && (
              <div className="flex flex-wrap gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/25">
                <Link
                  href={`/admin/cars/${car._id}/edit`}
                  className="flex-1 min-w-[120px] flex items-center justify-center gap-2 py-2.5 rounded-xl bg-dark-800 border border-amber-500/30 text-amber-400 text-sm font-medium hover:bg-amber-500/10 transition-colors"
                >
                  <Pencil className="w-4 h-4" />
                  {td('adminEdit')}
                </Link>
                <button
                  type="button"
                  onClick={async () => {
                    if (!confirm(t('confirmDeleteCar', { brand: car.brand, model: car.model }))) return;
                    try {
                      await carsApi.delete(car._id);
                      queryClient.invalidateQueries({ queryKey: ['cars'] });
                      router.push('/cars');
                    } catch {
                      alert(t('deleteFailed'));
                    }
                  }}
                  className="flex-1 min-w-[120px] flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 text-sm font-medium hover:bg-red-500/25 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  {t('delete')}
                </button>
              </div>
            )}

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
                  {favorite ? t('inFavorites') : t('addToFavorites')}
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
                  {selected ? t('inCompare') : t('addToCompare')}
                </button>
              </div>
              <Link href="/compare" className="btn-primary flex items-center justify-center gap-2 py-3">
                {t('compareNow')}
              </Link>
            </div>
          </section>
        </div>

        <section className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <Settings className="w-6 h-6 text-primary-400" />
            {td('specsTitle')}
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

        <section className="mb-12 grid md:grid-cols-3 gap-6">
          {[
            { title: t('safetyFeatures'), items: car.safetyFeatures, icon: Shield, color: 'text-emerald-400' },
            { title: t('techFeatures'), items: car.techFeatures, icon: Zap, color: 'text-blue-400' },
            { title: t('comfortFeatures'), items: car.comfortFeatures, icon: Settings, color: 'text-amber-400' },
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

        {similarCars && (similarCars as Car[]).length > 0 && (
          <section>
            <h2 className="text-2xl font-bold text-white mb-6">{td('similarTitle')}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              {(similarCars as Car[]).slice(0, 4).map((c) => <CarCard key={c._id} car={c} />)}
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
