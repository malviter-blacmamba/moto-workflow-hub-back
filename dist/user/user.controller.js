"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserController = void 0;
const user_service_1 = require("./user.service");
class UserController {
    static async create(req, res) {
        try {
            const user = await user_service_1.UserService.create(req.body);
            res.status(201).json(user);
        }
        catch (err) {
            res.status(400).json({ error: err.message });
        }
    }
    static async getById(req, res) {
        try {
            const id = Number(req.params.id);
            const user = await user_service_1.UserService.getById(id);
            if (!user) {
                return res.status(404).json({ error: "Usuario no encontrado" });
            }
            res.json(user);
        }
        catch (err) {
            res.status(400).json({ error: err.message });
        }
    }
    static async update(req, res) {
        try {
            const id = Number(req.params.id);
            const user = await user_service_1.UserService.update(id, req.body);
            res.json(user);
        }
        catch (err) {
            res.status(400).json({ error: err.message });
        }
    }
    static async delete(req, res) {
        try {
            const id = Number(req.params.id);
            await user_service_1.UserService.delete(id);
            res.status(204).send();
        }
        catch (err) {
            res.status(400).json({ error: err.message });
        }
    }
    static async list(req, res) {
        try {
            const { search, role, status } = req.query;
            const page = req.query.page ? Number(req.query.page) : 1;
            const pageSize = req.query.pageSize ? Number(req.query.pageSize) : 10;
            const result = await user_service_1.UserService.list({
                search: search,
                role: role,
                status: status,
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
            const updated = await user_service_1.UserService.changeStatus(id, status);
            res.json(updated);
        }
        catch (err) {
            res.status(400).json({ error: err.message });
        }
    }
}
exports.UserController = UserController;
