import type { Response } from "express";
import { SearchService } from "./search.service";
import type { AuthRequest } from "../middleware/auth";

export class SearchController {
    static async global(req: AuthRequest, res: Response) {
        try {
            const q = typeof req.query.q === "string" ? req.query.q : "";
            const limit =
                typeof req.query.limit === "string" ? Number(req.query.limit) : undefined;

            const result = await SearchService.globalSearch({
                q,
                limit,
            });

            res.json(result);
        } catch (err: any) {
            res.status(400).json({ error: err.message ?? "Error en búsqueda global" });
        }
    }
}