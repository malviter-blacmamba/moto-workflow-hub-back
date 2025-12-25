"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkOrderController = void 0;
const workorder_service_1 = require("./workorder.service");
const pdfkit_1 = __importDefault(require("pdfkit"));
class WorkOrderController {
    static async create(req, res) {
        try {
            const workOrder = await workorder_service_1.WorkOrderService.create(req.body);
            res.status(201).json(workOrder);
        }
        catch (err) {
            res.status(400).json({ error: err.message });
        }
    }
    static async getById(req, res) {
        try {
            const id = Number(req.params.id);
            const workOrder = await workorder_service_1.WorkOrderService.getById(id);
            if (!workOrder) {
                return res
                    .status(404)
                    .json({ error: "Orden de trabajo no encontrada" });
            }
            res.json(workOrder);
        }
        catch (err) {
            res.status(400).json({ error: err.message });
        }
    }
    static async update(req, res) {
        try {
            const id = Number(req.params.id);
            const workOrder = await workorder_service_1.WorkOrderService.update(id, req.body);
            res.json(workOrder);
        }
        catch (err) {
            res.status(400).json({ error: err.message });
        }
    }
    static async delete(req, res) {
        try {
            const id = Number(req.params.id);
            await workorder_service_1.WorkOrderService.delete(id);
            res.status(204).send();
        }
        catch (err) {
            res.status(400).json({ error: err.message });
        }
    }
    static async list(req, res) {
        try {
            const { search, status, clientId, motorcycleId, dateFrom, dateTo, } = req.query;
            const page = req.query.page ? Number(req.query.page) : 1;
            const pageSize = req.query.pageSize ? Number(req.query.pageSize) : 10;
            const result = await workorder_service_1.WorkOrderService.list({
                search: search,
                status: status,
                clientId: clientId ? Number(clientId) : undefined,
                motorcycleId: motorcycleId ? Number(motorcycleId) : undefined,
                dateFrom: dateFrom,
                dateTo: dateTo,
                page,
                pageSize,
            });
            res.json(result);
        }
        catch (err) {
            res.status(400).json({ error: err.message });
        }
    }
    static async changeStatus(req, res) {
        try {
            const id = Number(req.params.id);
            const { status } = req.body;
            const updated = await workorder_service_1.WorkOrderService.changeStatus(id, status);
            res.json(updated);
        }
        catch (err) {
            res.status(400).json({ error: err.message });
        }
    }
    static async downloadPdf(req, res) {
        try {
            const id = Number(req.params.id);
            const workOrder = await workorder_service_1.WorkOrderService.getById(id);
            if (!workOrder) {
                return res
                    .status(404)
                    .json({ error: "Orden de trabajo no encontrada" });
            }
            const filename = `${workOrder.code}.pdf`;
            res.setHeader("Content-Type", "application/pdf");
            res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
            const doc = new pdfkit_1.default({ size: "A4", margin: 50 });
            doc.pipe(res);
            doc
                .fontSize(20)
                .text(`Orden de trabajo ${workOrder.code}`, { align: "center" })
                .moveDown();
            doc.fontSize(12);
            doc.text(`Fecha de orden: ${new Date(workOrder.date).toLocaleDateString()}`);
            doc.text(`Cliente: ${workOrder.client?.name ?? workOrder.clientId}`);
            doc.text(`Moto: ${workOrder.motorcycle?.brand ?? ""} ${workOrder.motorcycle?.model ?? ""} - ${workOrder.motorcycle?.plate ?? ""}`);
            doc.moveDown();
            doc.fontSize(14).text("Servicios", { underline: true });
            doc.moveDown(0.5);
            if (workOrder.services.length === 0) {
                doc.fontSize(12).text("Sin servicios registrados");
            }
            else {
                workOrder.services.forEach((item) => {
                    const name = item.service?.name ?? `Servicio #${item.serviceId}`;
                    doc
                        .fontSize(12)
                        .text(`${name}  x${item.quantity}  -  $${Number(item.total).toLocaleString()}`);
                });
            }
            doc.moveDown();
            doc.fontSize(14).text("Piezas / Items adicionales", { underline: true });
            doc.moveDown(0.5);
            if (workOrder.extraItems.length === 0) {
                doc.fontSize(12).text("Sin piezas adicionales");
            }
            else {
                workOrder.extraItems.forEach((item) => {
                    doc
                        .fontSize(12)
                        .text(`${item.name}  x${item.quantity}  -  $${Number(item.total).toLocaleString()}`);
                });
            }
            doc.moveDown();
            doc.moveDown();
            doc.fontSize(14).text("Totales", { underline: true });
            doc.moveDown(0.5);
            doc.fontSize(12).text(`Subtotal: $${Number(workOrder.subtotal).toFixed(2)}`);
            doc.fontSize(12).text(`Total: $${Number(workOrder.total).toFixed(2)}`);
            if (workOrder.notes) {
                doc.moveDown();
                doc.fontSize(14).text("Notas", { underline: true });
                doc.moveDown(0.5);
                doc.fontSize(12).text(workOrder.notes);
            }
            doc.end();
        }
        catch (err) {
            console.error(err);
            res.status(500).json({ error: "Error al generar el PDF" });
        }
    }
}
exports.WorkOrderController = WorkOrderController;
