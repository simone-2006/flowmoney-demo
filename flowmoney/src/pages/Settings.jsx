import { useEffect, useState } from "react";
import Page from "../components/layout/Page";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import { Settings as SettingsIcon, RotateCcw } from "lucide-react";
import { formatEuro } from "../lib/format";
import { getWeeklyAlert, resetDemo, setWeeklyAlert } from "../lib/store";

export default function Settings() {
    const [value, setValue] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [resetting, setResetting] = useState(false);
    const [error, setError] = useState("");
    const [saved, setSaved] = useState(false);
    const [resetDone, setResetDone] = useState(false);

    useEffect(() => {
        setLoading(true);
        setError("");
        try {
            setValue(String(getWeeklyAlert()));
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    function handleSubmit(event) {
        event.preventDefault();
        setError("");
        setSaved(false);
        setResetDone(false);
        setSaving(true);
        try {
            const data = setWeeklyAlert(Number(value));
            setValue(String(data.alertExpense));
            setSaved(true);
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    }

    function handleReset() {
        if (
            !window.confirm(
                "Ripristinare i dati demo? Spese e impostazioni attuali verranno sostituiti."
            )
        ) {
            return;
        }

        setResetting(true);
        setError("");
        setSaved(false);
        try {
            const state = resetDemo();
            setValue(String(state.settings.weeklyAlert));
            setResetDone(true);
        } catch (err) {
            setError(err.message);
        } finally {
            setResetting(false);
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
                                    setResetDone(false);
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
                        <h2 className="text-lg font-semibold">Dati demo</h2>
                        <p className="mt-1 text-xs text-gray-500">
                            Tutto è salvato in localStorage su questo browser. Puoi
                            ripristinare le spese di esempio in qualsiasi momento.
                        </p>
                    </div>

                    {resetDone && (
                        <p className="mt-2 text-xs text-green-600">
                            Dati demo ripristinati.
                        </p>
                    )}

                    <Button
                        type="button"
                        className="mt-4 flex items-center gap-2"
                        disabled={resetting}
                        onClick={handleReset}
                    >
                        <RotateCcw size={16} />
                        {resetting ? "Ripristino…" : "Ripristina dati demo"}
                    </Button>
                </div>
            </div>
        </Page>
    );
}
