import path from "node:path";

const explicitDataDir = process.env.DATA_DIR?.trim();
const defaultDataDir =
  process.env.VERCEL === "1"
    ? path.join("/tmp", "aura-speak-data")
    : path.join(process.cwd(), ".data");

export const DATA_DIR = explicitDataDir || defaultDataDir;
export const DB_PATH = path.join(DATA_DIR, "app.db");
export const CONFIG_PATH = path.join(DATA_DIR, "assistant-config.json");
export const VECTOR_STORE_PATH = path.join(DATA_DIR, "vector-store.json");
export const UPLOADS_DIR = path.join(DATA_DIR, "uploads");
