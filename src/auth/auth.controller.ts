// auth.controller.ts
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
      if (err.code === "INACTIVE_USER") {
        return res
          .status(403)
          .json({ error: err.message ?? "Usuario inactivo" });
      }

      return res.status(400).json({ error: err.message ?? "Error en login" });
    }
  }
}
