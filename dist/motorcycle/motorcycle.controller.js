"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MotorcycleController = void 0;
const motorcycle_service_1 = require("./motorcycle.service");
class MotorcycleController {
    static async create(req, res) {
        try {
            const moto = await motorcycle_service_1.MotorcycleService.create(req.body);
            res.status(201).json(moto);
        }
        catch (err) {
            res.status(400).json({ error: err.message });
        }
    }
    static async getById(req, res) {
        try {
            const id = Number(req.params.id);
            const moto = await motorcycle_service_1.MotorcycleService.getById(id);
            if (!moto)
                return res.status(404).json({ error: "Moto no encontrada" });
            res.json(moto);
        }
        catch (err) {
            res.status(400).json({ error: err.message });
        }
    }
    static async update(req, res) {
        try {
            const id = Number(req.params.id);
            const moto = await motorcycle_service_1.MotorcycleService.update(id, req.body);
            res.json(moto);
        }
        catch (err) {
            res.status(400).json({ error: err.message });
        }
    }
    static async delete(req, res) {
        try {
            const id = Number(req.params.id);
            await motorcycle_service_1.MotorcycleService.delete(id);
            res.status(204).send();
        }
        catch (err) {
            res.status(400).json({ error: err.message });
        }
    }
    static async list(req, res) {
        try {
            const { search, clientId } = req.query;
            const page = req.query.page ? Number(req.query.page) : 1;
            const pageSize = req.query.pageSize ? Number(req.query.pageSize) : 10;
            const result = await motorcycle_service_1.MotorcycleService.list({
                search: search || "",
                clientId: clientId ? Number(clientId) : undefined,
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
exports.MotorcycleController = MotorcycleController;
