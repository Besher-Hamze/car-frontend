export interface Car {
  _id: string;
  brand: string;
  model: string;
  year: number;
  price: number;
  currency: string;
  category: string;
  imageUrl?: string;
  images?: string[];
  documentUrls?: string[];
  engineType: string;
  engineDisplacement?: number;
  horsepower?: number;
  torque?: number;
  cylinders?: number;
  transmission?: string;
  driveType?: string;
  acceleration?: number;
  topSpeed?: number;
  fuelConsumption?: number;
  fuelTankCapacity?: number;
  length?: number;
  width?: number;
  height?: number;
  wheelbase?: number;
  weight?: number;
  seatingCapacity?: number;
  cargoVolume?: number;
  safetyRating?: number;
  safetyFeatures?: string[];
  techFeatures?: string[];
  comfortFeatures?: string[];
  condition: string;
  mileage?: number;
  /** موتور */
  motorCondition?: string;
  /** حالة الكهرباء */
  electricalCondition?: string;
  /** زيت */
  oilCondition?: string;
  /** مبخوخة — 0–100 كنص */
  engineSmokeLevel?: string;
  /** شاسيه — 0–100 كنص */
  chassisCondition?: string;
  /** قصة / نص قصة — قديم */
  accidentHistoryType?: 'full_cut' | 'half_cut' | 'none' | string;
  /** قصة / نص قصة — 0–100 كنص */
  accidentHistoryLevel?: string;
  /** حالة الدواليب — 0–100 كنص */
  tiresCondition?: string;
  /** قديم: مبخوخة كمنطق */
  isEngineSmoking?: boolean;
  color?: string;
  interiorColor?: string;
  /** وارد السيارة — gulf | american | korean | local | … */
  imported?: string;
  isAvailable: boolean;
  description?: string;
  views: number;
  rating: number;
  reviewsCount: number;
  /** Workflow status: pending = awaiting admin review, published = visible publicly. */
  status?: 'pending' | 'published' | 'rejected';
  /** Object id (string) of the seller who submitted the car (or admin-populated user object on /admin/pending). */
  sellerId?: string | { _id: string; name?: string; email?: string };
  rejectionReason?: string;
  /** تقييم السعر بالذكاء الاصطناعي */
  ai_lable_price?: 'very_cheap' | 'cheap' | 'fair' | 'expensive' | 'very_expensive' | string;
  ai_lable_price_ar?: string;
  ai_fair_price?: number;
  createdAt: string;
  updatedAt: string;
}

