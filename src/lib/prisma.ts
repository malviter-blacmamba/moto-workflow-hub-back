// src/lib/prisma.ts
import "dotenv/config"; // para asegurar que DATABASE_URL esté cargada
import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

const dbUrl = new URL(process.env.DATABASE_URL!);

// Armamos el adapter a partir de la DATABASE_URL
const adapter = new PrismaMariaDb({
  host: dbUrl.hostname,
  port: parseInt(dbUrl.port || "3306", 10),
  user: dbUrl.username,
  password: dbUrl.password,
  database: dbUrl.pathname.slice(1), // quita el "/" inicial
});

// PrismaClient usando el adapter
const prisma = new PrismaClient({ adapter });

export default prisma;
