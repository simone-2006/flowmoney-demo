const OPTIONS = [
  { value: "week", label: "Settimana" },
  { value: "month", label: "Mese" },
  { value: "year", label: "Anno" },
];

export default function PeriodTabs({ value, onChange }) {
  return (
    <div className="flex w-fit bg-gray-100 p-0.5 text-xs rounded-2xl corner-squircle">
      {OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          className={`px-2 py-1 font-medium transition-colors rounded-2xl corner-squircle ${value === option.value
            ? "bg-white text-gray-900 shadow-2xl"
            : "text-gray-500"
            }`}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
