/**
 * ToolRoomOS Canonical Dimension Parser & Engineering Calculation Engine
 * 
 * Semantics:
 * 1. Cylindrical / Round:
 *    Pattern: ØD×L | DIA D×L | OD D×L
 *    - diameter = D (mm)
 *    - length   = L (mm)
 *    - Volume   = π × (D/2)² × L
 * 
 * 2. Rectangular:
 *    Pattern: L×W×H
 *    - length = L (mm)
 *    - width  = W (mm)
 *    - height = H (mm)
 *    - Volume = L × W × H
 * 
 * Unit Weight (kg) = (Volume in mm³ × Density in g/cm³) / 1,000,000
 */

export type DimensionType = 'RECTANGULAR' | 'ROUND' | 'UNKNOWN';

export interface ParsedDimension {
  type: DimensionType;
  isValid: boolean;
  rawValue: string;
  formatted: string; // e.g. "Ø48X70" or "80X50X14"

  // Round / Cylindrical fields: ØD × L
  diameter?: number;
  length?: number; // length in mm for both round and rectangular

  // Rectangular fields: L × W × H
  width?: number;
  height?: number;

  // 3-Column Display properties (L, W, H / Ø, D, L):
  displayL: string;          // "Ø" for round, String(L) for rectangular, or "-"
  displayW: string | number; // Diameter for round, Width for rectangular, or "-"
  displayH: string | number; // Length for round, Height for rectangular, or "-"
}

/**
 * Parses any dimension string or structured input into canonical dimension representation.
 */
export function parseDimension(sizeStr?: string | number | null): ParsedDimension {
  if (sizeStr === null || sizeStr === undefined) {
    return {
      type: 'UNKNOWN',
      isValid: false,
      rawValue: '',
      formatted: '-',
      displayL: '-',
      displayW: '-',
      displayH: '-',
    };
  }

  const raw = String(sizeStr).trim();
  if (!raw || raw === '-' || raw === 'N/A') {
    return {
      type: 'UNKNOWN',
      isValid: false,
      rawValue: raw,
      formatted: '-',
      displayL: '-',
      displayW: '-',
      displayH: '-',
    };
  }

  // 1. Check for Round / Cylindrical bar pattern
  // Indicators: 'Ø', 'dia', 'dia.', 'diameter', 'od', 'rd' or starting with 'D' followed by digits and 'x'
  const isExplicitRound =
    /^[Øø0O\s]*(dia|diameter|od|rd)/i.test(raw) ||
    /^[Øø]/i.test(raw) ||
    /\b(dia|diameter)\b/i.test(raw) ||
    /^[dD]\s*\d+[\s]*[xX×\*]/i.test(raw);

  if (isExplicitRound) {
    // Strip prefixes: 'Ø', 'dia.', 'dia', 'diameter', 'od', 'rd'
    let cleaned = raw
      .replace(/^[Øø0O\s]*(dia\.?|diameter|od|rd)[\s:-]*/i, '')
      .replace(/^[Øø\s:-]*/i, '')
      .replace(/^[dD]\s*(?=\d)/, '')
      .replace(/[\s]*mm/gi, '')
      .trim();

    const parts = cleaned.split(/[\s]*[xX×\*][\s]*/);
    const dMatch = parts[0]?.match(/([\d\.]+)/);
    const lMatch = parts[1]?.match(/([\d\.]+)/);

    const d = dMatch ? parseFloat(dMatch[1]) : NaN;
    const l = lMatch ? parseFloat(lMatch[1]) : NaN;

    const isValid = !isNaN(d) && !isNaN(l) && d > 0 && l > 0;

    if (!isValid) {
      return {
        type: 'ROUND',
        isValid: false,
        rawValue: raw,
        formatted: raw,
        displayL: 'Ø',
        displayW: !isNaN(d) && d > 0 ? d : '-',
        displayH: !isNaN(l) && l > 0 ? l : '-',
      };
    }

    return {
      type: 'ROUND',
      isValid: true,
      rawValue: raw,
      formatted: `Ø${d}X${l}`,
      diameter: d,
      length: l,
      displayL: 'Ø',
      displayW: d,
      displayH: l,
    };
  }

  // 2. Rectangular plate / block pattern: L × W × H
  const cleaned = raw.replace(/[\s]*mm/gi, '').trim();
  const parts = cleaned.split(/[\s]*[xX×\*][\s]*/);

  if (parts.length >= 3) {
    const lMatch = parts[0]?.match(/([\d\.]+)/);
    const wMatch = parts[1]?.match(/([\d\.]+)/);
    const hMatch = parts[2]?.match(/([\d\.]+)/);

    const l = lMatch ? parseFloat(lMatch[1]) : NaN;
    const w = wMatch ? parseFloat(wMatch[1]) : NaN;
    const h = hMatch ? parseFloat(hMatch[1]) : NaN;

    const isValid = !isNaN(l) && !isNaN(w) && !isNaN(h) && l > 0 && w > 0 && h > 0;

    if (!isValid) {
      return {
        type: 'RECTANGULAR',
        isValid: false,
        rawValue: raw,
        formatted: raw,
        displayL: !isNaN(l) && l > 0 ? String(l) : '-',
        displayW: !isNaN(w) && w > 0 ? w : '-',
        displayH: !isNaN(h) && h > 0 ? h : '-',
      };
    }

    return {
      type: 'RECTANGULAR',
      isValid: true,
      rawValue: raw,
      formatted: `${l}X${w}X${h}`,
      length: l,
      width: w,
      height: h,
      displayL: String(l),
      displayW: w,
      displayH: h,
    };
  }

  if (parts.length === 2) {
    const lMatch = parts[0]?.match(/([\d\.]+)/);
    const wMatch = parts[1]?.match(/([\d\.]+)/);

    const l = lMatch ? parseFloat(lMatch[1]) : NaN;
    const w = wMatch ? parseFloat(wMatch[1]) : NaN;

    const isValid = !isNaN(l) && !isNaN(w) && l > 0 && w > 0;

    return {
      type: 'RECTANGULAR',
      isValid,
      rawValue: raw,
      formatted: isValid ? `${l}X${w}` : raw,
      length: isValid ? l : undefined,
      width: isValid ? w : undefined,
      height: undefined,
      displayL: isValid ? String(l) : '-',
      displayW: isValid ? w : '-',
      displayH: '-',
    };
  }

  return {
    type: 'UNKNOWN',
    isValid: false,
    rawValue: raw,
    formatted: raw,
    displayL: raw,
    displayW: '-',
    displayH: '-',
  };
}

