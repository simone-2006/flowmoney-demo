import { useEffect, useState } from "react";
import Page from "../components/layout/Page";
import PeriodTabs from "../components/PeriodTabs";
import { Home as HomeIcon, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { api, formatDateIt, formatEuro } from "../lib/api";

const TITLES = {
  week: "Spese della settimana",
  month: "Spese del mese",
  year: "Spese dell'anno",
};

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [period, setPeriod] = useState("week");
  const [totalExpense, setTotalExpense] = useState(0);
  const [alertExpense, setAlertExpense] = useState(100);
  const [rangeLabel, setRangeLabel] = useState("");
  const [recent, setRecent] = useState([]);
  const [isInSelection, setIsInSelection] = useState(false);

  const [selectedIds, setSelectedIds] = useState([]);
  const navigate = useNavigate();

  function applyHomeData(data) {
    setTotalExpense(data.summary?.total ?? 0);
    setAlertExpense(data.alertExpense ?? 100);
    setRangeLabel(
      `${formatDateIt(data.summary?.start)} - ${formatDateIt(data.summary?.end)}`
    );
    setRecent(data.recent || []);
  }

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");
      try {
        const data = await api(`/expenses/home?period=${period}`);
        if (cancelled) {
          return;
        }
        applyHomeData(data);
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
  }, [period]);

  async function handleDeleteSelected() {
    if (selectedIds.length === 0 || deleting) {
      return;
    }

    setDeleting(true);
    setError("");
    try {
      await api("/expenses", {
        method: "DELETE",
        body: JSON.stringify({ ids: selectedIds }),
      });
      const data = await api(`/expenses/home?period=${period}`);
      applyHomeData(data);
      setSelectedIds([]);
      setIsInSelection(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setDeleting(false);
    }
  }

  const selectedSet = new Set(selectedIds);

  return (
    <Page title="Home" icon={<HomeIcon />}>
      <div className="bg-white p-2 shadow-2xl rounded-2xl corner-squircle">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h1 className="text-xl font-semibold">{TITLES[period]}</h1>
            <p className="text-xs text-gray-600">{rangeLabel || "—"}</p>
          </div>
          <PeriodTabs value={period} onChange={setPeriod} />
        </div>
        <div className="mt-2 flex flex-col items-start gap-2 text-black">
          <p
            className={`${totalExpense > alertExpense
              ? "text-red-600"
              : "text-green-600"
              } text-4xl font-semibold
              ${period === "week" ? "" : "text-gray-800!"}
              `}
          >
            {loading ? "…" : `${formatEuro(totalExpense)}€`}
          </p>
          {period === "week" && (
            <p className="text-xs text-gray-600">
              Alert spese impostato a {formatEuro(alertExpense)}€
            </p>
          )}
        </div>
      </div>

      <div className="bg-white p-2 shadow-2xl rounded-2xl corner-squircle mt-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold mb-2">Riepilogo spese</h2>
          <div className="flex items-center gap-2">
            {
              selectedIds.length > 0 ? (
                <button
                  type="button"
                  className="text-red-600 text-xs disabled:opacity-50"
                  disabled={deleting}
                  onClick={handleDeleteSelected}
                >
                  {deleting ? "Eliminazione…" : "Elimina selezionati"}
                </button>
              ) : null
            }
            <button
              className="text-blue-600 text-xs"
              onClick={() => { setIsInSelection((prev) => !prev); setSelectedIds([]) }}
            >
              {isInSelection ? "Annulla" : "Seleziona"}
            </button>
          </div>
        </div>
        {error && <p className="mb-2 text-xs text-red-600">{error}</p>}
        {loading ? (
          <p className="text-xs text-gray-500">Caricamento…</p>
        ) : recent.length === 0 ? (
          <p className="text-xs text-gray-500">Nessuna spesa ancora.</p>
        ) : (
          <table className="min-w-full table-auto ">
            <thead>
              <tr>
                {isInSelection ?
                  <th className="px-2 py-1 text-left text-sm text-gray-500">
                    Sel
                  </th>
                  : ""}
                <th className="px-2 py-1 text-left text-sm text-gray-500">
                  Data
                </th>
                <th className="px-2 py-1 text-left text-sm text-gray-500">
                  Descrizione
                </th>
                <th className="px-2 py-1 text-right text-sm text-gray-500">
                  Importo
                </th>
              </tr>
            </thead>
            <tbody>
              {recent.map((expense) => (
                <tr
                  key={expense.id}
                  className={isInSelection ? undefined : "cursor-pointer hover:bg-gray-50"}
                  onClick={() => {
                    if (!isInSelection) {
                      navigate(`/modifica-spesa/${expense.id}`);
                    }
                  }}
                >
                  {isInSelection ? (
                    <td className="px-2 py-1 text-sm">
                      <input
                        type="checkbox"
                        aria-label={`Seleziona spesa del ${formatDateIt(expense.date)}`}
                        checked={selectedSet.has(expense.id)}
                        onChange={() => {
                          setSelectedIds((prev) =>
                            prev.includes(expense.id)
                              ? prev.filter((id) => id !== expense.id)
                              : [...prev, expense.id]
                          );
                        }}
                      />
                    </td>
                  ) : null}
                  <td className="px-2 py-1 text-sm">
                    {formatDateIt(expense.date)}
                  </td>
                  <td className="px-2 py-1 text-sm">
                    {expense.description || "—"}
                  </td>
                  <td className="px-2 py-1 text-right text-sm">
                    {formatEuro(expense.amount)}€
                  </td>
                </tr>
              ))}

            </tbody>
          </table>
        )}
      </div>

      <button
        type="button"
        className="fixed right-0 bottom-0 m-6 flex items-center gap-2 bg-green-600 px-2 py-1 text-xl font-semibold text-white rounded-2xl corner-squircle"
        onClick={() => navigate("/aggiungi-spesa")}
      >
        <Plus />
        Aggiungi spesa
      </button>
    </Page>
  );
}
