import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

const rootDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
dotenv.config({ path: path.join(rootDir, ".env") });

let client;

export function getSupabase() {
    if (client) {
        return client;
    }

    const url = process.env.SUPABASE_URL;
    const key =
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;

    if (!url || !key) {
        throw new Error("SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY mancante");
    }

    client = createClient(url, key, {
        auth: {
            persistSession: false,
            autoRefreshToken: false
        }
    });

    return client;
}
