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

  /**
   * Test suite for CORS configuration
   */
  describe('CORS', () => {
    /**
     * Verifies that requests from allowed origins are accepted
     * @test CORS acceptance
     */
    it('should accept requests from allowed origins', async () => {
      const response = await request(app)
        .get('/')
        .set('Origin', 'http://localhost:3000');

      // CORS should allow the request from allowed origin
      expect(response.status).toBe(200);
    });

    /**
     * Verifies that requests from localhost:5173 are accepted
     * @test CORS acceptance for Vite dev server
     */
    it('should accept requests from localhost:5173', async () => {
      const response = await request(app)
        .get('/')
        .set('Origin', 'http://localhost:5173');

      expect(response.status).toBe(200);
    });

    /**
     * Verifies that requests with no origin are accepted
     * @test CORS acceptance for no origin
     */
    it('should accept requests with no origin', async () => {
      const response = await request(app).get('/');

      expect(response.status).toBe(200);
    });

    /**
     * Verifies that requests from disallowed origins are rejected
     * @test CORS rejection
     */
    it('should reject requests from disallowed origins', async () => {
      const response = await request(app)
        .get('/')
        .set('Origin', 'http://malicious-site.com');

      // CORS error should prevent the request from completing normally
      // The exact behavior depends on CORS implementation, but it should not succeed
      expect(response.status).not.toBe(200);
    });
  });
});
