import { Response } from "express";
import { ClientService } from "./client.service";
import type { AuthRequest } from "../middleware/auth";

export class ClientController {
  static async list(req: AuthRequest, res: Response) {
    try {
      const { search, page, pageSize } = req.query;

      const result = await ClientService.list({
        search: search?.toString(),
        page: page ? Number(page) : undefined,
        pageSize: pageSize ? Number(pageSize) : undefined,
      });

      res.json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message ?? "Error al listar clientes" });
    }
  }

  static async getById(req: AuthRequest, res: Response) {
    try {
      const id = Number(req.params.id);
      const client = await ClientService.getById(id);
      res.json(client);
    } catch (err: any) {
      const status = err.message === "Cliente no encontrado" ? 404 : 400;
      res.status(status).json({ error: err.message ?? "Error al obtener cliente" });
    }
  }

  static async create(req: AuthRequest, res: Response) {
    try {
      if (!req.user?.id) {
        return res.status(401).json({ error: "Usuario no autenticado" });
      }

      const client = await ClientService.create(req.body, req.user.id);
      res.status(201).json(client);
    } catch (err: any) {
      res.status(400).json({ error: err.message ?? "Error al crear cliente" });
    }
  }

  static async update(req: AuthRequest, res: Response) {
    try {
      const id = Number(req.params.id);
      const client = await ClientService.update(id, req.body);
      res.json(client);
    } catch (err: any) {
      const status = err.message === "Cliente no encontrado" ? 404 : 400;
      res.status(status).json({ error: err.message ?? "Error al actualizar cliente" });
    }
  }

  static async remove(req: AuthRequest, res: Response) {
    try {
      const id = Number(req.params.id);
      const result = await ClientService.remove(id);
      res.json(result);
    } catch (err: any) {
      const status = err.message === "Cliente no encontrado" ? 404 : 400;
      res.status(status).json({ error: err.message ?? "Error al eliminar cliente" });
    }
  }
}