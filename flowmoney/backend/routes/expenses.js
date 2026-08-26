import { Router } from "express";
import { requireAuth } from "../lib/session.js";
import {
    listExpenses,
    getExpense,
    sumExpenses,
    sumExpensesByDay,
    createExpense,
    updateExpense,
    deleteExpenses,
    mostUsedAmounts
} from "../lib/expenses.js";
import { getWeeklyAlert } from "../lib/settings.js";

const router = Router();
const MAX_DESCRIPTION_LENGTH = 500;
const MAX_LIST_LIMIT = 500;

function toIsoLocal(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const dayNum = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${dayNum}`;
}

function eachIsoDay(from, to) {
    const days = [];
    const [year, month, day] = from.split("-").map(Number);
    const cursor = new Date(year, month - 1, day);

    while (toIsoLocal(cursor) <= to) {
        days.push(toIsoLocal(cursor));
        cursor.setDate(cursor.getDate() + 1);
    }

    return days;
}

/** Lunedì–domenica (locale) in YYYY-MM-DD */
export function weekRange(reference = new Date()) {
    const d = new Date(reference);
    d.setHours(12, 0, 0, 0);
    const day = d.getDay();
    const toMonday = day === 0 ? -6 : 1 - day;

    const start = new Date(d);
    start.setDate(d.getDate() + toMonday);

    const end = new Date(start);
    end.setDate(start.getDate() + 6);

    return {
        start: toIsoLocal(start),
        end: toIsoLocal(end)
    };
}

/** Ultime N settimane lun–dom, dalla più vecchia alla corrente */
export function lastNWeeks(n = 8, reference = new Date()) {
    const { start: currentStart } = weekRange(reference);
    const [year, month, day] = currentStart.split("-").map(Number);
    const monday = new Date(year, month - 1, day);
    const weeks = [];

    for (let i = n - 1; i >= 0; i -= 1) {
        const start = new Date(monday);
        start.setDate(monday.getDate() - i * 7);
        const end = new Date(start);
        end.setDate(start.getDate() + 6);
        weeks.push({
            start: toIsoLocal(start),
            end: toIsoLocal(end)
        });
    }

    return weeks;
}

/** Primo–ultimo giorno del mese (locale) in YYYY-MM-DD */
export function monthRange(reference = new Date()) {
    const d = new Date(reference);
    const start = new Date(d.getFullYear(), d.getMonth(), 1);
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
    return {
        start: toIsoLocal(start),
        end: toIsoLocal(end)
    };
}

/** 1 gennaio – 31 dicembre in YYYY-MM-DD */
export function yearRange(reference = new Date()) {
    const y = new Date(reference).getFullYear();
    return {
        start: `${y}-01-01`,
        end: `${y}-12-31`
    };
}

const PERIODS = new Set(["week", "month", "year"]);

function parsePeriod(value) {
    return PERIODS.has(value) ? value : "week";
}

function periodRange(period, reference = new Date()) {
    if (period === "month") {
        return monthRange(reference);
    }
    if (period === "year") {
        return yearRange(reference);
    }
    return weekRange(reference);
}

function lastNMonths(n = 12, reference = new Date()) {
    const d = new Date(reference);
    const months = [];

    for (let i = n - 1; i >= 0; i -= 1) {
        const start = new Date(d.getFullYear(), d.getMonth() - i, 1);
        const end = new Date(d.getFullYear(), d.getMonth() - i + 1, 0);
        months.push({
            start: toIsoLocal(start),
            end: toIsoLocal(end)
        });
    }

    return months;
}

function lastNYears(n = 5, reference = new Date()) {
    const y = new Date(reference).getFullYear();
    const years = [];

    for (let i = n - 1; i >= 0; i -= 1) {
        years.push({
            start: `${y - i}-01-01`,
            end: `${y - i}-12-31`
        });
    }

    return years;
}

function parseExpenseBody(body) {
    const date = String(body?.date || "").trim();
    const description = String(body?.description || "").trim();
    const amount = Number(body?.amount);

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return { error: "Data non valida" };
    }
    if (!Number.isFinite(amount) || amount <= 0) {
        return { error: "Importo non valido" };
    }
    if (description.length > MAX_DESCRIPTION_LENGTH) {
        return { error: "Descrizione troppo lunga" };
    }

    return { date, description, amount };
}

router.use(requireAuth);

router.get("/home", async (req, res) => {
    try {
        const period = parsePeriod(req.query.period);
        const { start, end } = periodRange(period);
        const [total, alertExpense, recent] = await Promise.all([
            sumExpenses({ from: start, to: end }),
            getWeeklyAlert(),
            listExpenses({ from: start, to: end, limit: MAX_LIST_LIMIT })
        ]);

        res.json({
            summary: {
                period,
                start,
                end,
                total
            },
            alertExpense,
            recent
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Dettaglio del periodo corrente:
 * week/month → un punto per giorno, year → un punto per mese.
 */
router.get("/breakdown", async (req, res) => {
    try {
        const period = parsePeriod(req.query.period);
        const { start, end } = periodRange(period);
        const totals = await sumExpensesByDay({ from: start, to: end });

        let points;
        if (period === "year") {
            const byMonth = new Map();
            for (const [date, total] of totals) {
                const key = date.slice(0, 7);
                byMonth.set(key, (byMonth.get(key) || 0) + total);
            }
            const year = start.slice(0, 4);
            points = Array.from({ length: 12 }, (_, i) => {
                const key = `${year}-${String(i + 1).padStart(2, "0")}`;
                return { key, total: byMonth.get(key) || 0 };
            });
        } else {
            points = eachIsoDay(start, end).map((date) => ({
                key: date,
                total: totals.get(date) || 0
            }));
        }

        res.json({ period, start, end, points });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Storico: ultime 8 settimane / 12 mesi / 5 anni.
 */
router.get("/history", async (req, res) => {
    try {
        const period = parsePeriod(req.query.period);
        const buckets =
            period === "month"
                ? lastNMonths(12)
                : period === "year"
                    ? lastNYears(5)
                    : lastNWeeks(8);

        const start = buckets[0].start;
        const end = buckets[buckets.length - 1].end;
        const totals = await sumExpensesByDay({ from: start, to: end });

        const points = buckets.map((bucket) => ({ ...bucket, total: 0 }));
        for (const [date, total] of totals) {
            const bucket = points.find(
                (point) => date >= point.start && date <= point.end
            );
            if (bucket) {
                bucket.total += total;
            }
        }

        res.json({ period, start, end, points });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

router.get("/most-used-amounts", async (_req, res) => {
    try {
        const amounts = await mostUsedAmounts(5);
        res.json({ amounts });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

router.get("/", async (req, res) => {
    try {
        const expenses = await listExpenses({
            from: req.query.from,
            to: req.query.to,
            limit: Number(req.query.limit) || 50
        });
        res.json({ expenses });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

router.get("/:id", async (req, res) => {
    try {
        const expense = await getExpense(String(req.params.id || "").trim());
        if (!expense) {
            return res.status(404).json({ error: "Spesa non trovata" });
        }
        res.json({ expense });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

router.post("/", async (req, res) => {
    try {
        const parsed = parseExpenseBody(req.body);
        if (parsed.error) {
            return res.status(400).json({ error: parsed.error });
        }

        const expense = await createExpense(parsed);
        res.status(201).json({ expense });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

router.put("/:id", async (req, res) => {
    try {
        const id = String(req.params.id || "").trim();
        if (!id) {
            return res.status(400).json({ error: "Id spesa mancante" });
        }

        const parsed = parseExpenseBody(req.body);
        if (parsed.error) {
            return res.status(400).json({ error: parsed.error });
        }

        const expense = await updateExpense(id, parsed);
        res.json({ expense });
    } catch (error) {
        console.error(error);
        res.status(error.status || 500).json({ error: error.message });
    }
});

router.delete("/", async (req, res) => {
    try {
        const rawIds = Array.isArray(req.body?.ids) ? req.body.ids : [];
        const ids = [];
        const seen = new Set();
        for (const id of rawIds) {
            const cleaned = String(id || "").trim();
            if (!cleaned || seen.has(cleaned)) {
                continue;
            }
            seen.add(cleaned);
            ids.push(cleaned);
        }

        if (ids.length === 0) {
            return res.status(400).json({ error: "Nessuna spesa selezionata" });
        }
        if (ids.length > 100) {
            return res.status(400).json({ error: "Troppe spese selezionate" });
        }

        await deleteExpenses(ids);
        res.json({ deleted: ids.length });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
