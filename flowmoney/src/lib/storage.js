import { toIsoLocal } from "./period.js";

export const STORAGE_KEY = "flowmoney-demo-v1";
export const DEFAULT_WEEKLY_ALERT = 100;

function daysAgo(n, reference = new Date()) {
    const d = new Date(reference);
    d.setHours(12, 0, 0, 0);
    d.setDate(d.getDate() - n);
    return toIsoLocal(d);
}

function makeExpense(date, description, amount, createdOffsetMs = 0) {
    return {
        id: crypto.randomUUID(),
        date,
        description,
        amount,
        createdAt: new Date(Date.now() - createdOffsetMs).toISOString()
    };
}

/** Spese di esempio distribuite su settimana/mese corrente. */
export function createSeedData(reference = new Date()) {
    const expenses = [
        makeExpense(daysAgo(0, reference), "Caffè", 2.5, 1),
        makeExpense(daysAgo(0, reference), "Pranzo", 12.9, 2),
        makeExpense(daysAgo(1, reference), "Spesa supermercato", 48.3, 3),
        makeExpense(daysAgo(2, reference), "Abbonamento metro", 35, 4),
        makeExpense(daysAgo(3, reference), "Streaming", 9.99, 5),
        makeExpense(daysAgo(4, reference), "Benzina", 55, 6),
        makeExpense(daysAgo(5, reference), "Cena fuori", 32.5, 7),
        makeExpense(daysAgo(8, reference), "Farmacia", 14.8, 8),
        makeExpense(daysAgo(12, reference), "Palestra", 39, 9),
        makeExpense(daysAgo(18, reference), "Regalo", 25, 10),
        makeExpense(daysAgo(25, reference), "Bolletta luce", 67.4, 11)
    ];

    return {
        expenses,
        settings: {
            weeklyAlert: DEFAULT_WEEKLY_ALERT
        }
    };
}

export function loadState() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) {
            const seed = createSeedData();
            saveState(seed);
            return seed;
        }

        const parsed = JSON.parse(raw);
        if (!parsed || !Array.isArray(parsed.expenses)) {
            const seed = createSeedData();
            saveState(seed);
            return seed;
        }

        return {
            expenses: parsed.expenses,
            settings: {
                weeklyAlert: Number.isFinite(Number(parsed.settings?.weeklyAlert))
                    ? Number(parsed.settings.weeklyAlert)
                    : DEFAULT_WEEKLY_ALERT
            }
        };
    } catch {
        const seed = createSeedData();
        saveState(seed);
        return seed;
    }
}

export function saveState(state) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function resetState() {
    const seed = createSeedData();
    saveState(seed);
    return seed;
}
