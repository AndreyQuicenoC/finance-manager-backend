import { Router } from "express";
import {
  getLoginLogs,
  deleteUserByAdmin,
  getAllUsersForAdmin,
  getPasswordResetStats,
  getOverviewStats,
  createAdminUser,
  deleteAdminUser,
} from "../controllers/admin.controller";
import { verifyAdmin, verifySuperAdmin } from "../middlewares/auth.middleware";

const router = Router();

// Rutas accesibles por administradores (admin o super_admin)
router.get("/logs/login", verifyAdmin, getLoginLogs);
router.get("/users", verifyAdmin, getAllUsersForAdmin);
router.delete("/users/:id", verifyAdmin, deleteUserByAdmin);
router.get("/stats/password-resets", verifyAdmin, getPasswordResetStats);
router.get("/stats/overview", verifyAdmin, getOverviewStats);

// Rutas solo para súper administrador
router.post("/admins", verifySuperAdmin, createAdminUser);
router.delete("/admins/:id", verifySuperAdmin, deleteAdminUser);

export default router;


