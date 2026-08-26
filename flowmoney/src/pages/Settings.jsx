import { useEffect, useState } from "react";
import Page from "../components/layout/Page";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import { Settings as SettingsIcon, Trash2 } from "lucide-react";
import { api, formatDateIt, formatEuro } from "../lib/api";

export default function Settings() {
    const [value, setValue] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [saved, setSaved] = useState(false);
    const [devices, setDevices] = useState([]);
    const [devicesError, setDevicesError] = useState("");
    const [revokingId, setRevokingId] = useState("");

    useEffect(() => {
        let cancelled = false;

        async function load() {
            setLoading(true);
            setError("");
            setDevicesError("");
            try {
                const [alertData, meData] = await Promise.all([
                    api("/settings/weekly-alert"),
                    api("/auth/me"),
                ]);
                if (!cancelled) {
                    setValue(String(alertData.alertExpense ?? 100));
                    setDevices(meData.devices || []);
                }
            } catch (err) {
                if (!cancelled) {
                    setError(err.message);
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        load();
        return () => {
            cancelled = true;
        };
    }, []);

    async function handleSubmit(event) {
        event.preventDefault();
        setError("");
        setSaved(false);
        setSaving(true);
        try {
            const data = await api("/settings/weekly-alert", {
                method: "PUT",
                body: JSON.stringify({
                    alertExpense: Number(value),
                }),
            });
            setValue(String(data.alertExpense));
            setSaved(true);
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    }

    async function handleRevoke(deviceId) {
        if (revokingId || devices.length <= 1) {
            return;
        }
        if (!window.confirm("Rimuovere questo dispositivo? Non potrà più accedere.")) {
            return;
        }

        setRevokingId(deviceId);
        setDevicesError("");
        try {
            const data = await api(`/auth/devices/${encodeURIComponent(deviceId)}`, {
                method: "DELETE",
            });
            setDevices(data.devices || []);
        } catch (err) {
            setDevicesError(err.message);
        } finally {
            setRevokingId("");
        }
    }

    return (
        <Page title="Impostazioni" icon={<SettingsIcon />}>
            <div className="mx-auto flex max-w-md flex-col gap-4">
                <div className="bg-white p-4 shadow-2xl rounded-2xl corner-squircle">
                    <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
                        <div>
                            <h2 className="text-lg font-semibold">Alert settimanale</h2>
                            <p className="mt-1 text-xs text-gray-500">
                                Se le spese della settimana superano questo importo, in Home
                                vengono mostrate in rosso.
                            </p>
                        </div>

                        <div>
                            <label className="mb-1 block text-sm font-medium">
                                Soglia (€)
                            </label>
                            <Input
                                type="number"
                                min="0"
                                step="0.01"
                                value={value}
                                onChange={(e) => {
                                    setValue(e.target.value);
                                    setSaved(false);
                                }}
                                disabled={loading || saving}
                                required
                                placeholder="Es: 100"
                                className="w-full"
                            />
                            {!loading && value !== "" && (
                                <p className="mt-1 text-xs text-gray-400">
                                    Attuale: {formatEuro(Number(value))}€
                                </p>
                            )}
                        </div>

                        {error && <p className="text-xs text-red-600">{error}</p>}
                        {saved && (
                            <p className="text-xs text-green-600">Alert aggiornato.</p>
                        )}

                        <Button type="submit" disabled={loading || saving || value === ""}>
                            {saving ? "Salvataggio…" : "Salva"}
                        </Button>
                    </form>
                </div>

                <div className="bg-white p-4 shadow-2xl rounded-2xl corner-squircle">
                    <div>
                        <h2 className="text-lg font-semibold">Dispositivi</h2>
                        <p className="mt-1 text-xs text-gray-500">
                            Passkey registrate per l&apos;accesso. Non puoi rimuovere
                            l&apos;ultimo dispositivo.
                        </p>
                    </div>

                    {devicesError && (
                        <p className="mt-2 text-xs text-red-600">{devicesError}</p>
                    )}

                    {loading ? (
                        <p className="mt-3 text-xs text-gray-500">Caricamento…</p>
                    ) : devices.length === 0 ? (
                        <p className="mt-3 text-xs text-gray-500">
                            Nessun dispositivo registrato.
                        </p>
                    ) : (
                        <ul className="mt-3 flex flex-col gap-2">
                            {devices.map((device) => (
                                <li
                                    key={device.id}
                                    className="flex items-center justify-between gap-2 border border-gray-100 px-3 py-2 rounded-2xl corner-squircle"
                                >
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-medium">
                                            {device.name || "Dispositivo"}
                                        </p>
                                        <p className="text-xs text-gray-400">
                                            {device.createdAt
                                                ? `Dal ${formatDateIt(device.createdAt)}`
                                                : "Data sconosciuta"}
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        className="flex shrink-0 items-center gap-1 text-xs text-red-600 disabled:opacity-40"
                                        disabled={
                                            devices.length <= 1 || revokingId === device.id
                                        }
                                        onClick={() => handleRevoke(device.id)}
                                        aria-label={`Rimuovi ${device.name || "dispositivo"}`}
                                    >
                                        <Trash2 size={14} />
                                        {revokingId === device.id ? "…" : "Rimuovi"}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </Page>
    );
}
