import { Router } from "express";
import { WorkOrderController } from "./workorder.controller";
import { authMiddleware } from "../middleware/auth";


const router = Router();

router.use(authMiddleware);

router.get("/", WorkOrderController.list);
router.get("/:id", WorkOrderController.getById);
router.post("/", WorkOrderController.create);
router.put("/:id", WorkOrderController.update);
router.delete("/:id", WorkOrderController.delete);
router.get("/:id/pdf", WorkOrderController.downloadPdf);

router.patch("/:id/status", WorkOrderController.changeStatus);

export default router;
