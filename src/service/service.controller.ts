import { Request, Response } from "express";
import { ServiceService } from "./service.service";
import type { MaintenanceRule } from "./service.types";

export class ServiceController {
  static async create(req: Request, res: Response) {
    try {
      const service = await ServiceService.create(req.body);
      res.status(201).json(service);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }

  static async getById(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const service = await ServiceService.getById(id);
      if (!service) return res.status(404).json({ error: "Servicio no encontrado" });
      res.json(service);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const service = await ServiceService.update(id, req.body);
      res.json(service);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }

  static async delete(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      await ServiceService.delete(id);
      res.status(204).send();
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }

  static async list(req: Request, res: Response) {
    try {
      const { search, maintenanceRule } = req.query;

      const page = req.query.page ? Number(req.query.page) : 1;
      const pageSize = req.query.pageSize ? Number(req.query.pageSize) : 10;

      const result = await ServiceService.list({
        search: (search as string) || "",
        maintenanceRule: maintenanceRule as MaintenanceRule | undefined,
        page,
        pageSize,
      });

      res.json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }
}
