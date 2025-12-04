import { Request, Response } from "express";
import { ReportService } from "./report.service";

export class ReportController {
    static async dashboard(req: Request, res: Response) {
        try {
            const { dateFrom, dateTo } = req.query;

            const data = await ReportService.getDashboardSummary({
                dateFrom: dateFrom as string | undefined,
                dateTo: dateTo as string | undefined,
            });

            res.json(data);
        } catch (err: any) {
            res.status(400).json({ error: err.message });
        }
    }

    static async topServices(req: Request, res: Response) {
        try {
            const { dateFrom, dateTo, limit } = req.query;

            const data = await ReportService.getTopServices({
                dateFrom: dateFrom as string | undefined,
                dateTo: dateTo as string | undefined,
                limit: limit ? Number(limit) : undefined,
            });

            res.json(data);
        } catch (err: any) {
            res.status(400).json({ error: err.message });
        }
    }
}
