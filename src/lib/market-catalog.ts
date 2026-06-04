export type CatalogModelSpec = {
  category: string;
  year_ref: number;
  hp: number;
  cc: number;
  trans: string;
  base: number;
  count: number;
  min_year: number;
  max_year: number;
  by_year?: Record<string, number>;
};

export type MarketCatalogFull = Record<string, Record<string, CatalogModelSpec>>;

export function catalogBrandList(catalog: MarketCatalogFull): string[] {
  return Object.keys(catalog).sort((a, b) => a.localeCompare(b, 'ar'));
}

export function catalogModelList(catalog: MarketCatalogFull, brand: string): string[] {
  return Object.keys(catalog[brand] || {}).sort((a, b) => a.localeCompare(b, 'ar'));
}

export function findCatalogBrand(catalog: MarketCatalogFull, input: string): string | null {
  const q = input.trim().toLowerCase();
  if (!q) return null;
  return Object.keys(catalog).find((b) => b.toLowerCase() === q) ?? null;
}

export function findCatalogModel(
  catalog: MarketCatalogFull,
  brand: string,
  input: string,
): string | null {
  const models = catalog[brand];
  if (!models) return null;
  const q = input.trim().toLowerCase();
  if (!q) return null;
  return Object.keys(models).find((m) => m.toLowerCase() === q) ?? null;
}

export function getCatalogSpec(
  catalog: MarketCatalogFull,
  brand: string,
  model: string,
): CatalogModelSpec | null {
  const brandKey = findCatalogBrand(catalog, brand);
  if (!brandKey) return null;
  const modelKey = findCatalogModel(catalog, brandKey, model);
  if (!modelKey) return null;
  return catalog[brandKey][modelKey] ?? null;
}

export function getYearMarketPrice(spec: CatalogModelSpec, year: number): number | null {
  if (!spec.by_year) return spec.base ?? null;
  const y = String(year);
  if (spec.by_year[y] !== undefined) return spec.by_year[y];
  const years = Object.keys(spec.by_year).map(Number).sort((a, b) => a - b);
  if (!years.length) return spec.base ?? null;
  const lower = years.filter((yr) => yr <= year);
  const upper = years.filter((yr) => yr >= year);
  if (lower.length && upper.length) {
    const y1 = Math.max(...lower);
    const y2 = Math.min(...upper);
    const p1 = spec.by_year[String(y1)];
    const p2 = spec.by_year[String(y2)];
    if (y1 === y2) return p1;
    const t = (year - y1) / (y2 - y1);
    return Math.round(p1 + t * (p2 - p1));
  }
  if (lower.length) {
    const y1 = Math.max(...lower);
    return Math.max(500, spec.by_year[String(y1)] - (y1 - year) * 120);
  }
  const y2 = Math.min(...upper);
  return spec.by_year[String(y2)] + (year - y2) * 100;
}
