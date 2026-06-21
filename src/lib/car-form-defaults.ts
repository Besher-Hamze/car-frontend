/** Defaults when condition is «new» — full option / perfect scores. */

export const NEW_CAR_CONDITION_FIELDS = {
  motorCondition: '100',
  electricalCondition: '100',
  oilCondition: '100',
  chassisCondition: '100',
  tiresCondition: '100',
  engineSmokeLevel: '0' as '' | '0' | '100',
  accidentHistoryType: 'none' as '' | 'none' | 'half_cut' | 'full_cut',
  mileageKm: 0 as number,
};

export const NEW_CAR_SPEC_FIELDS = {
  engineType: 'gasoline',
  transmission: 'automatic',
  driveType: 'AWD',
  seatingCapacity: 5,
  imported: 'local',
};

/** Infer cylinder count from displacement (cc). */
export function inferCylindersFromCc(cc: number): number {
  if (cc >= 3500) return 8;
  if (cc >= 2800) return 6;
  return 4;
}

export function isNewCondition(condition: string | undefined | null): boolean {
  return (condition || '').toLowerCase() === 'new';
}

/** Merge full-option defaults for a new car listing. */
export function applyNewCarFullOption<T extends Record<string, unknown>>(form: T): T {
  return {
    ...form,
    condition: 'new',
    ...NEW_CAR_SPEC_FIELDS,
    ...NEW_CAR_CONDITION_FIELDS,
  };
}

/** Apply catalog cc/hp/trans plus cylinders when condition is new. */
export function applyCatalogToNewCar<T extends Record<string, unknown>>(
  form: T,
  spec: { category?: string; cc?: number; hp?: number; trans?: string; year_ref?: number },
  fillYear = false,
): T {
  const next = { ...form } as Record<string, unknown>;
  if (spec.category) next.category = spec.category;
  if (spec.cc != null) {
    next.engineDisplacement = spec.cc;
    next.cylinders = inferCylindersFromCc(spec.cc);
  }
  if (spec.hp != null) next.horsepower = spec.hp;
  if (spec.trans) next.transmission = spec.trans;
  if (fillYear && spec.year_ref != null) next.year = spec.year_ref;
  if (isNewCondition(String(next.condition ?? 'new'))) {
    Object.assign(next, NEW_CAR_SPEC_FIELDS, NEW_CAR_CONDITION_FIELDS);
    next.condition = 'new';
  }
  return next as T;
}
