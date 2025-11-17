import { describe, expect, it } from '@jest/globals';
import {
  isValidEmail,
  isValidPassword,
  sanitizeString,
  isPositiveNumber,
} from '../../src/utils/validators';

describe('Validators', () => {
  describe('isValidEmail', () => {
    it('should return true for valid email', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('user.name@domain.co.uk')).toBe(true);
    });

    it('should return false for invalid email', () => {
      expect(isValidEmail('invalid')).toBe(false);
      expect(isValidEmail('invalid@')).toBe(false);
      expect(isValidEmail('@domain.com')).toBe(false);
      expect(isValidEmail('test@')).toBe(false);
    });
  });

  describe('isValidPassword', () => {
    it('should return true for valid password', () => {
      expect(isValidPassword('Password1')).toBe(true);
      expect(isValidPassword('SuperSecret123')).toBe(true);
    });

    it('should return false for password less than 8 characters', () => {
      expect(isValidPassword('Pass1')).toBe(false);
    });

    it('should return false for password without uppercase', () => {
      expect(isValidPassword('password1')).toBe(false);
    });

    it('should return false for password without lowercase', () => {
      expect(isValidPassword('PASSWORD1')).toBe(false);
    });

    it('should return false for password without number', () => {
      expect(isValidPassword('Password')).toBe(false);
    });
  });

  describe('sanitizeString', () => {
    it('should trim whitespace', () => {
      expect(sanitizeString('  test  ')).toBe('test');
    });

    it('should remove < and > characters', () => {
      expect(sanitizeString('<script>alert("xss")</script>')).toBe('scriptalert("xss")/script');
    });

    it('should handle empty string', () => {
      expect(sanitizeString('')).toBe('');
    });

    it('should handle normal string', () => {
      expect(sanitizeString('normal string')).toBe('normal string');
    });
  });

  describe('isPositiveNumber', () => {
    it('should return true for positive numbers', () => {
      expect(isPositiveNumber(1)).toBe(true);
      expect(isPositiveNumber(100.5)).toBe(true);
    });

    it('should return false for zero', () => {
      expect(isPositiveNumber(0)).toBe(false);
    });

    it('should return false for negative numbers', () => {
      expect(isPositiveNumber(-1)).toBe(false);
      expect(isPositiveNumber(-100.5)).toBe(false);
    });

    it('should return false for NaN', () => {
      expect(isPositiveNumber(NaN)).toBe(false);
    });
  });
});
