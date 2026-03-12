import dotenv from "dotenv";

dotenv.config();

function required(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }

  return value;
}

export const ENV = {
  PORT: Number(process.env.PORT || 4000),
  DATABASE_URL: required("DATABASE_URL"),
  JWT_SECRET: required("JWT_SECRET"),
  CORS_ORIGIN: process.env.CORS_ORIGIN || "*",
};