import type { Request, Response } from "express";
import { ClientService } from "./client.service";

export class ClientController {
  static async list(req: Request, res: Response) {
    try {
      const { search, page, pageSize } = req.query;

      const result = await ClientService.list({
        search: search?.toString(),
        page: page ? Number(page) : undefined,
        pageSize: pageSize ? Number(pageSize) : undefined,
      });

      res.json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }

  static async getById(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const client = await ClientService.getById(id);
      res.json(client);
    } catch (err: any) {
      res.status(404).json({ error: err.message });
    }
  }

  static async create(req: Request, res: Response) {
    try {
      const client = await ClientService.create(req.body);
      res.status(201).json(client);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const client = await ClientService.update(id, req.body);
      res.json(client);
    } catch (err: any) {
      const status = err.message === "Cliente no encontrado" ? 404 : 400;
      res.status(status).json({ error: err.message });
    }
  }

  static async remove(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const result = await ClientService.remove(id);
      res.json(result);
    } catch (err: any) {
      const status = err.message === "Cliente no encontrado" ? 404 : 400;
      res.status(status).json({ error: err.message });
    }
  }
}
