import { describe, expect, it, beforeEach, jest, afterAll } from '@jest/globals';
import { Request, Response } from 'express';
import prisma from '../../src/config/db';
import {
  createGoal,
  getAllGoals,
  getGoalsByUser,
  getGoalById,
  updateGoal,
  updateGoalProgress,
  deleteGoal,
} from '../../src/controllers/goal.controller';

jest.mock('../../src/config/db', () => ({
  __esModule: true,
  default: {
    goal: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    account: {
      findMany: jest.fn(),
    },
    tagPocket: {
      findMany: jest.fn(),
    },
  },
}));

const prismaMock = prisma as jest.Mocked<typeof prisma>;
const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);

const createMockResponse = () => {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  } as unknown as Response;
};

describe('GoalController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy.mockClear();
  });

  afterAll(() => {
    consoleErrorSpy.mockRestore();
  });

  describe('createGoal', () => {
    it('should return 400 when required fields are missing', async () => {
      const req = {
        body: { description: 'Test Goal' },
      } as Request;
      const res = createMockResponse();

      await createGoal(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: expect.stringContaining('Faltan campos requeridos') })
      );
    });

    it('should return 400 when target is missing', async () => {
      const req = {
        body: {
          description: 'Test Goal',
          init_date: '2024-01-01',
          final_date: '2024-12-31',
          max_money: 500,
        },
      } as Request;
      const res = createMockResponse();

      await createGoal(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: expect.stringContaining('target') })
      );
    });

    it('should return 400 when target is invalid', async () => {
      const req = {
        body: {
          description: 'Test Goal',
          init_date: '2024-01-01',
          final_date: '2024-12-31',
          max_money: 500,
          target: { targetType: 'invalid', targetId: 1 },
        },
      } as Request;
      const res = createMockResponse();

      await createGoal(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: expect.stringContaining('targetType') })
      );
    });

    it('should return 400 when targetId is missing', async () => {
      const req = {
        body: {
          description: 'Test Goal',
          init_date: '2024-01-01',
          final_date: '2024-12-31',
          max_money: 500,
          target: { targetType: 'tag' },
        },
      } as Request;
      const res = createMockResponse();

      await createGoal(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: expect.stringContaining('targetId') })
      );
    });

    it('should create goal successfully', async () => {
      const req = {
        body: {
          description: 'Save $1000',
          init_date: '2024-01-01',
          final_date: '2024-12-31',
          max_money: 1000,
          actual_progress: 0,
          target: { targetType: 'account', targetId: 1 },
        },
      } as Request;
      const res = createMockResponse();
      const mockGoal = {
        id: 1,
        description: 'Save $1000',
        init_date: new Date('2024-01-01'),
        final_date: new Date('2024-12-31'),
        max_money: 1000,
        actual_progress: 0,
        target: [{ id: 1, goalId: 1, targetType: 'account', targetId: 1 }],
      };

      prismaMock.goal.create.mockResolvedValue(mockGoal as any);

      await createGoal(req, res);

      expect(prismaMock.goal.create).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Meta creada exitosamente',
          goal: mockGoal,
        })
      );
    });

    it('should return 500 when creation fails', async () => {
      const req = {
        body: {
          description: 'Test Goal',
          init_date: '2024-01-01',
          final_date: '2024-12-31',
          max_money: 500,
          target: { targetType: 'tag', targetId: 1 },
        },
      } as Request;
      const res = createMockResponse();

      prismaMock.goal.create.mockRejectedValue(new Error('Database error'));

      await createGoal(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: expect.stringContaining('Error') })
      );
    });
  });

  describe('getAllGoals', () => {
    it('should return all goals', async () => {
      const res = createMockResponse();
      const mockGoals = [
        {
          id: 1,
          description: 'Goal 1',
          init_date: new Date('2024-01-01'),
          final_date: new Date('2024-12-31'),
          max_money: 1000,
          actual_progress: 500,
          target: [{ id: 1, goalId: 1, targetType: 'account', targetId: 1 }],
        },
      ];

      prismaMock.goal.findMany.mockResolvedValue(mockGoals as any);

      await getAllGoals(res);

      expect(prismaMock.goal.findMany).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(mockGoals);
    });

    it('should return 500 when fetching fails', async () => {
      const res = createMockResponse();

      prismaMock.goal.findMany.mockRejectedValue(new Error('Database error'));

      await getAllGoals(res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: expect.stringContaining('Error') })
      );
    });
  });

  describe('getGoalsByUser', () => {
    it('should return 400 when userId is invalid', async () => {
      const req = {
        params: { userId: 'invalid' },
      } as unknown as Request;
      const res = createMockResponse();

      await getGoalsByUser(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: expect.stringContaining('userId inválido') })
      );
    });

    it('should return goals for user', async () => {
      const req = {
        params: { userId: '1' },
      } as unknown as Request;
      const res = createMockResponse();
      const mockAccounts = [{ id: 1 }];
      const mockTags = [{ id: 1 }];
      const mockGoals = [
        {
          id: 1,
          description: 'User Goal',
          init_date: new Date('2024-01-01'),
          final_date: new Date('2024-12-31'),
          max_money: 1000,
          actual_progress: 500,
          target: [{ id: 1, goalId: 1, targetType: 'tag', targetId: 1 }],
        },
      ];

      prismaMock.account.findMany.mockResolvedValue(mockAccounts as any);
      prismaMock.tagPocket.findMany.mockResolvedValue(mockTags as any);
      prismaMock.goal.findMany.mockResolvedValue(mockGoals as any);

      await getGoalsByUser(req, res);

      expect(prismaMock.account.findMany).toHaveBeenCalled();
      expect(prismaMock.tagPocket.findMany).toHaveBeenCalled();
      expect(prismaMock.goal.findMany).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(mockGoals);
    });

    it('should return empty array when user has no accounts', async () => {
      const req = {
        params: { userId: '1' },
      } as unknown as Request;
      const res = createMockResponse();

      prismaMock.account.findMany.mockResolvedValue([]);

      await getGoalsByUser(req, res);

      expect(res.json).toHaveBeenCalledWith([]);
    });

    it('should return 500 when fetching fails', async () => {
      const req = {
        params: { userId: '1' },
      } as unknown as Request;
      const res = createMockResponse();

      prismaMock.account.findMany.mockRejectedValue(new Error('Database error'));

      await getGoalsByUser(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: expect.stringContaining('Error') })
      );
    });
  });

  describe('getGoalById', () => {
    it('should return goal when found', async () => {
      const req = {
        params: { id: '1' },
      } as unknown as Request;
      const res = createMockResponse();
      const mockGoal = {
        id: 1,
        description: 'Specific Goal',
        init_date: new Date('2024-01-01'),
        final_date: new Date('2024-12-31'),
        max_money: 1000,
        actual_progress: 500,
        target: [{ id: 1, goalId: 1, targetType: 'account', targetId: 1 }],
      };

      prismaMock.goal.findUnique.mockResolvedValue(mockGoal as any);

      await getGoalById(req, res);

      expect(prismaMock.goal.findUnique).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(mockGoal);
    });

    it('should return 404 when goal not found', async () => {
      const req = {
        params: { id: '99999' },
      } as unknown as Request;
      const res = createMockResponse();

      prismaMock.goal.findUnique.mockResolvedValue(null);

      await getGoalById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: expect.stringContaining('no encontrada') })
      );
    });

    it('should return 500 when fetching fails', async () => {
      const req = {
        params: { id: '1' },
      } as unknown as Request;
      const res = createMockResponse();

      prismaMock.goal.findUnique.mockRejectedValue(new Error('Database error'));

      await getGoalById(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: expect.stringContaining('Error') })
      );
    });
  });

  describe('updateGoal', () => {
    it('should return 404 when goal not found', async () => {
      const req = {
        params: { id: '99999' },
        body: { description: 'Updated' },
      } as unknown as Request;
      const res = createMockResponse();

      prismaMock.goal.findUnique.mockResolvedValue(null);

      await updateGoal(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: expect.stringContaining('no encontrada') })
      );
    });

    it('should return 400 when target is invalid', async () => {
      const req = {
        params: { id: '1' },
        body: { target: 'invalid' },
      } as unknown as Request;
      const res = createMockResponse();

      prismaMock.goal.findUnique.mockResolvedValue({ id: 1 } as any);

      await updateGoal(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: expect.stringContaining('objeto') })
      );
    });

    it('should return 400 when targetType is invalid', async () => {
      const req = {
        params: { id: '1' },
        body: { target: { targetType: 'invalid', targetId: 1 } },
      } as unknown as Request;
      const res = createMockResponse();

      prismaMock.goal.findUnique.mockResolvedValue({ id: 1 } as any);

      await updateGoal(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: expect.stringContaining('targetType') })
      );
    });

    it('should return 400 when targetId is invalid', async () => {
      const req = {
        params: { id: '1' },
        body: { target: { targetType: 'tag', targetId: 'invalid' } },
      } as unknown as Request;
      const res = createMockResponse();

      prismaMock.goal.findUnique.mockResolvedValue({ id: 1 } as any);

      await updateGoal(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: expect.stringContaining('targetId') })
      );
    });

    it('should return 400 when max_money is invalid', async () => {
      const req = {
        params: { id: '1' },
        body: { max_money: 'invalid' },
      } as unknown as Request;
      const res = createMockResponse();

      prismaMock.goal.findUnique.mockResolvedValue({ id: 1 } as any);

      await updateGoal(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: expect.stringContaining('max_money') })
      );
    });

    it('should return 400 when actual_progress is invalid', async () => {
      const req = {
        params: { id: '1' },
        body: { actual_progress: 'invalid' },
      } as unknown as Request;
      const res = createMockResponse();

      prismaMock.goal.findUnique.mockResolvedValue({ id: 1 } as any);

      await updateGoal(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: expect.stringContaining('actual_progress') })
      );
    });

    it('should update goal successfully', async () => {
      const req = {
        params: { id: '1' },
        body: {
          description: 'Updated Goal',
          max_money: 2000,
          actual_progress: 1000,
        },
      } as unknown as Request;
      const res = createMockResponse();
      const existingGoal = { id: 1, description: 'Old Goal' };
      const updatedGoal = {
        id: 1,
        description: 'Updated Goal',
        init_date: new Date('2024-01-01'),
        final_date: new Date('2024-12-31'),
        max_money: 2000,
        actual_progress: 1000,
        target: [{ id: 1, goalId: 1, targetType: 'account', targetId: 1 }],
      };

      prismaMock.goal.findUnique.mockResolvedValue(existingGoal as any);
      prismaMock.goal.update.mockResolvedValue(updatedGoal as any);

      await updateGoal(req, res);

      expect(prismaMock.goal.update).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Meta actualizada',
          goal: updatedGoal,
        })
      );
    });

    it('should return 500 when update fails', async () => {
      const req = {
        params: { id: '1' },
        body: { description: 'Updated' },
      } as unknown as Request;
      const res = createMockResponse();

      prismaMock.goal.findUnique.mockResolvedValue({ id: 1 } as any);
      prismaMock.goal.update.mockRejectedValue(new Error('Database error'));

      await updateGoal(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: expect.stringContaining('Error') })
      );
    });
  });

  describe('updateGoalProgress', () => {
    it('should return 400 when actual_progress is missing', async () => {
      const req = {
        params: { id: '1' },
        body: {},
      } as unknown as Request;
      const res = createMockResponse();

      await updateGoalProgress(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: expect.stringContaining('actual_progress') })
      );
    });

    it('should return 404 when goal not found', async () => {
      const req = {
        params: { id: '99999' },
        body: { actual_progress: 500 },
      } as unknown as Request;
      const res = createMockResponse();

      prismaMock.goal.findUnique.mockResolvedValue(null);

      await updateGoalProgress(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: expect.stringContaining('no encontrada') })
      );
    });

    it('should update goal progress successfully', async () => {
      const req = {
        params: { id: '1' },
        body: { actual_progress: 750 },
      } as unknown as Request;
      const res = createMockResponse();
      const existingGoal = { id: 1, actual_progress: 500 };
      const updatedGoal = {
        id: 1,
        description: 'Test Goal',
        init_date: new Date('2024-01-01'),
        final_date: new Date('2024-12-31'),
        max_money: 1000,
        actual_progress: 750,
        target: [{ id: 1, goalId: 1, targetType: 'account', targetId: 1 }],
      };

      prismaMock.goal.findUnique.mockResolvedValue(existingGoal as any);
      prismaMock.goal.update.mockResolvedValue(updatedGoal as any);

      await updateGoalProgress(req, res);

      expect(prismaMock.goal.update).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Progreso actualizado',
          goal: updatedGoal,
        })
      );
    });

    it('should return 500 when update fails', async () => {
      const req = {
        params: { id: '1' },
        body: { actual_progress: 500 },
      } as unknown as Request;
      const res = createMockResponse();

      prismaMock.goal.findUnique.mockResolvedValue({ id: 1 } as any);
      prismaMock.goal.update.mockRejectedValue(new Error('Database error'));

      await updateGoalProgress(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: expect.stringContaining('Error') })
      );
    });
  });

  describe('deleteGoal', () => {
    it('should delete goal successfully', async () => {
      const req = {
        params: { id: '1' },
      } as unknown as Request;
      const res = createMockResponse();

      prismaMock.goal.delete.mockResolvedValue({ id: 1 } as any);

      await deleteGoal(req, res);

      expect(prismaMock.goal.delete).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Meta eliminada' })
      );
    });

    it('should return 500 when deletion fails', async () => {
      const req = {
        params: { id: '1' },
      } as unknown as Request;
      const res = createMockResponse();

      prismaMock.goal.delete.mockRejectedValue(new Error('Database error'));

      await deleteGoal(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: expect.stringContaining('Error') })
      );
    });
  });
});
