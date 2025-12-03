import { Request, Response } from "express";
import { MotorcycleService } from "./motorcycle.service";

export class MotorcycleController {
  static async create(req: Request, res: Response) {
    try {
      const moto = await MotorcycleService.create(req.body);
      res.status(201).json(moto);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }

  static async getById(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const moto = await MotorcycleService.getById(id);
      if (!moto) return res.status(404).json({ error: "Moto no encontrada" });
      res.json(moto);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const moto = await MotorcycleService.update(id, req.body);
      res.json(moto);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }

  static async delete(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      await MotorcycleService.delete(id);
      res.status(204).send();
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }

  static async list(req: Request, res: Response) {
    try {
      const { search, clientId } = req.query;

      const page = req.query.page ? Number(req.query.page) : 1;
      const pageSize = req.query.pageSize ? Number(req.query.pageSize) : 10;

      const result = await MotorcycleService.list({
        search: (search as string) || "",
        clientId: clientId ? Number(clientId) : undefined,
        page,
        pageSize,
      });

      res.json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }
}
