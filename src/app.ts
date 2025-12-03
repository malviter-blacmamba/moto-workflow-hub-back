import express from "express";
import cors from "cors";
import { errorHandler } from "./middleware/errorHandler";
import router from "./routes";
import authRoutes from "./auth/auth.routes";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api", router);
app.use("/api/auth", authRoutes);

app.use(errorHandler);

export default app;
