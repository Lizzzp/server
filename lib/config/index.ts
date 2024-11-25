import { configDotenv } from "dotenv";
configDotenv()
export const DB_SERVER_URL = process.env.DB_SERVER_URL || ""
export const DB_USERNAME = process.env.DB_USERNAME || ""
export const DB_PASSWORD = process.env.DB_PASSWORD || ""
export const DB_PORT = Number(process.env.DB_PORT)