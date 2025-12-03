import { Router } from "express";
import { MotorcycleController } from "./motorcycle.controller";
import { authMiddleware } from "../middleware/auth";

const router = Router();

router.use(authMiddleware);

router.get("/", MotorcycleController.list);
router.get("/:id", MotorcycleController.getById);
router.post("/", MotorcycleController.create);
router.put("/:id", MotorcycleController.update);
router.delete("/:id", MotorcycleController.delete);

export default router;
