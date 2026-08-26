import {
    eachIsoDay,
    lastNMonths,
    lastNWeeks,
    lastNYears,
    parsePeriod,
    periodRange
} from "./period.js";
import {
    DEFAULT_WEEKLY_ALERT,
    loadState,
    resetState,
    saveState
} from "./storage.js";

const MAX_DESCRIPTION_LENGTH = 500;
const MAX_LIST_LIMIT = 500;

function read() {
    return loadState();
}

function write(state) {
    saveState(state);
    return state;
}

function sortExpenses(expenses) {
    return [...expenses].sort((a, b) => {
        if (a.date !== b.date) {
            return a.date < b.date ? 1 : -1;
        }
        return String(b.createdAt || "").localeCompare(String(a.createdAt || ""));
    });
}

function filterByRange(expenses, { from, to } = {}) {
    return expenses.filter((expense) => {
        if (from && expense.date < from) {
            return false;
        }
        if (to && expense.date > to) {
            return false;
        }
        return true;
    });
}

function sumExpenses(expenses, range) {
    return filterByRange(expenses, range).reduce(
        (sum, expense) => sum + Number(expense.amount || 0),
        0
    );
}

function sumExpensesByDay(expenses, range) {
    const totals = new Map();
    for (const expense of filterByRange(expenses, range)) {
        const day = String(expense.date).slice(0, 10);
        totals.set(day, (totals.get(day) || 0) + Number(expense.amount || 0));
    }
    return totals;
}

function parseExpenseInput({ date, description, amount }) {
    const cleanDate = String(date || "").trim();
    const cleanDescription = String(description || "").trim();
    const cleanAmount = Number(amount);

    if (!/^\d{4}-\d{2}-\d{2}$/.test(cleanDate)) {
        throw new Error("Data non valida");
    }
    if (!Number.isFinite(cleanAmount) || cleanAmount <= 0) {
        throw new Error("Importo non valido");
    }
    if (cleanDescription.length > MAX_DESCRIPTION_LENGTH) {
        throw new Error("Descrizione troppo lunga");
    }

    return {
        date: cleanDate,
        description: cleanDescription,
        amount: cleanAmount
    };
}

export function getWeeklyAlert() {
    return read().settings.weeklyAlert ?? DEFAULT_WEEKLY_ALERT;
}

export function setWeeklyAlert(amount) {
    const value = Number(amount);
    if (!Number.isFinite(value) || value < 0) {
        throw new Error("Importo non valido");
    }

    const state = read();
    state.settings.weeklyAlert = value;
    write(state);
    return { alertExpense: value };
}

export function listExpenses({ from, to, limit = 50 } = {}) {
    const safeLimit = Math.min(
        Math.max(1, Number(limit) || 50),
        MAX_LIST_LIMIT
    );
    const expenses = sortExpenses(
        filterByRange(read().expenses, { from, to })
    ).slice(0, safeLimit);
    return { expenses };
}

export function getExpense(id) {
    const expense = read().expenses.find((item) => item.id === id);
    if (!expense) {
        throw new Error("Spesa non trovata");
    }
    return { expense };
}

export function createExpense(input) {
    const parsed = parseExpenseInput(input);
    const expense = {
        id: crypto.randomUUID(),
        date: parsed.date,
        description: parsed.description,
        amount: parsed.amount,
        createdAt: new Date().toISOString()
    };

    const state = read();
    state.expenses.push(expense);
    write(state);
    return { expense };
}

export function updateExpense(id, input) {
    const parsed = parseExpenseInput(input);
    const state = read();
    const index = state.expenses.findIndex((item) => item.id === id);
    if (index === -1) {
        throw new Error("Spesa non trovata");
    }

    state.expenses[index] = {
        ...state.expenses[index],
        date: parsed.date,
        description: parsed.description,
        amount: parsed.amount
    };
    write(state);
    return { expense: state.expenses[index] };
}

export function deleteExpenses(ids) {
    const idSet = new Set(
        (Array.isArray(ids) ? ids : [])
            .map((id) => String(id || "").trim())
            .filter(Boolean)
    );

    if (idSet.size === 0) {
        throw new Error("Nessuna spesa selezionata");
    }
    if (idSet.size > 100) {
        throw new Error("Troppe spese selezionate");
    }

    const state = read();
    const before = state.expenses.length;
    state.expenses = state.expenses.filter((item) => !idSet.has(item.id));
    write(state);
    return { deleted: before - state.expenses.length };
}

export function getMostUsedAmounts(limit = 5) {
    const counts = new Map();
    for (const expense of read().expenses) {
        const amount = Number(expense.amount);
        if (!Number.isFinite(amount)) {
            continue;
        }
        counts.set(amount, (counts.get(amount) || 0) + 1);
    }

    const amounts = [...counts.entries()]
        .sort((a, b) => b[1] - a[1] || b[0] - a[0])
        .slice(0, limit)
        .map(([amount]) => amount);

    return { amounts };
}

export function getHome(periodValue) {
    const period = parsePeriod(periodValue);
    const { start, end } = periodRange(period);
    const state = read();
    const recent = sortExpenses(
        filterByRange(state.expenses, { from: start, to: end })
    ).slice(0, MAX_LIST_LIMIT);

    return {
        summary: {
            period,
            start,
            end,
            total: sumExpenses(state.expenses, { from: start, to: end })
        },
        alertExpense: state.settings.weeklyAlert ?? DEFAULT_WEEKLY_ALERT,
        recent
    };
}

export function getBreakdown(periodValue) {
    const period = parsePeriod(periodValue);
    const { start, end } = periodRange(period);
    const totals = sumExpensesByDay(read().expenses, { from: start, to: end });

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

    return { period, start, end, points };
}

export function getHistory(periodValue) {
    const period = parsePeriod(periodValue);
    const buckets =
        period === "month"
            ? lastNMonths(12)
            : period === "year"
              ? lastNYears(5)
              : lastNWeeks(8);

    const start = buckets[0].start;
    const end = buckets[buckets.length - 1].end;
    const totals = sumExpensesByDay(read().expenses, { from: start, to: end });

    const points = buckets.map((bucket) => ({ ...bucket, total: 0 }));
    for (const [date, total] of totals) {
        const bucket = points.find(
            (point) => date >= point.start && date <= point.end
        );
        if (bucket) {
            bucket.total += total;
        }
    }

    return { period, start, end, points };
}

export function resetDemo() {
    return resetState();
}
