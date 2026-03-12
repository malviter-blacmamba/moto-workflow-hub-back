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

app.use(express.json());

app.use("/api", router);

app.use(errorHandler);

export default app;