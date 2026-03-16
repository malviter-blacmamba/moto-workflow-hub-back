import prisma from "./lib/prisma";
import app from "./app";
import { ENV } from "./config/env";
import { initJobs } from "./jobs";

const port = Number(ENV.PORT || 4000);

async function bootstrap() {
  await prisma.$connect();
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
    initJobs();
  });
}

bootstrap().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});