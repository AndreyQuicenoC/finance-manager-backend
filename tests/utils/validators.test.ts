/**
 * @file Test suite for Validation Utilities
 * @description Tests input validation and sanitization functions
 * @module tests/utils/validators
 */

import { describe, expect, it } from '@jest/globals';
import {
  isValidEmail,
  isValidPassword,
  sanitizeString,
  isPositiveNumber,
} from '../../src/utils/validators';

/**
 * Test suite for validation utility functions
 * Validates email, password, string sanitization, and number validation
 */
describe('Validators', () => {
  /**
   * Test suite for email validation
   */
  describe('isValidEmail', () => {
    /**
     * Verifies acceptance of valid email formats
     * @test Valid emails
     */
    it('should return true for valid email', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('user.name@domain.co.uk')).toBe(true);
    });

    /**
     * Verifies rejection of invalid email formats
     * @test Invalid emails
     */
    it('should return false for invalid email', () => {
      expect(isValidEmail('invalid')).toBe(false);
      expect(isValidEmail('invalid@')).toBe(false);
      expect(isValidEmail('@domain.com')).toBe(false);
      expect(isValidEmail('test@')).toBe(false);
    });
  });

  /**
   * Test suite for password validation
   */
  describe('isValidPassword', () => {
    /**
     * Verifies acceptance of strong passwords
     * @test Valid passwords with uppercase, lowercase, and numbers
     */
    it('should return true for valid password', () => {
      expect(isValidPassword('Password1')).toBe(true);
      expect(isValidPassword('SuperSecret123')).toBe(true);
    });

    /**
     * Verifies rejection of passwords shorter than 8 characters
     * @test Password too short
     */
    it('should return false for password less than 8 characters', () => {
      expect(isValidPassword('Pass1')).toBe(false);
    });

    /**
     * Verifies rejection of passwords without uppercase letters
     * @test No uppercase
     */
    it('should return false for password without uppercase', () => {
      expect(isValidPassword('password1')).toBe(false);
    });

    /**
     * Verifies rejection of passwords without lowercase letters
     * @test No lowercase
     */
    it('should return false for password without lowercase', () => {
      expect(isValidPassword('PASSWORD1')).toBe(false);
    });

    /**
     * Verifies rejection of passwords without numbers
     * @test No numbers
     */
    it('should return false for password without number', () => {
      expect(isValidPassword('Password')).toBe(false);
    });
  });

  /**
   * Test suite for string sanitization
   */
  describe('sanitizeString', () => {
    /**
     * Verifies whitespace trimming
     * @test Trim whitespace
     */
    it('should trim whitespace', () => {
      expect(sanitizeString('  test  ')).toBe('test');
    });

    /**
     * Verifies removal of potentially dangerous HTML characters
     * @test XSS prevention
     */
    it('should remove < and > characters', () => {
      expect(sanitizeString('<script>alert("xss")</script>')).toBe('scriptalert("xss")/script');
    });

    /**
     * Verifies handling of empty strings
     * @test Empty string
     */
    it('should handle empty string', () => {
      expect(sanitizeString('')).toBe('');
    });

    /**
     * Verifies normal strings pass through unchanged
     * @test Normal string
     */
    it('should handle normal string', () => {
      expect(sanitizeString('normal string')).toBe('normal string');
    });
  });

  /**
   * Test suite for positive number validation
   */
  describe('isPositiveNumber', () => {
    /**
     * Verifies acceptance of positive numbers
     * @test Positive numbers
     */
    it('should return true for positive numbers', () => {
      expect(isPositiveNumber(1)).toBe(true);
      expect(isPositiveNumber(100.5)).toBe(true);
    });

    /**
     * Verifies rejection of zero
     * @test Zero is not positive
     */
    it('should return false for zero', () => {
      expect(isPositiveNumber(0)).toBe(false);
    });

    /**
     * Verifies rejection of negative numbers
     * @test Negative numbers
     */
    it('should return false for negative numbers', () => {
      expect(isPositiveNumber(-1)).toBe(false);
      expect(isPositiveNumber(-100.5)).toBe(false);
    });

    /**
     * Verifies rejection of NaN (Not a Number)
     * @test NaN validation
     */
    it('should return false for NaN', () => {
      expect(isPositiveNumber(NaN)).toBe(false);
    });
  });
});
