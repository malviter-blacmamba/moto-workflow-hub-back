import { Router } from "express";
import { AccountController } from "./account.controller";

const router = Router();

router.get("/me", AccountController.getMe);
router.patch("/profile", AccountController.updateProfile);
router.patch("/password", AccountController.changePassword);

export default router;