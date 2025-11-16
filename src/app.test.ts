import request from 'supertest';
import app from './app';

describe('App', () => {
  describe('GET /', () => {
    it('should return 200 and welcome message', async () => {
      const response = await request(app).get('/');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toBe('Finance Manager Backend API');
    });
  });

  describe('GET /health', () => {
    it('should return 200 and health status', async () => {
      const response = await request(app).get('/health');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('message', 'Server is running');
    });
  });
});
