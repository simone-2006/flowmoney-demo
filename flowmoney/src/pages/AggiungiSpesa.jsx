import { useEffect, useState } from "react";
import Page from "../components/layout/Page";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import { ArrowLeft, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { api, formatEuro } from "../lib/api";

export default function AggiungiSpesa() {
    const today = new Date().toISOString().split("T")[0];
    const [data, setData] = useState(today);
    const [descrizione, setDescrizione] = useState("");
    const [importo, setImporto] = useState("");
    const [suggestions, setSuggestions] = useState([]);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const navigate = useNavigate();

    useEffect(() => {
        let cancelled = false;

        async function loadSuggestions() {
            try {
                const data = await api("/expenses/most-used-amounts");
                if (!cancelled) {
                    setSuggestions(data.amounts || []);
                }
            } catch {
                if (!cancelled) {
                    setSuggestions([]);
                }
            }
        }

        loadSuggestions();
        return () => {
            cancelled = true;
        };
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSaving(true);
        try {
            await api("/expenses", {
                method: "POST",
                body: JSON.stringify({
                    date: data,
                    description: descrizione,
                    amount: parseFloat(importo)
                })
            });
            navigate("/");
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <Page title="Aggiungi Spesa" icon={<Plus />}>
            <div className="mx-auto flex max-w-md flex-col gap-4  bg-white p-4 shadow-2xl rounded-2xl corner-squircle">
                <form
                    className="flex flex-col gap-4"
                    onSubmit={handleSubmit}
                    autoComplete="off"
                >
                    <div>
                        <label className="mb-1 block text-sm font-medium">
                            Data
                        </label>
                        <Input
                            type="date"
                            value={data}
                            onChange={(e) => setData(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <label className="mb-1 block text-sm font-medium">
                            Descrizione{" "}
                            <span className="text-gray-400">(facoltativa)</span>
                        </label>
                        <textarea
                            className="w-full resize-none  border border-gray-300 p-2 text-sm shadow-inner transition duration-150 focus:border-green-600 focus:ring-2 focus:ring-green-100 corner-squircle rounded-2xl"
                            rows={3}
                            maxLength={500}
                            value={descrizione}
                            onChange={(e) => setDescrizione(e.target.value)}
                            placeholder="Descrizione della spesa"
                        />
                    </div>
                    <div>
                        <label className="mb-1 block text-sm font-medium">
                            Importo <b className="text-red-600">*</b>
                        </label>
                        <Input
                            type="number"
                            min="0.01"
                            step="0.01"
                            value={importo}
                            onChange={(e) => setImporto(e.target.value)}
                            required
                            placeholder="Es: 23.50"
                        />
                        {suggestions.length > 0 && (
                            <div className="mt-2 flex flex-wrap items-center gap-1">
                                {suggestions.map((amount) => {
                                    const selected =
                                        Number(importo) === Number(amount);
                                    return (
                                        <button
                                            key={amount}
                                            type="button"
                                            onClick={() =>
                                                setImporto(String(amount))
                                            }
                                            className={[
                                                " border px-2 py-1 text-sm transition rounded-2xl corner-squircle",
                                                selected
                                                    ? "border-green-600 bg-green-50 text-green-700"
                                                    : "border-gray-300 text-gray-700 hover:border-green-600",
                                            ].join(" ")}
                                        >
                                            {formatEuro(amount)}€
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                    {error && (
                        <p className="text-xs text-red-600">{error}</p>
                    )}
                    <button
                        type="submit"
                        disabled={!importo || saving}
                        className="flex items-center gap-2 bg-green-600 px-2 py-1 text-xl font-semibold text-white disabled:opacity-50 justify-center corner-squircle rounded-2xl"
                    >
                        {saving ? "Salvataggio…" : "Aggiungi"}
                    </button>
                </form>
                <Button
                    type="button"
                    className="mt-2 flex items-center gap-2"
                    onClick={() => navigate("/")}
                >
                    <ArrowLeft className="h-4 w-4" />
                    Torna indietro
                </Button>
            </div>
        </Page>
    );
}
