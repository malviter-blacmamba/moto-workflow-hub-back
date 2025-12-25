import dotenv from "dotenv";
dotenv.config({ path: ".env" });

import app from "./app";
import { ENV } from "./config/env";
import prisma from "./lib/prisma";
const port = Number(ENV.PORT || 4000);

async function bootstrap() {
  await prisma.$connect();
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
}

bootstrap().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
