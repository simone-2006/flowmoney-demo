import { useEffect, useState } from "react";
import { Chart } from "react-charts";
import { BanknoteArrowDown } from "lucide-react";
import Page from "../components/layout/Page";
import PeriodTabs from "../components/PeriodTabs";
import { formatDateIt, formatEuro } from "../lib/format";
import { getBreakdown, getHistory } from "../lib/store";

const DAY_LABELS = ["Dom", "Lun", "Mar", "Mer", "Gio", "Ven", "Sab"];
const MONTH_LABELS = [
  "Gen", "Feb", "Mar", "Apr", "Mag", "Giu",
  "Lug", "Ago", "Set", "Ott", "Nov", "Dic",
];

const COPY = {
  week: {
    breakdown: "Spese di questa settimana",
    history: "Totali nelle ultime 8 settimane",
  },
  month: {
    breakdown: "Spese di questo mese",
    history: "Totali negli ultimi 12 mesi",
  },
  year: {
    breakdown: "Spese di quest'anno",
    history: "Totali negli ultimi 5 anni",
  },
};

function weekdayIt(isoDate) {
  const [year, month, day] = String(isoDate).split("-").map(Number);
  return DAY_LABELS[new Date(year, month - 1, day).getDay()];
}

function shortDateIt(isoDate) {
  if (!isoDate) {
    return "";
  }
  const [, month, day] = String(isoDate).slice(0, 10).split("-");
  return `${day}/${month}`;
}

/** Etichetta asse X per il dettaglio del periodo corrente */
function breakdownLabel(period, key) {
  if (period === "week") {
    return weekdayIt(key);
  }
  if (period === "month") {
    return String(Number(key.slice(8, 10)));
  }
  return MONTH_LABELS[Number(key.slice(5, 7)) - 1];
}

/** Etichetta asse X per lo storico */
function historyLabel(period, point) {
  if (period === "week") {
    return shortDateIt(point.start);
  }
  if (period === "month") {
    return `${MONTH_LABELS[Number(point.start.slice(5, 7)) - 1]} ${point.start.slice(2, 4)}`;
  }
  return point.start.slice(0, 4);
}

function formatAxisEuro(value) {
  return `${formatEuro(value)}€`;
}

const primaryAxis = {
  getValue: (datum) => datum.label,
};

const secondaryAxes = [
  {
    getValue: (datum) => datum.amount,
    elementType: "bar",
    min: 0,
    formatters: {
      scale: formatAxisEuro,
      tooltip: formatAxisEuro,
    },
  },
];

const emptySection = { loading: true, error: "", label: "", points: [] };

function ChartCard({ title, section, buildData }) {
  const hasData = section.points.some((point) => Number(point.total) > 0);
  const chartData = [
    {
      label: "Spese",
      data: section.points.map(buildData),
    },
  ];

  return (
    <div className="bg-white p-2 shadow-2xl rounded-2xl corner-squircle">
      <h2 className="text-xl font-semibold">{title}</h2>
      <p className="text-xs text-gray-600">{section.label || "—"}</p>
      {section.error && (
        <p className="mt-2 text-xs text-red-600">{section.error}</p>
      )}
      {section.loading ? (
        <p className="mt-4 text-xs text-gray-500">Caricamento…</p>
      ) : section.error ? null : !hasData ? (
        <p className="mt-4 text-xs text-gray-500">Nessuna spesa ancora.</p>
      ) : (
        <div className="mt-3 h-64">
          <Chart
            options={{
              data: chartData,
              primaryAxis,
              secondaryAxes: [
                {
                  ...secondaryAxes[0],
                  elementType: "line" // Cambia elemento da 'bar' a 'line'
                }
              ],
              defaultColors: ["#16a34a"],
              tooltip: true,
              primaryCursor: false,
              secondaryCursor: false,
            }}
          />
    
        </div>
      )}
    </div>
  );
}

export default function Spese() {
  const [period, setPeriod] = useState("week");
  const [breakdown, setBreakdown] = useState(emptySection);
  const [history, setHistory] = useState(emptySection);

  useEffect(() => {
    function loadSection(loader, setSection) {
      setSection({ ...emptySection });
      try {
        const data = loader(period);
        setSection({
          loading: false,
          error: "",
          label: `${formatDateIt(data.start)} - ${formatDateIt(data.end)}`,
          points: data.points || [],
        });
      } catch (err) {
        setSection({ ...emptySection, loading: false, error: err.message });
      }
    }

    loadSection(getBreakdown, setBreakdown);
    loadSection(getHistory, setHistory);
  }, [period]);

  return (
    <Page title="Spese & grafici" icon={<BanknoteArrowDown />}>
      <div className="flex flex-col gap-2">
        <div className="flex justify-end">
          <PeriodTabs value={period} onChange={setPeriod} />
        </div>
        <ChartCard
          title={COPY[period].breakdown}
          section={breakdown}
          buildData={(point) => ({
            label: breakdownLabel(period, point.key),
            amount: Number(point.total) || 0,
          })}
        />
        <ChartCard
          title={COPY[period].history}
          section={history}
          buildData={(point) => ({
            label: historyLabel(period, point),
            amount: Number(point.total) || 0,
          })}
        />
      </div>
    </Page>
  );
}
