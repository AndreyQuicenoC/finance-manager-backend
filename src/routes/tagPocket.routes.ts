import { Router } from "express";

import {
  createTagPocket,
  getTagsByAccount,
  updateTagPocket,
  deleteTagPocket,
} from "../controllers/tagPocket.controller";

import verifyToken from "../middlewares/auth.middleware";

const router = Router();

router.post("/", verifyToken, createTagPocket);
router.get("/:id", verifyToken, getTagsByAccount);
router.put("/", verifyToken, updateTagPocket);
router.delete("/", verifyToken, deleteTagPocket);

export default router;
