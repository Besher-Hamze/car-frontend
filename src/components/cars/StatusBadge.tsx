'use client';

import clsx from 'clsx';
import { CheckCircle2, Clock, XCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';

export type CarStatus = 'pending' | 'published' | 'rejected' | undefined | null;

const STATUS_CONFIG: Record<
  'pending' | 'published' | 'rejected',
  { className: string; icon: typeof Clock }
> = {
  pending: {
    className: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    icon: Clock,
  },
  published: {
    className: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    icon: CheckCircle2,
  },
  rejected: {
    className: 'bg-red-500/15 text-red-300 border-red-500/30',
    icon: XCircle,
  },
};

export function StatusBadge({
  status,
  className,
}: {
  status: CarStatus;
  className?: string;
}) {
  const t = useTranslations('options.status');
  /** Legacy/admin-created cars without an explicit status are shown as published. */
  const key = (status ?? 'published') as keyof typeof STATUS_CONFIG;
  const cfg = STATUS_CONFIG[key] ?? STATUS_CONFIG.published;
  const Icon = cfg.icon;
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px] font-medium',
        cfg.className,
        className,
      )}
    >
      <Icon className="w-3 h-3" />
      {t(key)}
    </span>
  );
}
