import { getSupabase } from "./supabase.js";

function fromRow(row) {
    if (!row) {
        return null;
    }

    return {
        id: row.id,
        publicKey: row.public_key,
        counter: Number(row.counter),
        transports: row.transports || [],
        deviceType: row.device_type,
        backedUp: row.backed_up,
        name: row.name,
        createdAt: row.created_at
    };
}

function toRow(device) {
    return {
        id: device.id,
        public_key: device.publicKey,
        counter: device.counter ?? 0,
        transports: device.transports || [],
        device_type: device.deviceType ?? null,
        backed_up: Boolean(device.backedUp),
        method: "pc",
        name: device.name || "Dispositivo",
        created_at: device.createdAt || new Date().toISOString()
    };
}

export async function listDevices() {
    const { data, error } = await getSupabase()
        .from("devices")
        .select("*")
        .order("created_at", { ascending: true });

    if (error) {
        throw error;
    }

    return (data || []).map(fromRow);
}

export async function getDevice(id) {
    const { data, error } = await getSupabase()
        .from("devices")
        .select("*")
        .eq("id", id)
        .maybeSingle();

    if (error) {
        throw error;
    }

    return fromRow(data);
}

export async function publicDevices() {
    const devices = await listDevices();
    return devices.map((device) => ({
        id: device.id,
        name: device.name || "Dispositivo",
        createdAt: device.createdAt || null
    }));
}

export async function upsertDevice(device) {
    const { error } = await getSupabase()
        .from("devices")
        .upsert(toRow(device), { onConflict: "id" });

    if (error) {
        throw error;
    }

    return { persisted: true };
}

export async function deleteDevice(id) {
    const { error } = await getSupabase().rpc("delete_device_if_not_last", {
        p_id: id
    });

    if (error) {
        const message = error.message || "Errore rimozione dispositivo";
        const notLast = /ultimo dispositivo/i.test(message);
        const notFound = /non trovato/i.test(message);
        const wrapped = new Error(
            notLast
                ? "Non puoi rimuovere l'ultimo dispositivo"
                : notFound
                    ? "Dispositivo non trovato"
                    : message
        );
        wrapped.status = notLast || notFound ? (notFound ? 404 : 400) : 500;
        throw wrapped;
    }

    return { deleted: true };
}
