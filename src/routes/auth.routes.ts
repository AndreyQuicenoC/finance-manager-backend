import { Router } from "express";
import {
  signup,
  login,
  logout,
  getProfile,
  recoverPass,
  resetPass,
  updateProfile,
  changePassword,
  deleteAccount,
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
router.put("/profile", verifyToken, updateProfile);
router.post("/change-password", verifyToken, changePassword);
router.delete("/account", verifyToken, deleteAccount);
router.post("/recover", recoverPass);
router.post("/reset/:token", resetPass);

export default router;