export interface SparePart {
  _id: string;
  name: string;
  nameAr: string;
  category: string;
  price: number;
  currency: string;
  partNumber?: string;
  brand: string;
  compatibleCarBrands: string[];
  compatibleModels?: string[];
  imageUrl?: string;
  description?: string;
  stock: number;
  isAvailable: boolean;
  warranty?: string;
  quality: string;
  rating: number;
  reviewsCount: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ComparisonResult {
  cars: Car[];
  comparison: ComparisonField[];
  scores: CarScore[];
  winner: CarScore;
}

export interface ComparisonField {
  key: string;
  labelAr: string;
  unit: string;
  category: string;
  lowerIsBetter: boolean;
  values: {
    carId: string;
    value: any;
    isBest: boolean;
  }[];
}

export interface CarScore {
  carId: string;
  brand: string;
  model: string;
  score: number;
}

export interface QueryParams {
  search?: string;
  brand?: string;
  category?: string;
  condition?: string;
  engineType?: string;
  transmission?: string;
  driveType?: string;
  color?: string;
  minPrice?: number;
  maxPrice?: number;
  minYear?: number;
  maxYear?: number;
  minHorsepower?: number;
  maxHorsepower?: number;
  minSeats?: number;
  minMileage?: number;
  maxMileage?: number;
  minMotorCondition?: string;
  minElectricalCondition?: string;
  minOilCondition?: string;
  minChassisCondition?: string;
  minTiresCondition?: string;
  engineSmokeLevel?: string;
  accidentHistoryType?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: string;
}

export const TRANSMISSIONS = [
  { value: 'automatic', labelAr: 'أوتوماتيك' },
  { value: 'manual', labelAr: 'يدوي' },
  { value: 'cvt', labelAr: 'CVT' },
];

export const DRIVE_TYPES = [
  { value: 'FWD', labelAr: 'FWD - دفع أمامي' },
  { value: 'RWD', labelAr: 'RWD - دفع خلفي' },
  { value: 'AWD', labelAr: 'AWD - دفع رباعي دائم' },
  { value: '4WD', labelAr: '4WD - دفع رباعي' },
];

/** قيم موحّدة لتقييم AI (مطابقة لـ spec_mapper) */
export const IMPORTED_OPTIONS = [
  { value: '', labelAr: '— غير محدد —' },
  { value: 'gulf', labelAr: 'خليجي' },
  { value: 'american', labelAr: 'أميركي' },
  { value: 'korean', labelAr: 'كوري' },
  { value: 'european', labelAr: 'أوروبي' },
  { value: 'japanese', labelAr: 'ياباني' },
  { value: 'chinese', labelAr: 'صيني' },
  { value: 'turkish', labelAr: 'تركي' },
  { value: 'local', labelAr: 'محلي / سوري' },
  { value: 'other', labelAr: 'أخرى' },
];

export const CAR_COLORS = [
  { value: '', labelAr: '— غير محدد —' },
  { value: 'white', labelAr: 'أبيض' },
  { value: 'black', labelAr: 'أسود' },
  { value: 'silver', labelAr: 'فضي' },
  { value: 'gray', labelAr: 'رمادي' },
  { value: 'navy', labelAr: 'كحلي' },
  { value: 'blue', labelAr: 'أزرق' },
  { value: 'red', labelAr: 'أحمر' },
  { value: 'beige', labelAr: 'بيج' },
  { value: 'brown', labelAr: 'بني' },
  { value: 'gold', labelAr: 'ذهبي' },
  { value: 'green', labelAr: 'أخضر' },
  { value: 'other', labelAr: 'أخرى' },
];

export const SCORE_STEPS: { value: string; labelAr: string }[] = [
  { value: '', labelAr: 'أي' },
  { value: '50', labelAr: '50% فأكثر' },
  { value: '60', labelAr: '60% فأكثر' },
  { value: '70', labelAr: '70% فأكثر' },
  { value: '80', labelAr: '80% فأكثر' },
  { value: '90', labelAr: '90% فأكثر' },
  { value: '100', labelAr: '100% فقط' },
];

export const CATEGORIES = [
  { value: 'sedan', labelAr: 'سيدان', icon: '🚗' },
  { value: 'suv', labelAr: 'SUV', icon: '🚙' },
  { value: 'truck', labelAr: 'بيك أب', icon: '🛻' },
  { value: 'coupe', labelAr: 'كوبيه', icon: '🏎️' },
  { value: 'hatchback', labelAr: 'هاتشباك', icon: '🚗' },
  { value: 'luxury', labelAr: 'فاخرة', icon: '✨' },
  { value: 'electric', labelAr: 'كهربائية', icon: '⚡' },
  { value: 'van', labelAr: 'فان', icon: '🚐' },
];

export const ENGINE_TYPES = [
  { value: 'gasoline', labelAr: 'بنزين' },
  { value: 'diesel', labelAr: 'ديزل' },
  { value: 'hybrid', labelAr: 'هجين' },
  { value: 'electric', labelAr: 'كهربائي' },
];

export const CONDITIONS = [
  { value: 'new', labelAr: 'جديد' },
  { value: 'used', labelAr: 'مستعمل' },
  { value: 'certified', labelAr: 'مُعتمد' },
];

export const ENGINE_SMOKE_OPTIONS = [
  { value: '', labelAr: '— بدون تحديد —' },
  { value: '0', labelAr: 'لا (0)' },
  { value: '100', labelAr: 'نعم (100)' },
];

export const ACCIDENT_HISTORY_OPTIONS = [
  { value: '', labelAr: '— بدون تحديد —' },
  { value: 'none', labelAr: 'بدون قص' },
  { value: 'half_cut', labelAr: 'نص قصة' },
  { value: 'full_cut', labelAr: 'قصة (كاملة)' },
];

const SCORE_RE = /^(0|10|20|30|40|50|60|70|80|90|100)$/;

/** تهيئة المنزلق من قيمة قديمة أو نص 0–100 */
export function parseScoreField(raw: string | undefined): string {
  if (raw == null || raw === '') return '';
  if (SCORE_RE.test(raw)) return raw;
  const legacy = { excellent: '100', good: '70', fair: '40', poor: '10' } as Record<string, string>;
  return legacy[raw] ?? '';
}

/** قيمة القائمة: قصة / نص قصة / بدون قص */
export function parseAccidentHistoryDropdown(
  type: string | undefined,
  level: string | undefined,
): '' | 'none' | 'half_cut' | 'full_cut' {
  if (type === 'none' || type === 'half_cut' || type === 'full_cut') return type;
  if (level != null && SCORE_RE.test(level)) {
    const n = parseInt(level, 10);
    if (n <= 33) return 'none';
    if (n <= 66) return 'half_cut';
    return 'full_cut';
  }
  return '';
}

/** مبخوخة: فقط "0" أو "100" للقائمة */
export function parseEngineSmokeDropdown(
  level: string | undefined,
  legacyBool: boolean | undefined,
): '' | '0' | '100' {
  const raw = parseEngineSmokeField(level, legacyBool);
  if (raw === '0' || raw === '100') return raw;
  if (raw === '') return '';
  const n = parseInt(raw, 10);
  if (Number.isFinite(n)) return n >= 50 ? '100' : '0';
  return '';
}

export function parseEngineSmokeField(
  level: string | undefined,
  legacyBool: boolean | undefined,
): string {
  if (level != null && SCORE_RE.test(level)) return level;
  if (legacyBool === true) return '100';
  if (legacyBool === false) return '0';
  return '';
}

const LEGACY_CONDITION: Record<string, string> = {
  excellent: '100',
  good: '70',
  fair: '40',
  poor: '10',
};

/** تحويل قيم قديمة (excellent/…) أو نص رقمي إلى نسبة للعرض */
export function normalizeConditionScore(value: string | undefined): string {
  if (value == null || value === '') return '—';
  if (SCORE_RE.test(value)) return `${value}%`;
  if (LEGACY_CONDITION[value]) return `${LEGACY_CONDITION[value]}%`;
  return value;
}

/** Parse stored condition value to 0–100 for progress bars. */
export function scoreToPercent(value: string | undefined): number | null {
  if (value == null || value === '') return null;
  if (SCORE_RE.test(value)) return parseInt(value, 10);
  if (LEGACY_CONDITION[value]) return parseInt(LEGACY_CONDITION[value], 10);
  return null;
}

/** Map accident history dropdown to a display percent (higher = less damage). */
export function accidentTypeToPercent(type: string | undefined): number | null {
  if (type === 'none') return 100;
  if (type === 'half_cut') return 50;
  if (type === 'full_cut') return 0;
  return null;
}

export function getAccidentHistoryLabel(value: string | undefined): string {
  if (value == null || value === '') return '—';
  if (value === 'full_cut') return 'قصة (كاملة)';
  if (value === 'half_cut') return 'نص قصة';
  if (value === 'none') return 'بدون قص';
  return value;
}

/** منزلق 0–100: تفسير عربي تقريبي للقص */
export function accidentLevelToLabel(score: string | undefined): string {
  if (score == null || score === '') return '—';
  const n = parseInt(score, 10);
  if (!Number.isFinite(n)) return score;
  if (n <= 33) return 'بدون قص';
  if (n <= 66) return 'نص قصة';
  return 'قصة (كاملة)';
}

export const SPARE_PART_CATEGORIES = [
  { value: 'engine', labelAr: 'المحرك', icon: '⚙️' },
  { value: 'brakes', labelAr: 'الفرامل', icon: '🛑' },
  { value: 'suspension', labelAr: 'نوابض السيارة', icon: '🔧' },
  { value: 'electrical', labelAr: 'الكهرباء', icon: '⚡' },
  { value: 'body', labelAr: 'الهيكل', icon: '🚗' },
  { value: 'interior', labelAr: 'الداخلية', icon: '💺' },
  { value: 'filters', labelAr: 'الفلاتر', icon: '🔵' },
];

/** Always displays amounts in USD. The second argument is ignored (kept for call-site compatibility). */
export function formatPrice(price: number, _currency?: string): string {
  const n = Number(price);
  if (!Number.isFinite(n)) {
    return '—';
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(n);
}

const LEGACY_CATEGORY_LABELS: Record<string, string> = {
  sports: 'كوبيه',
  taxi: 'هاتشباك',
};

export function getCategoryLabel(value: string): string {
  if (LEGACY_CATEGORY_LABELS[value]) return LEGACY_CATEGORY_LABELS[value];
  return CATEGORIES.find(c => c.value === value)?.labelAr || value;
}

export function getEngineTypeLabel(value: string): string {
  return ENGINE_TYPES.find(e => e.value === value)?.labelAr || value;
}

export function getConditionLabel(value: string): string {
  return CONDITIONS.find(c => c.value === value)?.labelAr || value;
}
