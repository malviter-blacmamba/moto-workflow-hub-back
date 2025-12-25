"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminMiddleware = void 0;
const adminMiddleware = (req, res, next) => {
    const user = req.user;
    if (!user || user.role !== "ADMIN") {
        return res.status(403).json({ error: "Acceso restringido a administradores" });
    }
    next();
};
exports.adminMiddleware = adminMiddleware;
