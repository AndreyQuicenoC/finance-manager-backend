import { Router } from "express";

import {
    createAccount,
    getAccountsByUser,
    updateAccount,
    deleteAccount
} from "../controllers/account.controller";

import verifyToken from "../middlewares/auth.middleware";

const router = Router();

router.post("/",createAccount,verifyToken);
router.get("/:id",getAccountsByUser,verifyToken);
router.put("/",updateAccount,verifyToken);
router.delete("/",deleteAccount,verifyToken);


export default router;
