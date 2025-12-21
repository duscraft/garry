import { describe, it, expect } from 'vitest';
import type { Warranty, CreateWarrantyRequest, Stats, User, AuthResponse } from '../types';

describe('Types', () => {
  describe('Warranty type', () => {
    it('should accept valid warranty object', () => {
      const warranty: Warranty = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        user_id: 'user-123',
        product_name: 'iPhone 15 Pro',
        brand: 'Apple',
        category: 'electronics',
        purchase_date: '2024-01-15T10:00:00Z',
        warranty_end_date: '2026-01-15T10:00:00Z',
        warranty_months: 24,
        store: 'Apple Store',
        receipt_url: 'https://example.com/receipt.jpg',
        notes: 'Main phone',
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T10:00:00Z',
      };

      expect(warranty.id).toBeDefined();
      expect(warranty.product_name).toBe('iPhone 15 Pro');
      expect(warranty.warranty_months).toBe(24);
    });

    it('should allow optional fields to be undefined', () => {
      const warranty: Warranty = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        user_id: 'user-123',
        product_name: 'Test Product',
        brand: 'Generic',
        category: 'other',
        purchase_date: '2024-01-15T10:00:00Z',
        warranty_end_date: '2026-01-15T10:00:00Z',
        warranty_months: 24,
        store: 'Store',
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T10:00:00Z',
      };

      expect(warranty.receipt_url).toBeUndefined();
      expect(warranty.notes).toBeUndefined();
    });
  });

  describe('CreateWarrantyRequest type', () => {
    it('should accept valid create request', () => {
      const request: CreateWarrantyRequest = {
        product_name: 'MacBook Pro',
        brand: 'Apple',
        category: 'electronics',
        purchase_date: '2024-01-15',
        warranty_months: 36,
        store: 'Apple Store',
      };

      expect(request.product_name).toBe('MacBook Pro');
      expect(request.warranty_months).toBe(36);
    });

    it('should allow optional notes and receipt_url', () => {
      const request: CreateWarrantyRequest = {
        product_name: 'Test',
        brand: 'Brand',
        category: 'other',
        purchase_date: '2024-01-15',
        warranty_months: 12,
        store: 'Store',
        notes: 'Some notes',
        receipt_url: 'https://example.com/receipt.pdf',
      };

      expect(request.notes).toBe('Some notes');
      expect(request.receipt_url).toBe('https://example.com/receipt.pdf');
    });
  });

  describe('Stats type', () => {
    it('should accept valid stats object', () => {
      const stats: Stats = {
        total_warranties: 10,
        active_warranties: 7,
        expired_warranties: 2,
        expiring_soon_warranties: 1,
      };

      expect(stats.total_warranties).toBe(10);
      expect(stats.active_warranties + stats.expired_warranties + stats.expiring_soon_warranties).toBeLessThanOrEqual(stats.total_warranties);
    });
  });

  describe('User type', () => {
    it('should accept valid user object', () => {
      const user: User = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
      };

      expect(user.id).toBe('user-123');
      expect(user.email).toContain('@');
    });
  });

  describe('AuthResponse type', () => {
    it('should accept valid auth response', () => {
      const response: AuthResponse = {
        access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        refresh_token: 'refresh-token-123',
        expires_in: 3600,
      };

      expect(response.access_token).toBeDefined();
      expect(response.expires_in).toBeGreaterThan(0);
    });
  });

  describe('Category values', () => {
    it('should have valid category strings', () => {
      const validCategories = [
        'electronics',
        'appliances',
        'furniture',
        'clothing',
        'automotive',
        'sports',
        'other',
      ];

      validCategories.forEach((category) => {
        expect(typeof category).toBe('string');
        expect(category.length).toBeGreaterThan(0);
      });

      expect(validCategories).toHaveLength(7);
    });
  });
});
