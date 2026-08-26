import { Router } from "express";
import { requireAuth } from "../lib/session.js";
import { getWeeklyAlert, setWeeklyAlert } from "../lib/settings.js";

const router = Router();

router.use(requireAuth);

router.get("/weekly-alert", async (_req, res) => {
    try {
        const alertExpense = await getWeeklyAlert();
        res.json({ alertExpense });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

router.put("/weekly-alert", async (req, res) => {
    try {
        const amount = Number(req.body?.alertExpense);

        if (!Number.isFinite(amount) || amount < 0) {
            return res.status(400).json({ error: "Alert non valido" });
        }

        const alertExpense = await setWeeklyAlert(amount);
        res.json({ alertExpense });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
