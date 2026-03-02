const FORMULA_PREFIX_RE = /^[=+\-@]/;

export function escapeCsvCell(value: unknown): string {
    const raw = String(value ?? "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
    const formulaSafe = FORMULA_PREFIX_RE.test(raw) ? `'${raw}` : raw;
    return `"${formulaSafe.replace(/"/g, '""')}"`;
}

export function toCsvRow(values: unknown[]): string {
    return values.map(escapeCsvCell).join(",");
}
