import express from "express";
import cors from "cors";
import { errorHandler } from "./middleware/errorHandler";
import router from "./routes";
import { ENV } from "./config/env";

const app = express();

app.use(
    cors({
        origin: ENV.CORS_ORIGIN ?? "*",
        methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
        allowedHeaders: ["Content-Type", "Authorization"],
    })
);

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

app.use("/api", router);

app.use((_req, res) => {
    res.status(404).json({ error: "Ruta no encontrada" });
});

app.use(errorHandler);

export default app;