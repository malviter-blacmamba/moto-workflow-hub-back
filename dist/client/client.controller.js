"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClientController = void 0;
const client_service_1 = require("./client.service");
class ClientController {
    static async list(req, res) {
        try {
            const { search, page, pageSize } = req.query;
            const result = await client_service_1.ClientService.list({
                search: search?.toString(),
                page: page ? Number(page) : undefined,
                pageSize: pageSize ? Number(pageSize) : undefined,
            });
            res.json(result);
        }
        catch (err) {
            res.status(400).json({ error: err.message });
        }
    }
    static async getById(req, res) {
        try {
            const id = Number(req.params.id);
            const client = await client_service_1.ClientService.getById(id);
            res.json(client);
        }
        catch (err) {
            res.status(404).json({ error: err.message });
        }
    }
    static async create(req, res) {
        try {
            const client = await client_service_1.ClientService.create(req.body);
            res.status(201).json(client);
        }
        catch (err) {
            res.status(400).json({ error: err.message });
        }
    }
    static async update(req, res) {
        try {
            const id = Number(req.params.id);
            const client = await client_service_1.ClientService.update(id, req.body);
            res.json(client);
        }
        catch (err) {
            const status = err.message === "Cliente no encontrado" ? 404 : 400;
            res.status(status).json({ error: err.message });
        }
    }
    static async remove(req, res) {
        try {
            const id = Number(req.params.id);
            const result = await client_service_1.ClientService.remove(id);
            res.json(result);
        }
        catch (err) {
            const status = err.message === "Cliente no encontrado" ? 404 : 400;
            res.status(status).json({ error: err.message });
        }
    }
}
exports.ClientController = ClientController;
