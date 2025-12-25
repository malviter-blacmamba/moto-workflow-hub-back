"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportController = void 0;
const report_service_1 = require("./report.service");
class ReportController {
    static async dashboard(req, res) {
        try {
            const { dateFrom, dateTo } = req.query;
            const data = await report_service_1.ReportService.getDashboardSummary({
                dateFrom: dateFrom,
                dateTo: dateTo,
            });
            res.json(data);
        }
        catch (err) {
            res.status(400).json({ error: err.message });
        }
    }
    static async topServices(req, res) {
        try {
            const { dateFrom, dateTo, limit } = req.query;
            const data = await report_service_1.ReportService.getTopServices({
                dateFrom: dateFrom,
                dateTo: dateTo,
                limit: limit ? Number(limit) : undefined,
            });
            res.json(data);
        }
        catch (err) {
            res.status(400).json({ error: err.message });
        }
    }
}
exports.ReportController = ReportController;
