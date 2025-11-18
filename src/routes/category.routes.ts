// src/routes/category.routes.ts
import express from "express";
import verifyToken from "../middlewares/auth.middleware";
import {
  createCategory,
  getCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
} from "../controllers/category.controller";

const router = express.Router();

router.post("/", verifyToken, createCategory);
router.get("/", verifyToken, getCategories);
router.get("/:id", verifyToken, getCategoryById);
router.put("/:id", verifyToken, updateCategory);
router.delete("/:id", verifyToken, deleteCategory);

export default router;
