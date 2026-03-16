import { Router } from "express";
import { ReminderController } from "./reminder.controller";

const router = Router();

router.get("/", ReminderController.list);
router.get("/:id", ReminderController.getById);
router.post("/", ReminderController.create);
router.put("/:id", ReminderController.update);
router.delete("/:id", ReminderController.delete);
router.post("/:id/mark-sent", ReminderController.markSent);
router.post("/:id/mark-completed", ReminderController.markCompleted);

export default router;