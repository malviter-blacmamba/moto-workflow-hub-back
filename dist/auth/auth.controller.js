"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const auth_service_1 = require("./auth.service");
class AuthController {
    static async register(req, res) {
        try {
            const body = req.body;
            const user = await auth_service_1.AuthService.register(body);
            return res.status(201).json(user);
        }
        catch (err) {
            return res
                .status(400)
                .json({ error: err.message ?? "Error en registro" });
        }
    }
    static async login(req, res) {
        try {
            const body = req.body;
            const result = await auth_service_1.AuthService.login(body);
            return res.json(result);
        }
        catch (err) {
            return res.status(400).json({ error: err.message ?? "Error en login" });
        }
    }
}
exports.AuthController = AuthController;
