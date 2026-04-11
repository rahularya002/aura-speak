import path from "node:path";

export const DATA_DIR = path.join(process.cwd(), ".data");
export const CONFIG_PATH = path.join(DATA_DIR, "assistant-config.json");
export const VECTOR_STORE_PATH = path.join(DATA_DIR, "vector-store.json");
export const UPLOADS_DIR = path.join(DATA_DIR, "uploads");
