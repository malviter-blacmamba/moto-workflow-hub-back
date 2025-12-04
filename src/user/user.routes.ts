import { Router } from "express";
import { UserController } from "./user.controller";
import { authMiddleware } from "../middleware/auth";
import { adminMiddleware } from "../middleware/admin";

const router = Router();

router.use(authMiddleware, adminMiddleware);

router.get("/", UserController.list);
router.get("/:id", UserController.getById);
router.post("/", UserController.create);
router.put("/:id", UserController.update);
router.delete("/:id", UserController.delete);
router.patch("/:id/status", UserController.changeStatus);

export default router;
