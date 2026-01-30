import { describe, it, expect } from 'vitest';
import { screenToPDF, pdfToScreen, normalizeCoordinates } from '@/lib/pdf/coordinates';
import type { PageInfo } from '@/lib/pdf/coordinates';

describe('PDF Coordinates', () => {
  const pageInfo: PageInfo = {
    width: 595, // A4 width
    height: 842, // A4 height
    scale: 1.5,
  };

  describe('screenToPDF', () => {
    it('should convert screen coordinates to PDF coordinates', () => {
      const screen = { x: 100, y: 100, width: 200, height: 50 };
      const pdf = screenToPDF(screen, pageInfo);

      expect(pdf.x).toBeCloseTo(66.67, 1);
      expect(pdf.y).toBeCloseTo(742, 1);
      expect(pdf.width).toBeCloseTo(133.33, 1);
      expect(pdf.height).toBeCloseTo(33.33, 1);
    });
  });

  describe('pdfToScreen', () => {
    it('should convert PDF coordinates to screen coordinates', () => {
      const pdf = { x: 100, y: 700, width: 200, height: 50 };
      const screen = pdfToScreen(pdf, pageInfo);

      expect(screen.x).toBe(150);
      expect(screen.y).toBeCloseTo(138, 1);
      expect(screen.width).toBe(300);
      expect(screen.height).toBe(75);
    });
  });

  describe('normalizeCoordinates', () => {
    it('should keep coordinates within page bounds', () => {
      const coords = { x: 1000, y: 1000, width: 200, height: 50 };
      const normalized = normalizeCoordinates(coords, pageInfo);

      expect(normalized.x).toBeLessThanOrEqual(pageInfo.width * pageInfo.scale);
      expect(normalized.y).toBeLessThanOrEqual(pageInfo.height * pageInfo.scale);
    });
  });
});
