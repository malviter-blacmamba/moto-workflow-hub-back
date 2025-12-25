"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_routes_1 = __importDefault(require("../auth/auth.routes"));
const client_routes_1 = __importDefault(require("../client/client.routes"));
const motorcycle_routes_1 = __importDefault(require("../motorcycle/motorcycle.routes"));
const service_routes_1 = __importDefault(require("../service/service.routes"));
const promotion_routes_1 = __importDefault(require("../promotion/promotion.routes"));
const promotion_rule_routes_1 = __importDefault(require("../promotion-rules/promotion-rule.routes"));
const workorder_routes_1 = __importDefault(require("../workorder/workorder.routes"));
const reminder_routes_1 = __importDefault(require("../reminder/reminder.routes"));
const report_routes_1 = __importDefault(require("../report/report.routes"));
const user_routes_1 = __importDefault(require("../user/user.routes"));
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.use("/auth", auth_routes_1.default);
router.get("/status", (req, res) => {
    res.json({ ok: true, message: "Backend funcionando ✔️" });
});
router.get("/protected", auth_1.authMiddleware, (req, res) => {
    res.json({ message: "Acceso autorizado", user: req.user });
});
router.use("/clients", auth_1.authMiddleware, client_routes_1.default);
router.use("/motorcycles", motorcycle_routes_1.default);
router.use("/services", service_routes_1.default);
router.use("/promotions", promotion_routes_1.default);
router.use("/promotion-rules", promotion_rule_routes_1.default);
router.use("/work-orders", workorder_routes_1.default);
router.use("/reminders", reminder_routes_1.default);
router.use("/reports", report_routes_1.default);
router.use("/users", user_routes_1.default);
exports.default = router;
