import { getSupabase } from "./supabase.js";

const DEFAULT_WEEKLY_ALERT = 100;

export async function getWeeklyAlert() {
    const { data, error } = await getSupabase()
        .from("settings")
        .select("value")
        .eq("key", "weekly_alert")
        .maybeSingle();

    if (error) {
        throw error;
    }

    const value = data?.value;
    const parsed = typeof value === "number" ? value : Number(value);
    return Number.isFinite(parsed) ? parsed : DEFAULT_WEEKLY_ALERT;
}

export async function setWeeklyAlert(amount) {
    const { error } = await getSupabase()
        .from("settings")
        .upsert(
            {
                key: "weekly_alert",
                value: amount,
                updated_at: new Date().toISOString()
            },
            { onConflict: "key" }
        );

    if (error) {
        throw error;
    }

    return amount;
}
