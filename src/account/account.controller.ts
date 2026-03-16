import { Response } from "express";
import { AccountService } from "./account.service";
import type { AuthRequest } from "../middleware/auth";

export class AccountController {
    static async getMe(req: AuthRequest, res: Response) {
        try {
            if (!req.user?.id) {
                return res.status(401).json({ error: "Usuario no autenticado" });
            }

            const user = await AccountService.getMe(req.user.id);
            res.json(user);
        } catch (err: any) {
            res.status(400).json({ error: err.message ?? "Error al obtener perfil" });
        }
    }

    static async updateProfile(req: AuthRequest, res: Response) {
        try {
            if (!req.user) {
                return res.status(401).json({ error: "Usuario no autenticado" });
            }

            const user = await AccountService.updateProfile(req.user, req.body);
            res.json(user);
        } catch (err: any) {
            res.status(400).json({ error: err.message ?? "Error al actualizar perfil" });
        }
    }

    static async changePassword(req: AuthRequest, res: Response) {
        try {
            if (!req.user) {
                return res.status(401).json({ error: "Usuario no autenticado" });
            }

            const result = await AccountService.changePassword(req.user, req.body);
            res.json(result);
        } catch (err: any) {
            const status =
                err.message === "Tu rol no puede cambiar la contraseña desde esta sección"
                    ? 403
                    : 400;

            res.status(status).json({
                error: err.message ?? "Error al cambiar contraseña",
            });
        }
    }
}