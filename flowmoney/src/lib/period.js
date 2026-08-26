export function toIsoLocal(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const dayNum = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${dayNum}`;
}

export function eachIsoDay(from, to) {
    const days = [];
    const [year, month, day] = from.split("-").map(Number);
    const cursor = new Date(year, month - 1, day);

    while (toIsoLocal(cursor) <= to) {
        days.push(toIsoLocal(cursor));
        cursor.setDate(cursor.getDate() + 1);
    }

    return days;
}

/** Lunedì–domenica (locale) in YYYY-MM-DD */
export function weekRange(reference = new Date()) {
    const d = new Date(reference);
    d.setHours(12, 0, 0, 0);
    const day = d.getDay();
    const toMonday = day === 0 ? -6 : 1 - day;

    const start = new Date(d);
    start.setDate(d.getDate() + toMonday);

    const end = new Date(start);
    end.setDate(start.getDate() + 6);

    return {
        start: toIsoLocal(start),
        end: toIsoLocal(end)
    };
}

/** Ultime N settimane lun–dom, dalla più vecchia alla corrente */
export function lastNWeeks(n = 8, reference = new Date()) {
    const { start: currentStart } = weekRange(reference);
    const [year, month, day] = currentStart.split("-").map(Number);
    const monday = new Date(year, month - 1, day);
    const weeks = [];

    for (let i = n - 1; i >= 0; i -= 1) {
        const start = new Date(monday);
        start.setDate(monday.getDate() - i * 7);
        const end = new Date(start);
        end.setDate(start.getDate() + 6);
        weeks.push({
            start: toIsoLocal(start),
            end: toIsoLocal(end)
        });
    }

    return weeks;
}

/** Primo–ultimo giorno del mese (locale) in YYYY-MM-DD */
export function monthRange(reference = new Date()) {
    const d = new Date(reference);
    const start = new Date(d.getFullYear(), d.getMonth(), 1);
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
    return {
        start: toIsoLocal(start),
        end: toIsoLocal(end)
    };
}

/** 1 gennaio – 31 dicembre in YYYY-MM-DD */
export function yearRange(reference = new Date()) {
    const y = new Date(reference).getFullYear();
    return {
        start: `${y}-01-01`,
        end: `${y}-12-31`
    };
}

const PERIODS = new Set(["week", "month", "year"]);

export function parsePeriod(value) {
    return PERIODS.has(value) ? value : "week";
}

export function periodRange(period, reference = new Date()) {
    if (period === "month") {
        return monthRange(reference);
    }
    if (period === "year") {
        return yearRange(reference);
    }
    return weekRange(reference);
}

export function lastNMonths(n = 12, reference = new Date()) {
    const d = new Date(reference);
    const months = [];

    for (let i = n - 1; i >= 0; i -= 1) {
        const start = new Date(d.getFullYear(), d.getMonth() - i, 1);
        const end = new Date(d.getFullYear(), d.getMonth() - i + 1, 0);
        months.push({
            start: toIsoLocal(start),
            end: toIsoLocal(end)
        });
    }

    return months;
}

export function lastNYears(n = 5, reference = new Date()) {
    const y = new Date(reference).getFullYear();
    const years = [];

    for (let i = n - 1; i >= 0; i -= 1) {
        years.push({
            start: `${y - i}-01-01`,
            end: `${y - i}-12-31`
        });
    }

    return years;
}
