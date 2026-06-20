'use client';

import { useTranslations } from 'next-intl';
import {
  CATEGORIES,
  CONDITIONS,
  TRANSMISSIONS,
  DRIVE_TYPES,
  ENGINE_TYPES,
  IMPORTED_OPTIONS,
  CAR_COLORS,
  SCORE_STEPS,
  ENGINE_SMOKE_OPTIONS,
  ACCIDENT_HISTORY_OPTIONS,
  SPARE_PART_CATEGORIES,
} from '@/types';

const LEGACY_CATEGORY_KEYS: Record<string, string> = {
  sports: 'coupe',
  taxi: 'hatchback',
};

/** Translated labels for form filters and display helpers. */
export function useOptionLabels() {
  const t = useTranslations('options');

  const getCategoryLabel = (value: string) => {
    const key = LEGACY_CATEGORY_KEYS[value] ?? value;
    return t.has(`categories.${key}`) ? t(`categories.${key}`) : value;
  };

  const getEngineTypeLabel = (value: string) =>
    t.has(`engineTypes.${value}`) ? t(`engineTypes.${value}`) : value;

  const getConditionLabel = (value: string) =>
    t.has(`conditions.${value}`) ? t(`conditions.${value}`) : value;

  const getTransmissionLabel = (value: string) =>
    t.has(`transmissions.${value}`) ? t(`transmissions.${value}`) : value;

  const getDriveTypeLabel = (value: string) =>
    t.has(`driveTypes.${value}`) ? t(`driveTypes.${value}`) : value;

  const getImportedLabel = (value: string) =>
    value === '' ? t('unspecified') : t.has(`imported.${value}`) ? t(`imported.${value}`) : value;

  const getColorLabel = (value: string) =>
    value === '' ? t('unspecified') : t.has(`colors.${value}`) ? t(`colors.${value}`) : value;

  const getAccidentHistoryLabel = (value: string | undefined) => {
    if (value == null || value === '') return '—';
    return t.has(`accidentHistory.${value}`) ? t(`accidentHistory.${value}`) : value;
  };

  const accidentLevelToLabel = (score: string | undefined) => {
    if (score == null || score === '') return '—';
    const n = parseInt(score, 10);
    if (!Number.isFinite(n)) return score;
    if (n <= 33) return t('accidentHistory.none');
    if (n <= 66) return t('accidentHistory.half_cut');
    return t('accidentHistory.full_cut');
  };

  const getAiPriceLabel = (key: string | undefined, fallbackAr?: string) => {
    if (key && t.has(`aiPrice.${key}`)) return t(`aiPrice.${key}`);
    return fallbackAr || key || '';
  };

  const mapOptions = <T extends { value: string }>(
    items: T[],
    ns: string,
    icon?: boolean,
  ) =>
    items.map((item) => ({
      ...item,
      label: t.has(`${ns}.${item.value}`) ? t(`${ns}.${item.value}`) : item.value,
    }));

  return {
    getCategoryLabel,
    getEngineTypeLabel,
    getConditionLabel,
    getTransmissionLabel,
    getDriveTypeLabel,
    getImportedLabel,
    getColorLabel,
    getAccidentHistoryLabel,
    accidentLevelToLabel,
    getAiPriceLabel,
    categories: CATEGORIES.map((c) => ({
      ...c,
      label: t(`categories.${c.value}`),
    })),
    conditions: mapOptions(CONDITIONS, 'conditions'),
    transmissions: mapOptions(TRANSMISSIONS, 'transmissions'),
    driveTypes: mapOptions(DRIVE_TYPES, 'driveTypes'),
    engineTypes: mapOptions(ENGINE_TYPES, 'engineTypes'),
    importedOptions: IMPORTED_OPTIONS.map((o) => ({
      ...o,
      label: o.value === '' ? t('unspecified') : t(`imported.${o.value}`),
    })),
    colors: CAR_COLORS.map((o) => ({
      ...o,
      label: o.value === '' ? t('unspecified') : t(`colors.${o.value}`),
    })),
    scoreSteps: SCORE_STEPS.map((o) => ({
      ...o,
      label: o.value === '' ? t('scoreSteps.any') : t(`scoreSteps.${o.value}`),
    })),
    engineSmokeOptions: ENGINE_SMOKE_OPTIONS.map((o) => ({
      ...o,
      label: o.value === '' ? t('unspecifiedShort') : t(`engineSmoke.${o.value}`),
    })),
    accidentHistoryOptions: ACCIDENT_HISTORY_OPTIONS.map((o) => ({
      ...o,
      label: o.value === '' ? t('unspecifiedShort') : t(`accidentHistory.${o.value}`),
    })),
    sparePartCategories: SPARE_PART_CATEGORIES.map((c) => ({
      ...c,
      label: t(`sparePartCategories.${c.value}`),
    })),
  };
}
