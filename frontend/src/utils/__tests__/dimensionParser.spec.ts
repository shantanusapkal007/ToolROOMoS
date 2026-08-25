import {
  parseDimension,
  calculateVolume,
  calculateMaterialWeight,
  formatCanonicalDimension,
} from '../dimensionParser';

describe('Canonical Dimension Parser & Engineering Calculation Engine', () => {
  describe('Cylindrical / Round Dimensions (ØD × L)', () => {
    test('parses Ø8X30 correctly as Diameter=8, Length=30', () => {
      const parsed = parseDimension('Ø8X30');
      expect(parsed.type).toBe('ROUND');
      expect(parsed.isValid).toBe(true);
      expect(parsed.diameter).toBe(8);
      expect(parsed.length).toBe(30);
      expect(parsed.displayL).toBe('Ø');
      expect(parsed.displayW).toBe(8);
      expect(parsed.displayH).toBe(30);
      expect(parsed.formatted).toBe('Ø8X30');
    });

    test('parses Ø6X15 correctly as Diameter=6, Length=15', () => {
      const parsed = parseDimension('Ø6X15');
      expect(parsed.type).toBe('ROUND');
      expect(parsed.isValid).toBe(true);
      expect(parsed.diameter).toBe(6);
      expect(parsed.length).toBe(15);
      expect(parsed.formatted).toBe('Ø6X15');
    });

    test('parses Ø8X25 correctly as Diameter=8, Length=25', () => {
      const parsed = parseDimension('Ø8X25');
      expect(parsed.type).toBe('ROUND');
      expect(parsed.isValid).toBe(true);
      expect(parsed.diameter).toBe(8);
      expect(parsed.length).toBe(25);
    });

    test('parses Ø45X68 correctly as Diameter=45, Length=68', () => {
      const parsed = parseDimension('Ø45X68');
      expect(parsed.type).toBe('ROUND');
      expect(parsed.isValid).toBe(true);
      expect(parsed.diameter).toBe(45);
      expect(parsed.length).toBe(68);
      expect(parsed.displayL).toBe('Ø');
      expect(parsed.displayW).toBe(45);
      expect(parsed.displayH).toBe(68);
    });

    test('parses Ø48X70 correctly as Diameter=48, Length=70', () => {
      const parsed = parseDimension('Ø48X70');
      expect(parsed.type).toBe('ROUND');
      expect(parsed.isValid).toBe(true);
      expect(parsed.diameter).toBe(48);
      expect(parsed.length).toBe(70);
      expect(parsed.displayL).toBe('Ø');
      expect(parsed.displayW).toBe(48);
      expect(parsed.displayH).toBe(70);
      expect(parsed.formatted).toBe('Ø48X70');
    });

    test('parses various round prefixes: DIA, DIA., OD, RD, spaces and case insensitivity', () => {
      const variations = [
        { input: 'DIA 40 X 120', expectedD: 40, expectedL: 120 },
        { input: 'DIA. 50X105', expectedD: 50, expectedL: 105 },
        { input: 'dia48x70', expectedD: 48, expectedL: 70 },
        { input: 'OD 48 X 70 mm', expectedD: 48, expectedL: 70 },
        { input: 'RD 25*100', expectedD: 25, expectedL: 100 },
        { input: 'Ø 48.5 X 70.2', expectedD: 48.5, expectedL: 70.2 },
      ];

      for (const v of variations) {
        const parsed = parseDimension(v.input);
        expect(parsed.type).toBe('ROUND');
        expect(parsed.isValid).toBe(true);
        expect(parsed.diameter).toBe(v.expectedD);
        expect(parsed.length).toBe(v.expectedL);
      }
    });
  });

  describe('Rectangular Dimensions (L × W × H)', () => {
    test('parses 80X50X14 correctly as Length=80, Width=50, Height=14', () => {
      const parsed = parseDimension('80X50X14');
      expect(parsed.type).toBe('RECTANGULAR');
      expect(parsed.isValid).toBe(true);
      expect(parsed.length).toBe(80);
      expect(parsed.width).toBe(50);
      expect(parsed.height).toBe(14);
      expect(parsed.displayL).toBe('80');
      expect(parsed.displayW).toBe(50);
      expect(parsed.displayH).toBe(14);
      expect(parsed.formatted).toBe('80X50X14');
    });

    test('parses 345X275X38 correctly as Length=345, Width=275, Height=38', () => {
      const parsed = parseDimension('345X275X38');
      expect(parsed.type).toBe('RECTANGULAR');
      expect(parsed.isValid).toBe(true);
      expect(parsed.length).toBe(345);
      expect(parsed.width).toBe(275);
      expect(parsed.height).toBe(38);
    });

    test('parses 160X100X63 correctly as Length=160, Width=100, Height=63', () => {
      const parsed = parseDimension('160X100X63');
      expect(parsed.type).toBe('RECTANGULAR');
      expect(parsed.isValid).toBe(true);
      expect(parsed.length).toBe(160);
      expect(parsed.width).toBe(100);
      expect(parsed.height).toBe(63);
    });

    test('handles rectangular spaces and multiplier symbols', () => {
      const parsed = parseDimension('160 x 100 × 63 mm');
      expect(parsed.type).toBe('RECTANGULAR');
      expect(parsed.isValid).toBe(true);
      expect(parsed.length).toBe(160);
      expect(parsed.width).toBe(100);
      expect(parsed.height).toBe(63);
    });
  });

  describe('Cylindrical vs Rectangular Volume & Weight Calculations', () => {
    test('calculates cylindrical volume and weight using π × (D/2)² × L', () => {
      // Ø48X70 with steel density 7.85
      // Volume = π × (24)² × 70 = 126669.015... mm³
      // Unit weight = 126669.015 * 7.85 / 1,000,000 = 0.99435... kg -> 0.99 kg
      const parsed = parseDimension('Ø48X70');
      const vol = calculateVolume(parsed);
      expect(vol).toBeCloseTo(Math.PI * 24 * 24 * 70, 2);

      const { unitWeight, totalWeight } = calculateMaterialWeight(parsed, 7.85, 2);
      expect(unitWeight).toBe(0.99);
      expect(totalWeight).toBe(1.98); // 0.99 * 2
    });

    test('calculates rectangular volume and weight using L × W × H', () => {
      // 80X50X14 with steel density 7.85
      // Volume = 80 * 50 * 14 = 56000 mm³
      // Unit weight = 56000 * 7.85 / 1,000,000 = 0.4396 kg -> 0.44 kg
      const parsed = parseDimension('80X50X14');
      const vol = calculateVolume(parsed);
      expect(vol).toBe(56000);

      const { unitWeight, totalWeight } = calculateMaterialWeight(parsed, 7.85, 3);
      expect(unitWeight).toBe(0.44);
      expect(totalWeight).toBe(1.32); // 0.44 * 3
    });

    test('respects custom material density (e.g. Aluminum 2.7 g/cm³)', () => {
      // Ø48X70 with Aluminum density 2.7
      // Unit weight = 126669.015 * 2.7 / 1,000,000 = 0.342 kg -> 0.34 kg
      const parsed = parseDimension('Ø48X70');
      const { unitWeight } = calculateMaterialWeight(parsed, 2.7, 1);
      expect(unitWeight).toBe(0.34);
    });
  });

  describe('Finish Size vs RM Size Independence', () => {
    test('Finish Size and RM Size parse independently and accurately', () => {
      const finishDim = parseDimension('Ø45X68');
      const rmDim = parseDimension('Ø48X70');

      expect(finishDim.diameter).toBe(45);
      expect(finishDim.length).toBe(68);

      expect(rmDim.diameter).toBe(48);
      expect(rmDim.length).toBe(70);

      // Raw Material weight should use RM Size
      const rmWeight = calculateMaterialWeight(rmDim, 7.85, 1);
      expect(rmWeight.unitWeight).toBe(0.99);

      // Finish weight should use Finish Size
      const finishWeight = calculateMaterialWeight(finishDim, 7.85, 1);
      expect(finishWeight.unitWeight).toBe(0.85); // π * 22.5² * 68 * 7.85 / 10^6 = 0.8488 -> 0.85
    });
  });

  describe('Formatting & Edge Cases', () => {
    test('formats canonical strings accurately', () => {
      expect(formatCanonicalDimension('Ø48X70')).toBe('Ø48X70');
      expect(formatCanonicalDimension('DIA 48 X 70')).toBe('Ø48X70');
      expect(formatCanonicalDimension('80 x 50 x 14')).toBe('80X50X14');
      expect(formatCanonicalDimension(null)).toBe('-');
      expect(formatCanonicalDimension('')).toBe('-');
    });
  });
});
