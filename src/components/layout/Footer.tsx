'use client';

import { Link } from '@/i18n/navigation';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Phone, Mail, MapPin, Instagram, Facebook, Youtube } from 'lucide-react';

const SOCIAL_LINKS = [
  { href: 'https://instagram.com', label: 'Instagram', icon: Instagram },
  { href: 'https://facebook.com', label: 'Facebook', icon: Facebook },
  { href: 'https://youtube.com', label: 'YouTube', icon: Youtube },
];

export function Footer() {
  const t = useTranslations('common');

  const quickLinks = [
    { href: '/cars', label: t('browseCars') },
    { href: '/compare', label: t('compareCars') },
    { href: '/cars?sort=aiMatch-asc', label: t('filterByAi') },
    { href: '/cars?condition=used', label: t('usedCars') },
    { href: '/cars?engineType=electric', label: t('electricCars') },
  ];

  return (
    <footer className="bg-dark-900 border-t border-dark-800 mt-20">
      <div className="page-container py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="relative w-11 h-11 rounded-xl bg-white/95 flex items-center justify-center overflow-hidden p-1 shadow-lg shadow-black/20">
                <Image src="/autoarabia.png" alt="AutoArabia" width={40} height={40} className="object-contain" />
              </div>
              <span className="font-display font-bold text-xl text-white">AutoArabia</span>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed max-w-xs">{t('footerDesc')}</p>
            <div className="flex gap-3 mt-4">
              {SOCIAL_LINKS.map(({ href, label, icon: Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="w-10 h-10 rounded-lg bg-dark-800 border border-dark-700 flex items-center justify-center text-slate-400 hover:text-primary-400 hover:border-primary-500/40 hover:bg-dark-700 transition-all"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">{t('quickLinks')}</h3>
            <ul className="space-y-2">
              {quickLinks.map(({ href, label }) => (
                <li key={href}>
                  <Link href={href} className="text-slate-400 hover:text-primary-400 text-sm transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">{t('contactUs')}</h3>
            <ul className="space-y-3">
              {[
                { icon: Phone, text: '+966 50 000 0000' },
                { icon: Mail, text: 'info@autoarabia.sa' },
                { icon: MapPin, text: t('contactLocation') },
              ].map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-center gap-2 text-slate-400 text-sm">
                  <Icon className="w-4 h-4 text-primary-500 flex-shrink-0" />
                  <span>{text}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-dark-800 mt-10 pt-6 flex flex-col md:flex-row items-center justify-between gap-3">
          <p className="text-slate-500 text-sm">{t('allRights')}</p>
          <div className="flex gap-4 text-sm text-slate-500">
            <span className="hover:text-slate-300 cursor-pointer transition-colors">{t('privacy')}</span>
            <span className="hover:text-slate-300 cursor-pointer transition-colors">{t('terms')}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
