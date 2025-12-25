"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReminderController = void 0;
const reminder_service_1 = require("./reminder.service");
class ReminderController {
    static async create(req, res) {
        try {
            const reminder = await reminder_service_1.ReminderService.create(req.body);
            res.status(201).json(reminder);
        }
        catch (err) {
            res.status(400).json({ error: err.message });
        }
    }
    static async getById(req, res) {
        try {
            const id = Number(req.params.id);
            const reminder = await reminder_service_1.ReminderService.getById(id);
            if (!reminder) {
                return res.status(404).json({ error: "Recordatorio no encontrado" });
            }
            res.json(reminder);
        }
        catch (err) {
            res.status(400).json({ error: err.message });
        }
    }
    static async update(req, res) {
        try {
            const id = Number(req.params.id);
            const reminder = await reminder_service_1.ReminderService.update(id, req.body);
            res.json(reminder);
        }
        catch (err) {
            res.status(400).json({ error: err.message });
        }
    }
    static async delete(req, res) {
        try {
            const id = Number(req.params.id);
            await reminder_service_1.ReminderService.delete(id);
            res.status(204).send();
        }
        catch (err) {
            res.status(400).json({ error: err.message });
        }
    }
    static async list(req, res) {
        try {
            const { search, clientId, motorcycleId, serviceId, channel, status, dateFrom, dateTo, } = req.query;
            const page = req.query.page ? Number(req.query.page) : 1;
            const pageSize = req.query.pageSize ? Number(req.query.pageSize) : 10;
            const result = await reminder_service_1.ReminderService.list({
                search: search,
                clientId: clientId ? Number(clientId) : undefined,
                motorcycleId: motorcycleId ? Number(motorcycleId) : undefined,
                serviceId: serviceId ? Number(serviceId) : undefined,
                channel: channel,
                status: status,
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
    static async markSent(req, res) {
        try {
            const id = Number(req.params.id);
            const updated = await reminder_service_1.ReminderService.markSent(id);
            res.json(updated);
        }
        catch (err) {
            res.status(400).json({ error: err.message });
        }
    }
    static async markCompleted(req, res) {
        try {
            const id = Number(req.params.id);
            const updated = await reminder_service_1.ReminderService.markCompleted(id);
            res.json(updated);
        }
        catch (err) {
            res.status(400).json({ error: err.message });
        }
    }
}
exports.ReminderController = ReminderController;
