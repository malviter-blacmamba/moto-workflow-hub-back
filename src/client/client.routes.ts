import { Router } from "express";
import { ClientController } from "./client.controller";

const router = Router();

router.get("/", ClientController.list);

router.get("/:id", ClientController.getById);

router.post("/", ClientController.create);

router.put("/:id", ClientController.update);

router.delete("/:id", ClientController.remove);

export default router;
