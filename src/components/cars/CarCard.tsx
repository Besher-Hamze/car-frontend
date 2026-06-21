'use client';
import { Link, useRouter } from '@/i18n/navigation';
import Image from 'next/image';
import { GitCompare, Fuel, Zap, Users, Star, Eye, ShoppingCart } from 'lucide-react';
import { Car, formatPrice } from '../../types';
import { AiPriceLabelBadge } from './AiPriceLabelBadge';
import { resolveCarImageUrl } from '../../lib/image-url';
import { useCompareStore } from '../../lib/store';
import { clsx } from 'clsx';
import { useTranslations, useLocale } from 'next-intl';
import { useOptionLabels } from '@/lib/i18n-options';

interface CarCardProps {
  car: Car;
  onAddToCompare?: () => void;
}

const engineIcon = (type: string) => {
  if (type === 'electric') return <Zap className="w-3.5 h-3.5" />;
  return <Fuel className="w-3.5 h-3.5" />;
};

export function CarCard({ car }: CarCardProps) {
  const router = useRouter();
  const t = useTranslations('common');
  const tp = useTranslations('purchase');
  const locale = useLocale();
  const { getCategoryLabel, getEngineTypeLabel, getConditionLabel } = useOptionLabels();
  const { addCar, removeCar, isSelected, selectedCars } = useCompareStore();
  const selected = isSelected(car._id);
  const canAdd = selectedCars.length < 4 || selected;
  const canBuy = car.isAvailable !== false;

  const handleCompare = (e: React.MouseEvent) => {
    e.preventDefault();
    if (selected) removeCar(car._id);
    else if (canAdd) addCar(car);
  };

  const handleBuy = (e: React.MouseEvent) => {
    e.preventDefault();
    router.push(`/cars/${car._id}/purchase`);
  };

  const imgSrc = resolveCarImageUrl(car.imageUrl);

  return (
    <Link href={`/cars/${car._id}`} className="block group">
      <article className="card-hover h-full flex flex-col">
        {/* Image */}
        <div className="relative h-48 overflow-hidden car-image-zoom bg-dark-900">
          {imgSrc ? (
            <Image
              src={imgSrc}
              alt={`${car.brand} ${car.model}`}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-6xl bg-gradient-to-br from-dark-800 to-dark-900">
              🚗
            </div>
          )}

          {/* Overlay Actions */}
          <div className="absolute top-3 left-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            {canBuy && (
              <button
                type="button"
                onClick={handleBuy}
                title={tp('buy')}
                className="w-8 h-8 rounded-lg flex items-center justify-center backdrop-blur-sm transition-all bg-emerald-500/90 text-white hover:bg-emerald-400"
              >
                <ShoppingCart className="w-4 h-4" />
              </button>
            )}
            <button
              type="button"
              onClick={handleCompare}
              disabled={!canAdd && !selected}
              className={clsx(
                'w-8 h-8 rounded-lg flex items-center justify-center backdrop-blur-sm transition-all',
                selected
                  ? 'bg-primary-500 text-white'
                  : 'bg-dark-900/80 text-slate-400 hover:text-primary-400 disabled:opacity-40',
              )}
            >
              <GitCompare className="w-4 h-4" />
            </button>
          </div>

          {/* Condition Badge */}
          <div className="absolute top-3 right-3">
            <span className={clsx('badge text-[11px]',
              car.condition === 'new' ? 'badge-green' :
              car.condition === 'certified' ? 'badge-blue' : 'badge-orange'
            )}>
              {getConditionLabel(car.condition)}
            </span>
          </div>

          {/* Category */}
          <div className="absolute bottom-3 right-3">
            <span className="badge badge-orange text-[11px]">
              {getCategoryLabel(car.category)}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 flex flex-col flex-1 gap-3">
          {/* Brand & Model */}
          <div>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-slate-400 text-xs font-medium">{car.brand}</p>
                <h3 className="text-white font-bold text-lg leading-tight group-hover:text-primary-400 transition-colors">
                  {car.model}
                </h3>
              </div>
              <span className="text-slate-500 text-sm font-medium bg-dark-700 px-2 py-0.5 rounded-lg">
                {car.year}
              </span>
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { icon: engineIcon(car.engineType), label: getEngineTypeLabel(car.engineType) },
              { icon: <Users className="w-3.5 h-3.5" />, label: t('seats', { count: car.seatingCapacity || 5 }) },
              { icon: <Zap className="w-3.5 h-3.5" />, label: car.horsepower ? t('horsepower', { hp: car.horsepower }) : '—' },
            ].map(({ icon, label }, i) => (
              <div key={i} className="flex items-center gap-1 text-slate-400 text-xs">
                <span className="text-primary-500">{icon}</span>
                <span>{label}</span>
              </div>
            ))}
          </div>

          {/* Fuel Consumption */}
          {car.fuelConsumption && car.engineType !== 'electric' && (
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <Fuel className="w-3.5 h-3.5 text-emerald-500" />
              <span>
                {t('consumption', { value: car.fuelConsumption })}
              </span>
            </div>
          )}

          {/* Bottom */}
          <div className="flex items-center justify-between pt-2 border-t border-dark-700 mt-auto gap-2 flex-wrap">
            <div>
              <p className="text-primary-400 font-bold text-lg leading-tight">
                {formatPrice(car.price, car.currency)}
              </p>
              <AiPriceLabelBadge car={car} compact className="mt-1.5" />
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-500">
              {car.rating > 0 && (
                <span className="flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  <span className="text-slate-300">{car.rating}</span>
                </span>
              )}
              <span className="flex items-center gap-1">
                <Eye className="w-3.5 h-3.5" />
                {car.views.toLocaleString(locale)}
              </span>
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
}
