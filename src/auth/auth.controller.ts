import { Request, Response } from "express";
import { AuthService } from "./auth.service";
import type { RegisterDTO, LoginDTO } from "./auth.types";

export class AuthController {
  static async register(req: Request, res: Response) {
    try {
      const body = req.body as RegisterDTO;
      const user = await AuthService.register(body);
      return res.status(201).json(user);
    } catch (err: any) {
      return res
        .status(400)
        .json({ error: err.message ?? "Error en registro" });
    }
  }

  static async login(req: Request, res: Response) {
    try {
      const body = req.body as LoginDTO;
      const result = await AuthService.login(body);
      return res.json(result);
    } catch (err: any) {
      return res.status(400).json({ error: err.message ?? "Error en login" });
    }
  }
}
