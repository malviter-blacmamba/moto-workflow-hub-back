"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServiceController = void 0;
const service_service_1 = require("./service.service");
class ServiceController {
    static async create(req, res) {
        try {
            const service = await service_service_1.ServiceService.create(req.body);
            res.status(201).json(service);
        }
        catch (err) {
            res.status(400).json({ error: err.message });
        }
    }
    static async getById(req, res) {
        try {
            const id = Number(req.params.id);
            const service = await service_service_1.ServiceService.getById(id);
            if (!service)
                return res.status(404).json({ error: "Servicio no encontrado" });
            res.json(service);
        }
        catch (err) {
            res.status(400).json({ error: err.message });
        }
    }
    static async update(req, res) {
        try {
            const id = Number(req.params.id);
            const service = await service_service_1.ServiceService.update(id, req.body);
            res.json(service);
        }
        catch (err) {
            res.status(400).json({ error: err.message });
        }
    }
    static async delete(req, res) {
        try {
            const id = Number(req.params.id);
            await service_service_1.ServiceService.delete(id);
            res.status(204).send();
        }
        catch (err) {
            res.status(400).json({ error: err.message });
        }
    }
    static async list(req, res) {
        try {
            const { search, maintenanceRule } = req.query;
            const page = req.query.page ? Number(req.query.page) : 1;
            const pageSize = req.query.pageSize ? Number(req.query.pageSize) : 10;
            const result = await service_service_1.ServiceService.list({
                search: search || "",
                maintenanceRule: maintenanceRule,
                page,
                pageSize,
            });
            res.json(result);
        }
        catch (err) {
            res.status(400).json({ error: err.message });
        }
    }
}
exports.ServiceController = ServiceController;
