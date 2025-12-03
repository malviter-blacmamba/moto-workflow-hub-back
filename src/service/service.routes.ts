import { Router } from "express";
import { ServiceController } from "./service.controller";
import { authMiddleware } from "../middleware/auth";

const router = Router();

router.use(authMiddleware);

router.get("/", ServiceController.list);
router.get("/:id", ServiceController.getById);
router.post("/", ServiceController.create);
router.put("/:id", ServiceController.update);
router.delete("/:id", ServiceController.delete);

export default router;
