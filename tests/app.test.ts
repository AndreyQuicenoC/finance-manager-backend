/**
 * @file Test suite for the main Express application
 * @description Tests the core endpoints of the Finance Manager Backend API
 * @module tests/app
 */

import { describe, expect, it } from '@jest/globals';
import request from 'supertest';
import app from '../src/app';

/**
 * Test suite for the main Express application
 * Validates core API endpoints and health checks
 */
describe('App', () => {
  /**
   * Test suite for the root endpoint
   */
  describe('GET /', () => {
    /**
     * Verifies that the root endpoint returns a welcome message
     * @test {GET /}
     */
    it('should return 200 and welcome message', async () => {
      const response = await request(app).get('/');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toBe('Finance Manager Backend API');
    });
  });

  /**
   * Test suite for the health check endpoint
   */
  describe('GET /health', () => {
    /**
     * Verifies that the health endpoint returns server status
     * @test {GET /health}
     */
    it('should return 200 and health status', async () => {
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('message', 'Server is running');
    });
  });
});