/**
 * Calculates theoretical volume in cubic millimeters (mm³).
 */
export function calculateVolume(dim: ParsedDimension): number {
  if (!dim || !dim.isValid) return 0;

  if (dim.type === 'ROUND' && dim.diameter && dim.length) {
    // Volume = π × (D/2)² × L
    return Math.PI * Math.pow(dim.diameter / 2, 2) * dim.length;
  }

  if (dim.type === 'RECTANGULAR' && dim.length && dim.width && dim.height) {
    // Volume = L × W × H
    return dim.length * dim.width * dim.height;
  }

  return 0;
}

/**
 * Calculates theoretical material unit weight (kg) and total weight (kg).
 * Default density is 7.85 g/cm³ (Standard Steel).
 */
export function calculateMaterialWeight(
  dim: ParsedDimension | string | null | undefined,
  density: number = 7.85,
  quantity: number = 1
): { unitWeight: number; totalWeight: number; volumeMm3: number } {
  const parsed = typeof dim === 'object' && dim !== null && 'type' in dim
    ? (dim as ParsedDimension)
    : parseDimension(dim as string);

  if (!parsed || !parsed.isValid) {
    return { unitWeight: 0, totalWeight: 0, volumeMm3: 0 };
  }

  const vol = calculateVolume(parsed);
  const effectiveDensity = Number(density) > 0 ? Number(density) : 7.85;

  // Weight (kg) = (Volume in mm³ × Density in g/cm³) / 1,000,000
  const unitWeight = Number(((vol * effectiveDensity) / 1000000).toFixed(2));
  const qty = Number(quantity) > 0 ? Number(quantity) : 1;
  const totalWeight = Number((unitWeight * qty).toFixed(2));

  return {
    unitWeight,
    totalWeight,
    volumeMm3: Math.round(vol * 100) / 100,
  };
}

/**
 * Returns canonical formatted dimension string (e.g. "Ø48X70" or "80X50X14").
 */
export function formatCanonicalDimension(
  dim: ParsedDimension | string | null | undefined,
  fallback: string = '-'
): string {
  if (!dim) return fallback;
  const parsed = typeof dim === 'object' && dim !== null && 'type' in dim
    ? (dim as ParsedDimension)
    : parseDimension(dim as string);

  return parsed.formatted || fallback;
}
