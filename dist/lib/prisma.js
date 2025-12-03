"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/lib/prisma.ts
require("dotenv/config"); // para asegurar que DATABASE_URL esté cargada
const client_1 = require("@prisma/client");
const adapter_mariadb_1 = require("@prisma/adapter-mariadb");
const dbUrl = new URL(process.env.DATABASE_URL);
// Armamos el adapter a partir de la DATABASE_URL
const adapter = new adapter_mariadb_1.PrismaMariaDb({
    host: dbUrl.hostname,
    port: parseInt(dbUrl.port || "3306", 10),
    user: dbUrl.username,
    password: dbUrl.password,
    database: dbUrl.pathname.slice(1), // quita el "/" inicial
});
// PrismaClient usando el adapter
const prisma = new client_1.PrismaClient({ adapter });
exports.default = prisma;
