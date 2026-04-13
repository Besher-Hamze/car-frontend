'use client';
import { SparePart, formatPrice } from '../../types';
import { Star, Package, Shield } from 'lucide-react';
import { clsx } from 'clsx';

interface SparePartCardProps {
  part: SparePart;
}

export function SparePartCard({ part }: SparePartCardProps) {
  const qualityColor = {
    original: 'badge-green',
    oem: 'badge-blue',
    aftermarket: 'badge-orange',
  }[part.quality] || 'badge-orange';

  const qualityLabel = {
    original: 'أصلي',
    oem: 'OEM',
    aftermarket: 'بديل',
  }[part.quality] || part.quality;

  return (
    <div className="card-hover p-4 flex flex-col gap-3">
      {/* Image */}
      <div className="h-28 rounded-xl bg-dark-900 flex items-center justify-center text-4xl overflow-hidden relative">
        {part.imageUrl ? (
          <img src={part.imageUrl} alt={part.nameAr} className="w-full h-full object-cover" />
        ) : (
          <Package className="w-10 h-10 text-dark-600" />
        )}
        <div className="absolute top-2 left-2">
          <span className={clsx('badge text-[10px]', qualityColor)}>{qualityLabel}</span>
        </div>
      </div>

      {/* Info */}
      <div>
        <h3 className="text-white font-semibold text-sm leading-tight">{part.nameAr}</h3>
        <p className="text-slate-500 text-xs mt-0.5">{part.name} • {part.brand}</p>
      </div>

      {/* Stock */}
      <div className="flex items-center gap-2 text-xs">
        <div className={clsx('w-2 h-2 rounded-full', part.stock > 0 ? 'bg-emerald-400' : 'bg-red-400')} />
        <span className={part.stock > 0 ? 'text-emerald-400' : 'text-red-400'}>
          {part.stock > 0 ? `متوفر (${part.stock})` : 'غير متوفر'}
        </span>
        {part.warranty && (
          <span className="flex items-center gap-1 text-slate-500 mr-auto">
            <Shield className="w-3 h-3" />{part.warranty}
          </span>
        )}
      </div>

      {/* Price + Rating */}
      <div className="flex items-center justify-between pt-2 border-t border-dark-700">
        <span className="text-primary-400 font-bold">{formatPrice(part.price, part.currency)}</span>
        {part.rating > 0 && (
          <span className="flex items-center gap-1 text-xs text-slate-400">
            <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            {part.rating}
          </span>
        )}
      </div>
    </div>
  );
}
