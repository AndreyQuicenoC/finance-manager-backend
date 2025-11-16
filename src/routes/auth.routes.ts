import { Router } from "express";
import {
  signup,
  login,
  logout,
  getProfile,
} from "../controllers/auth.controller";
import {
  signupValidation,
  loginValidation,
  validate,
} from "../validators/auth.validator";
import verifyToken from "../middlewares/auth.middleware";

const router = Router();

router.post("/signup", signupValidation, validate, signup);
router.post("/login", loginValidation, validate, login);
router.post("/logout", verifyToken, logout);
router.get("/profile", verifyToken, getProfile);

export default router;
