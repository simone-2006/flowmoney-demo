import { useEffect, useState } from "react";
import Page from "../components/layout/Page";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import { ArrowLeft, Pencil } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../lib/api";

export default function ModificaSpesa() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [data, setData] = useState("");
    const [descrizione, setDescrizione] = useState("");
    const [importo, setImporto] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        let cancelled = false;

        async function load() {
            setLoading(true);
            setError("");
            try {
                const result = await api(`/expenses/${id}`);
                if (cancelled) {
                    return;
                }
                const expense = result.expense;
                setData(expense.date);
                setDescrizione(expense.description || "");
                setImporto(String(expense.amount));
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
    }, [id]);

    async function handleSubmit(event) {
        event.preventDefault();
        setError("");
        setSaving(true);
        try {
            await api(`/expenses/${id}`, {
                method: "PUT",
                body: JSON.stringify({
                    date: data,
                    description: descrizione,
                    amount: parseFloat(importo),
                }),
            });
            navigate("/");
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    }

    return (
        <Page title="Modifica spesa" icon={<Pencil />}>
            <div className="mx-auto flex max-w-md flex-col gap-4 bg-white p-4 shadow-2xl rounded-2xl corner-squircle">
                {loading ? (
                    <p className="text-xs text-gray-500">Caricamento…</p>
                ) : (
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
                                className="w-full resize-none border border-gray-300 p-2 text-sm shadow-inner transition duration-150 focus:border-green-600 focus:ring-2 focus:ring-green-100 corner-squircle rounded-2xl"
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
                        </div>
                        {error && (
                            <p className="text-xs text-red-600">{error}</p>
                        )}
                        <button
                            type="submit"
                            disabled={!importo || saving}
                            className="flex items-center justify-center gap-2 bg-green-600 px-2 py-1 text-xl font-semibold text-white disabled:opacity-50 corner-squircle rounded-2xl"
                        >
                            {saving ? "Salvataggio…" : "Salva modifiche"}
                        </button>
                    </form>
                )}
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
