'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, XCircle, Loader2, AlertCircle } from 'lucide-react';
import { carsApi } from '../../lib/api';
import { Car } from '../../types';
import { StatusBadge } from '../cars/StatusBadge';

/** Admin-side actions for pending/rejected cars: publish or reject with a reason. */
export function ReviewActions({ car }: { car: Car }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const status = car.status ?? 'published';
  const [reason, setReason] = useState('');
  const [showRejectBox, setShowRejectBox] = useState(false);

  const publishMutation = useMutation({
    mutationFn: () => carsApi.publish(car._id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-cars'] });
      queryClient.invalidateQueries({ queryKey: ['admin-pending-cars'] });
      queryClient.invalidateQueries({ queryKey: ['admin-pending-count'] });
      queryClient.invalidateQueries({ queryKey: ['car', car._id] });
      router.push('/admin/cars');
      router.refresh();
    },
  });

  const rejectMutation = useMutation({
    mutationFn: () => carsApi.reject(car._id, reason.trim() || undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-cars'] });
      queryClient.invalidateQueries({ queryKey: ['admin-pending-cars'] });
      queryClient.invalidateQueries({ queryKey: ['admin-pending-count'] });
      queryClient.invalidateQueries({ queryKey: ['car', car._id] });
      setShowRejectBox(false);
      router.push('/admin/cars');
      router.refresh();
    },
  });

  /** Already-published cars don't get review actions; admins can still edit normally. */
  if (status === 'published') {
    return (
      <div className="card p-4 mb-4 flex items-center gap-3 border-emerald-500/20 bg-emerald-500/5">
        <StatusBadge status={status} />
        <p className="text-sm text-slate-300">السيارة منشورة على الموقع.</p>
      </div>
    );
  }

  return (
    <div className="card p-4 mb-4 space-y-3 border-amber-500/30 bg-amber-500/5">
      <div className="flex items-center gap-3 flex-wrap">
        <StatusBadge status={status} />
        <p className="text-sm text-slate-300">
          {status === 'pending'
            ? 'السيارة بانتظار المراجعة. أكمل التفاصيل التقنية أدناه ثم انشرها أو ارفضها.'
            : 'هذه السيارة مرفوضة حالياً. يمكنك تعديلها وإعادة نشرها.'}
        </p>
      </div>

      {status === 'rejected' && car.rejectionReason && (
        <div className="text-[12px] text-red-300 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 flex items-start gap-2">
          <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          <span>سبب الرفض السابق: {car.rejectionReason}</span>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => publishMutation.mutate()}
          disabled={publishMutation.isPending || rejectMutation.isPending}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/25 transition-colors disabled:opacity-50 text-sm font-medium"
        >
          {publishMutation.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <CheckCircle2 className="w-4 h-4" />
          )}
          نشر السيارة
        </button>
        <button
          type="button"
          onClick={() => setShowRejectBox((v) => !v)}
          disabled={publishMutation.isPending || rejectMutation.isPending}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 hover:bg-red-500/20 transition-colors disabled:opacity-50 text-sm font-medium"
        >
          <XCircle className="w-4 h-4" />
          رفض
        </button>
      </div>

      {showRejectBox && (
        <div className="space-y-2 pt-1">
          <label className="text-xs text-slate-400 block">سبب الرفض (اختياري)</label>
          <textarea
            className="input-field min-h-[80px]"
            placeholder="مثال: الصورة غير واضحة، يرجى رفع صورة أفضل."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => rejectMutation.mutate()}
              disabled={rejectMutation.isPending}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/15 border border-red-500/40 text-red-300 hover:bg-red-500/25 transition-colors disabled:opacity-50 text-sm font-medium"
            >
              {rejectMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
              تأكيد الرفض
            </button>
            <button
              type="button"
              onClick={() => setShowRejectBox(false)}
              className="px-4 py-2 rounded-xl border border-dark-600 text-slate-300 hover:bg-dark-800 transition-colors text-sm"
            >
              إلغاء
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
