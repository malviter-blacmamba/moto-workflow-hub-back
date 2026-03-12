import { Response, NextFunction } from "express";
import type { AuthRequest } from "./auth";

export const adminMiddleware = (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    if (!req.user || req.user.role !== "ADMIN") {
        return res.status(403).json({
            error: "Acceso restringido a administradores",
        });
    }

    next();
};