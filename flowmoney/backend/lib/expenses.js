import { getSupabase } from "./supabase.js";

function fromRow(row) {
    if (!row) {
        return null;
    }

    return {
        id: row.id,
        date: row.spent_on,
        description: row.description || "",
        amount: Number(row.amount),
        createdAt: row.created_at
    };
}

const MAX_LIST_LIMIT = 500;

export async function listExpenses({ from, to, limit = 50 } = {}) {
    const safeLimit = Math.min(
        Math.max(1, Number(limit) || 50),
        MAX_LIST_LIMIT
    );

    let query = getSupabase()
        .from("expenses")
        .select("*")
        .order("spent_on", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(safeLimit);

    if (from) {
        query = query.gte("spent_on", from);
    }
    if (to) {
        query = query.lte("spent_on", to);
    }

    const { data, error } = await query;
    if (error) {
        throw error;
    }

    return (data || []).map(fromRow);
}

export async function sumExpenses({ from, to } = {}) {
    let query = getSupabase().from("expenses").select("amount");

    if (from) {
        query = query.gte("spent_on", from);
    }
    if (to) {
        query = query.lte("spent_on", to);
    }

    const { data, error } = await query;
    if (error) {
        throw error;
    }

    return (data || []).reduce((sum, row) => sum + Number(row.amount), 0);
}

export async function sumExpensesByDay({ from, to } = {}) {
    let query = getSupabase().from("expenses").select("amount, spent_on");

    if (from) {
        query = query.gte("spent_on", from);
    }
    if (to) {
        query = query.lte("spent_on", to);
    }

    const { data, error } = await query;
    if (error) {
        throw error;
    }

    const totals = new Map();
    for (const row of data || []) {
        const day = String(row.spent_on).slice(0, 10);
        totals.set(day, (totals.get(day) || 0) + Number(row.amount));
    }
    return totals;
}

export async function getExpense(id) {
    const { data, error } = await getSupabase()
        .from("expenses")
        .select("*")
        .eq("id", id)
        .maybeSingle();

    if (error) {
        throw error;
    }

    return fromRow(data);
}

export async function createExpense({ date, description, amount }) {
    const { data, error } = await getSupabase()
        .from("expenses")
        .insert({
            spent_on: date,
            description: description?.trim() || null,
            amount
        })
        .select("*")
        .single();

    if (error) {
        throw error;
    }

    return fromRow(data);
}

export async function updateExpense(id, { date, description, amount }) {
    const { data, error } = await getSupabase()
        .from("expenses")
        .update({
            spent_on: date,
            description: description?.trim() || null,
            amount
        })
        .eq("id", id)
        .select("*")
        .maybeSingle();

    if (error) {
        throw error;
    }

    if (!data) {
        const notFound = new Error("Spesa non trovata");
        notFound.status = 404;
        throw notFound;
    }

    return fromRow(data);
}

export async function deleteExpenses(ids) {
    const { error } = await getSupabase()
        .from("expenses")
        .delete()
        .in("id", ids);

    if (error) {
        throw error;
    }
}

/** Top N importi più frequenti (aggregazione lato server). */
export async function mostUsedAmounts(limit = 5) {
    const { data, error } = await getSupabase()
        .from("expenses")
        .select("amount");

    if (error) {
        throw error;
    }

    const counts = new Map();
    for (const row of data || []) {
        const amount = Number(row.amount);
        if (!Number.isFinite(amount)) {
            continue;
        }
        counts.set(amount, (counts.get(amount) || 0) + 1);
    }

    return [...counts.entries()]
        .sort((a, b) => b[1] - a[1] || b[0] - a[0])
        .slice(0, limit)
        .map(([amount]) => amount);
}