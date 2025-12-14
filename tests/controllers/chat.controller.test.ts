import { describe, expect, it, beforeEach, jest } from '@jest/globals';
import { Request, Response } from 'express';
import prisma from '../../src/config/db';
import { askGemini, getChatHistory } from '../../src/controllers/chat.controller';
import { buildAccountContext } from '../../src/services/build.ia.context';
import { askGeminiAI } from '../../src/services/ai.gemini';

jest.mock('../../src/config/db', () => ({
  __esModule: true,
  default: {
    account: {
      findFirst: jest.fn(),
    },
    chat: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    message: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
  },
}));

jest.mock('../../src/services/build.ia.context', () => ({
  __esModule: true,
  buildAccountContext: jest.fn(),
}));

jest.mock('../../src/services/ai.gemini', () => ({
  __esModule: true,
  askGeminiAI: jest.fn(),
}));

const prismaMock = prisma as any;
const buildAccountContextMock = buildAccountContext as jest.MockedFunction<typeof buildAccountContext>;
const askGeminiAIMock = askGeminiAI as jest.MockedFunction<typeof askGeminiAI>;

const createMockResponse = () => {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  } as unknown as Response;
};

describe('ChatController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('askGemini', () => {
    it('should return 400 when question is missing', async () => {
      const req = {
        body: { userId: 1, accountId: 1 },
      } as unknown as Request;
      const res = createMockResponse();

      await askGemini(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Question is required',
      });
    });

    it('should return 404 when account is not found', async () => {
      const req = {
        body: { userId: 1, accountId: 1, question: 'Hola' },
      } as unknown as Request;
      const res = createMockResponse();
      prismaMock.account.findFirst.mockResolvedValueOnce(null);

      await askGemini(req, res);

      expect(prismaMock.account.findFirst).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Account not found' });
    });

    it('should create chat if not exists, ask Gemini and store message', async () => {
      const req = {
        body: { userId: 1, accountId: 1, question: '¿Cómo está mi cuenta?' },
      } as unknown as Request;
      const res = createMockResponse();

      const account = {
        id: 1,
        userId: 1,
        category: { tipo: 'Ahorros' },
        tags: [],
      };

      prismaMock.account.findFirst.mockResolvedValueOnce(account);
      prismaMock.chat.findFirst.mockResolvedValueOnce(null);
      prismaMock.chat.create.mockResolvedValueOnce({ id: 10, accountId: 1 });
      buildAccountContextMock.mockReturnValueOnce('mock-context');
      askGeminiAIMock.mockResolvedValueOnce('mock-answer');
      prismaMock.message.create.mockResolvedValueOnce({});

      await askGemini(req, res);

      expect(buildAccountContextMock).toHaveBeenCalledWith(account);
      expect(askGeminiAIMock).toHaveBeenCalledWith('mock-context', '¿Cómo está mi cuenta?');
      expect(prismaMock.message.create).toHaveBeenCalledWith({
        data: {
          message_send: '¿Cómo está mi cuenta?',
          answers_message: 'mock-answer',
          chatId: 10,
        },
      });
      expect(res.json).toHaveBeenCalledWith({ answer: 'mock-answer' });
    });
  });

  describe('getChatHistory', () => {
    it('should return 404 when account does not belong to user', async () => {
      const req = {
        body: { userId: 1, accountId: 1 },
      } as unknown as Request;
      const res = createMockResponse();
      prismaMock.account.findFirst.mockResolvedValueOnce(null);

      await getChatHistory(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Account not found' });
    });

    it('should return empty history when chat does not exist', async () => {
      const req = {
        body: { userId: 1, accountId: 1 },
      } as unknown as Request;
      const res = createMockResponse();
      prismaMock.account.findFirst.mockResolvedValueOnce({ id: 1, userId: 1 });
      prismaMock.chat.findFirst.mockResolvedValueOnce(null);

      await getChatHistory(req, res);

      expect(res.json).toHaveBeenCalledWith({
        chatId: null,
        messages: [],
      });
    });

    it('should return messages when chat exists', async () => {
      const req = {
        body: { userId: 1, accountId: 1 },
      } as unknown as Request;
      const res = createMockResponse();
      prismaMock.account.findFirst.mockResolvedValueOnce({ id: 1, userId: 1 });
      prismaMock.chat.findFirst.mockResolvedValueOnce({ id: 20, accountId: 1 });
      const messages = [
        { id: 1, message_send: 'Hola', answers_message: 'Respuesta' },
      ];
      prismaMock.message.findMany.mockResolvedValueOnce(messages);

      await getChatHistory(req, res);

      expect(prismaMock.message.findMany).toHaveBeenCalledWith({
        where: { chatId: 20 },
        orderBy: { id: 'asc' },
        select: {
          id: true,
          message_send: true,
          answers_message: true,
        },
      });
      expect(res.json).toHaveBeenCalledWith({
        chatId: 20,
        messages,
      });
    });
  });
});


