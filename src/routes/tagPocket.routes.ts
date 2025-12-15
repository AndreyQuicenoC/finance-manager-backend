import { Router } from "express";

import {
  createTagPocket,
  getAllTags,
  getTagsByAccount,
  updateTagPocket,
  deleteTagPocket,
} from "../controllers/tagPocket.controller";

import verifyToken from "../middlewares/auth.middleware";

const router = Router();

router.post("/", verifyToken, createTagPocket);
router.get("/", verifyToken, getAllTags); // ✅ GET all tags (must be before /:id route)
router.get("/:id", verifyToken, getTagsByAccount);
router.put("/", verifyToken, updateTagPocket);
router.delete("/", verifyToken, deleteTagPocket);

export default router;
