import { Router } from "express";
import { ServiceController } from "./service.controller";
import { adminMiddleware } from "../middleware/admin";

const router = Router();

router.get("/", ServiceController.list);
router.get("/:id", ServiceController.getById);

router.post("/", adminMiddleware, ServiceController.create);
router.put("/:id", adminMiddleware, ServiceController.update);
router.delete("/:id", adminMiddleware, ServiceController.delete);

export default router;