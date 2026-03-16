import { Response } from "express";
import { ReportService } from "./report.service";
import type { AuthRequest } from "../middleware/auth";

export class ReportController {
    static async dashboard(req: AuthRequest, res: Response) {
        try {
            const { dateFrom, dateTo, groupBy } = req.query;

            const data = await ReportService.getDashboardSummary({
                dateFrom: dateFrom as string | undefined,
                dateTo: dateTo as string | undefined,
                groupBy: groupBy as "day" | "week" | "month" | undefined,
            });

            res.json(data);
        } catch (err: any) {
            res.status(400).json({ error: err.message ?? "Error al cargar reportes" });
        }
    }

    static async topServices(req: AuthRequest, res: Response) {
        try {
            const { dateFrom, dateTo, limit } = req.query;

            const data = await ReportService.getTopServices({
                dateFrom: dateFrom as string | undefined,
                dateTo: dateTo as string | undefined,
                limit: limit ? Number(limit) : undefined,
            });

            res.json(data);
        } catch (err: any) {
            res.status(400).json({ error: err.message ?? "Error al cargar top services" });
        }
    }

    static async topExtraItems(req: AuthRequest, res: Response) {
        try {
            const { dateFrom, dateTo, limit } = req.query;

            const data = await ReportService.getTopExtraItems({
                dateFrom: dateFrom as string | undefined,
                dateTo: dateTo as string | undefined,
                limit: limit ? Number(limit) : undefined,
            });

            res.json(data);
        } catch (err: any) {
            res.status(400).json({ error: err.message ?? "Error al cargar top refacciones" });
        }
    }
}