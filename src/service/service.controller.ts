import { Response } from "express";
import { ServiceService } from "./service.service";
import type { service_maintenanceRule, service_vehicleType } from "@prisma/client";
import type { AuthRequest } from "../middleware/auth";

export class ServiceController {
  static async create(req: AuthRequest, res: Response) {
    try {
      const service = await ServiceService.create(req.body);
      res.status(201).json(service);
    } catch (err: any) {
      res.status(400).json({ error: err.message ?? "Error al crear servicio" });
    }
  }

  static async getById(req: AuthRequest, res: Response) {
    try {
      const id = Number(req.params.id);
      const service = await ServiceService.getById(id);

      if (!service) {
        return res.status(404).json({ error: "Servicio no encontrado" });
      }

      res.json(service);
    } catch (err: any) {
      res.status(400).json({ error: err.message ?? "Error al obtener servicio" });
    }
  }

  static async update(req: AuthRequest, res: Response) {
    try {
      const id = Number(req.params.id);
      const service = await ServiceService.update(id, req.body);
      res.json(service);
    } catch (err: any) {
      const status = err.message === "Servicio no encontrado" ? 404 : 400;
      res.status(status).json({ error: err.message ?? "Error al actualizar servicio" });
    }
  }

  static async delete(req: AuthRequest, res: Response) {
    try {
      const id = Number(req.params.id);
      await ServiceService.delete(id);
      res.status(204).send();
    } catch (err: any) {
      const status = err.message === "Servicio no encontrado" ? 404 : 400;
      res.status(status).json({ error: err.message ?? "Error al eliminar servicio" });
    }
  }

  static async list(req: AuthRequest, res: Response) {
    try {
      const { search, maintenanceRule, vehicleType } = req.query;

      const page = req.query.page ? Number(req.query.page) : 1;
      const pageSize = req.query.pageSize ? Number(req.query.pageSize) : 10;

      const result = await ServiceService.list({
        search: (search as string) || "",
        vehicleType: vehicleType as service_vehicleType | undefined,
        maintenanceRule: maintenanceRule as service_maintenanceRule | undefined,
        page,
        pageSize,
      });

      res.json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message ?? "Error al listar servicios" });
    }
  }
}