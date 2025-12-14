import { Request, Response } from "express";
import prisma from "../config/db";
import { buildAccountContext } from "../services/build.ia.context";
import { askGeminiAI } from "../services/ai.gemini";

export const askGemini = async (req: Request, res: Response) => {

  const { userId, accountId, question } = req.body

  if (!question) {
    return res.status(400).json({ message: "Question is required" });
  }

  const account = await prisma.account.findFirst({
    where: { id: accountId, userId },
    include: {
      category: true,
      tags: {
        include: {
          transactions: true
        }
      }
    }
  });

  if (!account) {
    return res.status(404).json({ message: "Account not found" });
  }

  let chat = await prisma.chat.findFirst({
    where: { accountId }
  });

  if (!chat) {
    chat = await prisma.chat.create({
      data: { accountId }
    });
  }

  const context = buildAccountContext(account);

  const answer = await askGeminiAI(context, question);

  await prisma.message.create({
    data: {
      message_send: question,
      answers_message: answer,
      chatId: chat.id
    }
  });

  return res.json({ answer });
};

export const getChatHistory = async (req: Request, res: Response) => {

    const {userId, accountId} = req.body;
  
    const account = await prisma.account.findFirst({
      where: {
        id: accountId,
        userId
      }
    });
  
    if (!account) {
      return res.status(404).json({ message: "Account not found" });
    }
  
    const chat = await prisma.chat.findFirst({
      where: {
        accountId
      }
    });
  
    if (!chat) {
      return res.json({
        chatId: null,
        messages: []
      });
    }
  
    const messages = await prisma.message.findMany({
      where: {
        chatId: chat.id
      },
      orderBy: {
        id: "asc"
      },
      select: {
        id: true,
        message_send: true,
        answers_message: true
      }
    });
  
    return res.json({
      chatId: chat.id,
      messages
    });
  };