import { Request, Response } from "express";
import { AuthService } from "./auth.service";
import type { LoginDTO } from "./auth.types";

export class AuthController {
  static async login(req: Request, res: Response) {
    try {
      const body = req.body as LoginDTO;
      const result = await AuthService.login(body);
      return res.status(200).json(result);
    } catch (err: any) {
      return res.status(err.status ?? 400).json({
        error: err.message ?? "Error en login",
      });
    }
  }
}