import { Router } from "express";
import { NotificationController } from "./notification.controller";

const router = Router();

router.get("/", NotificationController.listMine);
router.patch("/read-all", NotificationController.markAllAsRead);
router.patch("/:id/read", NotificationController.markAsRead);
router.delete("/:id", NotificationController.remove);

export default router;