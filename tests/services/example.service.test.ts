import { describe, expect, it, beforeEach } from '@jest/globals';
import { ExampleService } from '../../src/services/example.service';

describe('ExampleService', () => {
  let service: ExampleService;

  beforeEach(() => {
    service = new ExampleService();
  });

  describe('findAll', () => {
    it('should return empty array initially', () => {
      const result = service.findAll();
      expect(result).toEqual([]);
    });

    it('should return all items after creating some', () => {
      service.create('Item 1');
      service.create('Item 2');

      const result = service.findAll();
      expect(result).toHaveLength(2);
    });
  });

  describe('findById', () => {
    it('should return undefined if item does not exist', () => {
      const result = service.findById(999);
      expect(result).toBeUndefined();
    });

    it('should return item if it exists', () => {
      const created = service.create('Test Item');
      const result = service.findById(created.id);

      expect(result).toBeDefined();
      expect(result?.name).toBe('Test Item');
    });
  });

  describe('create', () => {
    it('should create new item with correct properties', () => {
      const result = service.create('New Item');

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('name', 'New Item');
      expect(result).toHaveProperty('createdAt');
      expect(result.createdAt).toBeInstanceOf(Date);
    });

    it('should add item to the list', () => {
      service.create('New Item');
      const items = service.findAll();

      expect(items).toHaveLength(1);
      expect(items[0].name).toBe('New Item');
    });
  });

  describe('update', () => {
    it('should return null if item does not exist', () => {
      const result = service.update(999, 'Updated Name');
      expect(result).toBeNull();
    });

    it('should update existing item', () => {
      const created = service.create('Original Name');
      const updated = service.update(created.id, 'Updated Name');

      expect(updated).toBeDefined();
      expect(updated?.name).toBe('Updated Name');
      expect(updated?.id).toBe(created.id);
    });
  });

  describe('delete', () => {
    it('should return false if item does not exist', () => {
      const result = service.delete(999);
      expect(result).toBe(false);
    });

    it('should delete existing item and return true', () => {
      const created = service.create('To Delete');
      const result = service.delete(created.id);

      expect(result).toBe(true);

      const items = service.findAll();
      expect(items).toHaveLength(0);
    });
  });
});
