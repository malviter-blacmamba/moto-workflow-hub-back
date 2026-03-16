import { Response } from "express";
import { MotorcycleService } from "./motorcycle.service";
import type { motorcycle_type } from "@prisma/client";
import type { AuthRequest } from "../middleware/auth";

export class MotorcycleController {
  static async create(req: AuthRequest, res: Response) {
    try {
      if (!req.user?.id) {
        return res.status(401).json({ error: "Usuario no autenticado" });
      }
      // Pasamos el ID del usuario para que el servicio genere la notificación
      const moto = await MotorcycleService.create(req.body, req.user.id);
      res.status(201).json(moto);
    } catch (err: any) {
      res.status(400).json({ error: err.message ?? "Error al crear vehículo" });
    }
  }

  static async getById(req: AuthRequest, res: Response) {
    try {
      const id = Number(req.params.id);
      const moto = await MotorcycleService.getById(id);

      if (!moto) {
        return res.status(404).json({ error: "Vehículo no encontrado" });
      }

      res.json(moto);
    } catch (err: any) {
      res.status(400).json({ error: err.message ?? "Error al obtener vehículo" });
    }
  }

  static async update(req: AuthRequest, res: Response) {
    try {
      const id = Number(req.params.id);
      const moto = await MotorcycleService.update(id, req.body);
      res.json(moto);
    } catch (err: any) {
      res.status(400).json({ error: err.message ?? "Error al actualizar vehículo" });
    }
  }

  static async delete(req: AuthRequest, res: Response) {
    try {
      const id = Number(req.params.id);
      await MotorcycleService.delete(id);
      res.status(204).send();
    } catch (err: any) {
      res.status(400).json({ error: err.message ?? "Error al eliminar vehículo" });
    }
  }

  static async list(req: AuthRequest, res: Response) {
    try {
      const { search, clientId, type } = req.query;

      const page = req.query.page ? Number(req.query.page) : 1;
      const pageSize = req.query.pageSize ? Number(req.query.pageSize) : 10;

      const result = await MotorcycleService.list({
        search: (search as string) || "",
        clientId: clientId ? Number(clientId) : undefined,
        type: type ? (type as motorcycle_type) : undefined,
        page,
        pageSize,
      });

      res.json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message ?? "Error al listar vehículos" });
    }
  }
}