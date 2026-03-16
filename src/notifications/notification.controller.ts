import { Response } from "express";
import { NotificationService } from "./notification.service";
import type { AuthRequest } from "../middleware/auth";

export class NotificationController {
  static async listMine(req: AuthRequest, res: Response) {
    try {
      if (!req.user?.id) {
        return res.status(401).json({ error: "Usuario no autenticado" });
      }

      const isRead =
        req.query.isRead === "true"
          ? true
          : req.query.isRead === "false"
          ? false
          : undefined;

      const page = req.query.page ? Number(req.query.page) : 1;
      const pageSize = req.query.pageSize ? Number(req.query.pageSize) : 20;

      const result = await NotificationService.listByUser(req.user.id, {
        isRead,
        page,
        pageSize,
      });

      res.json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message ?? "Error al listar notificaciones" });
    }
  }

  static async markAsRead(req: AuthRequest, res: Response) {
    try {
      if (!req.user?.id) {
        return res.status(401).json({ error: "Usuario no autenticado" });
      }

      const id = Number(req.params.id);
      const result = await NotificationService.markAsRead(id, req.user.id);
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message ?? "Error al marcar notificación" });
    }
  }

  static async markAllAsRead(req: AuthRequest, res: Response) {
    try {
      if (!req.user?.id) {
        return res.status(401).json({ error: "Usuario no autenticado" });
      }

      const result = await NotificationService.markAllAsRead(req.user.id);
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message ?? "Error al marcar todas como leídas" });
    }
  }

  static async remove(req: AuthRequest, res: Response) {
    try {
      if (!req.user?.id) {
        return res.status(401).json({ error: "Usuario no autenticado" });
      }

      const id = Number(req.params.id);
      const result = await NotificationService.remove(id, req.user.id);
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message ?? "Error al eliminar notificación" });
    }
  }
}