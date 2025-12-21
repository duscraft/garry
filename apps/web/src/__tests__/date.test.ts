import { describe, it, expect, vi, beforeEach } from 'vitest';
import { formatDate, formatInputDate, getWarrantyStatus, getDaysRemaining } from '../utils/date';

describe('date utils', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-01-15T12:00:00Z'));
  });

  describe('formatDate', () => {
    it('should format date in French locale', () => {
      const result = formatDate('2025-01-15T10:00:00Z');
      expect(result).toContain('15');
      expect(result).toContain('janvier');
      expect(result).toContain('2025');
    });

    it('should return empty string for empty input', () => {
      expect(formatDate('')).toBe('');
    });

    it('should handle different months', () => {
      const result = formatDate('2025-06-20T10:00:00Z');
      expect(result).toContain('20');
      expect(result).toContain('juin');
    });
  });

  describe('formatInputDate', () => {
    it('should format date for input fields', () => {
      const result = formatInputDate('2025-01-15T10:00:00Z');
      expect(result).toBe('2025-01-15');
    });

    it('should return empty string for empty input', () => {
      expect(formatInputDate('')).toBe('');
    });
  });

  describe('getWarrantyStatus', () => {
    it('should return "active" for dates more than 30 days in future', () => {
      const futureDate = '2025-03-15T10:00:00Z';
      expect(getWarrantyStatus(futureDate)).toBe('active');
    });

    it('should return "expiring" for dates within 30 days', () => {
      const soonDate = '2025-02-01T10:00:00Z';
      expect(getWarrantyStatus(soonDate)).toBe('expiring');
    });

    it('should return "expired" for past dates', () => {
      const pastDate = '2025-01-01T10:00:00Z';
      expect(getWarrantyStatus(pastDate)).toBe('expired');
    });

    it('should return "expiring" for today', () => {
      const today = '2025-01-15T10:00:00Z';
      expect(getWarrantyStatus(today)).toBe('expiring');
    });
  });

  describe('getDaysRemaining', () => {
    it('should return positive number for future dates', () => {
      const futureDate = '2025-01-25T10:00:00Z';
      const days = getDaysRemaining(futureDate);
      expect(days).toBeGreaterThan(0);
    });

    it('should return negative number for past dates', () => {
      const pastDate = '2025-01-01T10:00:00Z';
      const days = getDaysRemaining(pastDate);
      expect(days).toBeLessThan(0);
    });

    it('should return 0 for today', () => {
      const today = '2025-01-15T12:00:00Z';
      const days = getDaysRemaining(today);
      expect(days).toBe(0);
    });

    it('should calculate correct number of days', () => {
      const futureDate = '2025-01-25T12:00:00Z';
      expect(getDaysRemaining(futureDate)).toBe(10);
    });
  });
});
