import express from "express";
import verifyToken from "../middlewares/auth.middleware";
import { askGemini,getChatHistory } from "../controllers/chat.controller";

const router = express.Router();

router.post("/",verifyToken, askGemini);
router.get("/",verifyToken, getChatHistory);

export default router;