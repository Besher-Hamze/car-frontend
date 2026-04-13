'use client';
import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import Image from 'next/image';
import Link from 'next/link';
import { comparisonApi, carsApi } from '../../lib/api';
import { useCompareStore } from '../../lib/store';
import { formatPrice, ComparisonResult } from '../../types';
import { resolveCarImageUrl } from '../../lib/image-url';
import {
  Scale, X, Plus, Trophy, TrendingUp, TrendingDown, Minus,
  CheckCircle2, XCircle, Car, ChevronLeft
} from 'lucide-react';
import { clsx } from 'clsx';

export default function ComparePage() {
  const { selectedCars, removeCar, clearAll } = useCompareStore();
  const [result, setResult] = useState<ComparisonResult | null>(null);

  const compareMutation = useMutation({
    mutationFn: (carIds: string[]) => comparisonApi.compare(carIds).then(r => r.data),
    onSuccess: (data) => setResult(data),
  });

  const handleCompare = () => {
    if (selectedCars.length >= 2) {
      compareMutation.mutate(selectedCars.map(c => c._id));
    }
  };

  return (
    <div className="min-h-screen py-8 bg-dark-950">
      <div className="page-container">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-4">
            <Link href="/" className="hover:text-white">الرئيسية</Link>
            <ChevronLeft className="w-4 h-4" />
            <span className="text-slate-300">مقارنة السيارات</span>
          </div>
          <div className="flex items-end justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">مقارنة السيارات</h1>
              <p className="text-slate-400">اختر حتى 4 سيارات لمقارنة مواصفاتها</p>
            </div>
            {selectedCars.length > 0 && (
              <button onClick={clearAll} className="flex items-center gap-2 text-red-400 hover:text-red-300 text-sm transition-colors">
                <X className="w-4 h-4" />
                مسح الكل
              </button>
            )}
          </div>
        </div>

        {/* Selected Cars Slots */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {Array.from({ length: 4 }).map((_, i) => {
            const car = selectedCars[i];
            const slotImg = car ? resolveCarImageUrl(car.imageUrl) : null;
            return (
              <div key={i} className={clsx(
                'card p-4 flex flex-col items-center gap-3 min-h-[180px] justify-center',
                car ? 'border-dark-600' : 'border-dashed border-dark-700 hover:border-dark-600'
              )}>
                {car ? (
                  <>
                    <div className="relative w-full h-24 rounded-xl overflow-hidden bg-dark-900">
                      {slotImg ? (
                        <Image src={slotImg} alt={car.model} fill className="object-cover" sizes="200px" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-4xl">🚗</div>
                      )}
                    </div>
                    <div className="text-center">
                      <p className="text-slate-400 text-xs">{car.brand}</p>
                      <p className="text-white font-semibold">{car.model}</p>
                      <p className="text-primary-400 text-sm font-bold">{formatPrice(car.price, car.currency)}</p>
                    </div>
                    <button
                      onClick={() => removeCar(car._id)}
                      className="absolute top-3 left-3 w-7 h-7 rounded-full bg-dark-900/80 text-slate-400 hover:text-red-400 flex items-center justify-center transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <>
                    <div className="w-12 h-12 rounded-2xl bg-dark-800 flex items-center justify-center">
                      <Plus className="w-6 h-6 text-dark-500" />
                    </div>
                    <p className="text-slate-600 text-sm text-center">أضف سيارة من<br />
                      <Link href="/cars" className="text-primary-500 hover:text-primary-400">قائمة السيارات</Link>
                    </p>
                  </>
                )}
              </div>
            );
          })}
        </div>

        {/* Compare Button */}
        <div className="flex justify-center mb-10">
          <button
            onClick={handleCompare}
            disabled={selectedCars.length < 2 || compareMutation.isPending}
            className="btn-primary px-10 py-4 text-lg flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Scale className="w-6 h-6" />
            {compareMutation.isPending ? 'جاري المقارنة...' : 'قارن الآن'}
          </button>
        </div>

        {/* Results */}
        {result && (
          <div className="space-y-8">
            {/* Winner Banner */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-500/20 to-primary-500/20 border border-amber-500/30 p-6">
              <Trophy className="absolute left-6 top-1/2 -translate-y-1/2 w-16 h-16 text-amber-500/20" />
              <div className="relative z-10">
                <p className="text-amber-400 text-sm font-medium mb-1">🏆 الفائز بالمقارنة</p>
                <h2 className="text-2xl font-bold text-white">
                  {result.winner.brand} {result.winner.model}
                </h2>
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex-1 bg-dark-900/60 rounded-full h-2 max-w-xs">
                    <div
                      className="h-2 rounded-full bg-gradient-to-r from-amber-500 to-primary-500"
                      style={{ width: `${result.winner.score}%` }}
                    />
                  </div>
                  <span className="text-amber-400 font-bold">{result.winner.score}%</span>
                </div>
              </div>
            </div>

            {/* Scores */}
            <div>
              <h3 className="text-xl font-bold text-white mb-4">النتائج الإجمالية</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {result.scores.map((score, i) => (
                  <div key={score.carId} className={clsx(
                    'card p-5 text-center',
                    i === 0 && 'border-amber-500/40 bg-amber-500/5'
                  )}>
                    {i === 0 && <Trophy className="w-5 h-5 text-amber-400 mx-auto mb-2" />}
                    <p className="text-slate-400 text-xs">{score.brand}</p>
                    <p className="text-white font-bold">{score.model}</p>
                    <div className="mt-3">
                      <p className={clsx('text-3xl font-black', i === 0 ? 'text-amber-400' : 'text-white')}>{score.score}%</p>
                    </div>
                    <div className="w-full bg-dark-700 rounded-full h-1.5 mt-2">
                      <div
                        className={clsx('h-1.5 rounded-full', i === 0 ? 'bg-amber-400' : 'bg-primary-500')}
                        style={{ width: `${score.score}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Comparison Table */}
            <div>
              <h3 className="text-xl font-bold text-white mb-4">جدول المقارنة التفصيلي</h3>
              <div className="card overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-dark-700">
                      <th className="text-right text-slate-400 text-sm font-medium p-4 min-w-[140px]">المعيار</th>
                      {result.cars.map(car => (
                        <th key={car._id} className="text-center p-4 min-w-[140px]">
                          <p className="text-slate-400 text-xs">{car.brand}</p>
                          <p className="text-white font-semibold">{car.model}</p>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {result.comparison.map((field, i) => (
                      <tr key={field.key} className={clsx('border-b border-dark-800/50', i % 2 === 0 && 'bg-dark-900/20')}>
                        <td className="p-4 text-slate-300 text-sm font-medium">{field.labelAr}</td>
                        {field.values.map((val, j) => (
                          <td key={j} className="p-4 text-center">
                            <div className={clsx(
                              'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold',
                              val.isBest
                                ? 'bg-emerald-500/15 text-emerald-400'
                                : 'text-slate-300'
                            )}>
                              {val.isBest && <CheckCircle2 className="w-3.5 h-3.5" />}
                              {val.value !== undefined && val.value !== null
                                ? `${typeof val.value === 'number' ? val.value.toLocaleString('ar') : val.value} ${field.unit}`
                                : '—'}
                            </div>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {selectedCars.length === 0 && !result && (
          <div className="text-center py-20">
            <Scale className="w-16 h-16 text-dark-600 mx-auto mb-4" />
            <h3 className="text-white text-xl font-semibold mb-2">ابدأ المقارنة</h3>
            <p className="text-slate-400 mb-6 max-w-sm mx-auto">
              أضف سيارتين أو أكثر من قائمة السيارات لبدء المقارنة
            </p>
            <Link href="/cars" className="btn-primary">
              استعرض السيارات
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
