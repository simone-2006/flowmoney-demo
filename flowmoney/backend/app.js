import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import authRoutes from "./routes/auth.js";
import expensesRoutes from "./routes/expenses.js";
import settingsRoutes from "./routes/settings.js";

const rootDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
dotenv.config({ path: path.join(rootDir, ".env") });

const app = express();
const frontendOrigin = process.env.FRONTEND_ORIGIN || "http://localhost:5173";
const isProd = process.env.NODE_ENV === "production";
const corsOrigins = isProd
    ? [frontendOrigin]
    : [frontendOrigin, "http://localhost:5173", "http://127.0.0.1:5173"];

app.set("trust proxy", 1);

app.use(cors({
    origin: corsOrigins,
    credentials: true
}));

app.use(express.json({ limit: "32kb" }));
app.use(cookieParser());
app.use("/api/auth", authRoutes);
app.use("/api/expenses", expensesRoutes);
app.use("/api/settings", settingsRoutes);

app.get("/api/health", (_req, res) => {
    res.json({ ok: true });
});

export default app;
