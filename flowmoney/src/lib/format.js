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
