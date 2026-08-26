export async function api(path, options = {}) {
    const response = await fetch(`/api${path}`, {
        credentials: "include",
        ...options,
        headers: {
            ...(options.body ? { "Content-Type": "application/json" } : {}),
            ...options.headers
        }
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
        throw new Error(data.error || "Richiesta fallita");
    }
    return data;
}

export function formatDateIt(isoDate) {
    if (!isoDate) {
        return "";
    }
    const [y, m, d] = String(isoDate).slice(0, 10).split("-");
    return `${d}/${m}/${y}`;
}

export function formatEuro(amount) {
    return Number(amount || 0).toLocaleString("it-IT", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    });
}
