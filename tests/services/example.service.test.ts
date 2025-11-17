/**
 * @file Test suite for Example Service
 * @description Tests business logic layer with in-memory data storage
 * @module tests/services/example
 */

import { describe, expect, it, beforeEach } from '@jest/globals';
import { ExampleService } from '../../src/services/example.service';

/**
 * Test suite for Example Service
 * Validates all CRUD operations in the service layer
 */
describe('ExampleService', () => {
  /** Instance of the service being tested */
  let service: ExampleService;

  /**
   * Create a fresh service instance before each test
   */
  beforeEach(() => {
    service = new ExampleService();
  });

  /**
   * Test suite for finding all items
   */
  describe('findAll', () => {
    /**
     * Verifies that a new service starts with empty storage
     * @test Initial state
     */
    it('should return empty array initially', () => {
      const result = service.findAll();
      expect(result).toEqual([]);
    });

    /**
     * Verifies retrieval of all items after creation
     * @test Find all after creating items
     */
    it('should return all items after creating some', () => {
      service.create('Item 1');
      service.create('Item 2');

      const result = service.findAll();
      expect(result).toHaveLength(2);
    });
  });

  /**
   * Test suite for finding item by ID
   */
  describe('findById', () => {
    /**
     * Verifies undefined is returned for non-existent items
     * @test Item not found
     */
    it('should return undefined if item does not exist', () => {
      const result = service.findById(999);
      expect(result).toBeUndefined();
    });

    /**
     * Verifies successful retrieval of existing item by ID
     * @test Item found
     */
    it('should return item if it exists', () => {
      const created = service.create('Test Item');
      const result = service.findById(created.id);

      expect(result).toBeDefined();
      expect(result?.name).toBe('Test Item');
    });
  });

  /**
   * Test suite for creating items
   */
  describe('create', () => {
    /**
     * Verifies newly created item has all required properties
     * @test Create with properties
     */
    it('should create new item with correct properties', () => {
      const result = service.create('New Item');

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('name', 'New Item');
      expect(result).toHaveProperty('createdAt');
      expect(result.createdAt).toBeInstanceOf(Date);
    });

    /**
     * Verifies created item is persisted in storage
     * @test Persistence after creation
     */
    it('should add item to the list', () => {
      service.create('New Item');
      const items = service.findAll();

      expect(items).toHaveLength(1);
      expect(items[0].name).toBe('New Item');
    });
  });

  /**
   * Test suite for updating items
   */
  describe('update', () => {
    /**
     * Verifies null is returned when updating non-existent item
     * @test Update non-existent
     */
    it('should return null if item does not exist', () => {
      const result = service.update(999, 'Updated Name');
      expect(result).toBeNull();
    });

    /**
     * Verifies successful update of existing item
     * @test Update existing item
     */
    it('should update existing item', () => {
      const created = service.create('Original Name');
      const updated = service.update(created.id, 'Updated Name');

      expect(updated).toBeDefined();
      expect(updated?.name).toBe('Updated Name');
      expect(updated?.id).toBe(created.id);
    });
  });

  /**
   * Test suite for deleting items
   */
  describe('delete', () => {
    /**
     * Verifies false is returned when deleting non-existent item
     * @test Delete non-existent
     */
    it('should return false if item does not exist', () => {
      const result = service.delete(999);
      expect(result).toBe(false);
    });

    /**
     * Verifies successful deletion and removal from storage
     * @test Delete existing item
     */
    it('should delete existing item and return true', () => {
      const created = service.create('To Delete');
      const result = service.delete(created.id);

      expect(result).toBe(true);

      const items = service.findAll();
      expect(items).toHaveLength(0);
    });
  });
});
