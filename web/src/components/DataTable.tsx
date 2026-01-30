import { useMemo } from "react";

type Props = {
  rows: Array<Record<string, unknown>>;
  maxHeight?: number;
};

export default function DataTable({ rows, maxHeight = 520 }: Props) {
  const columns = useMemo(() => {
    if (rows.length === 0) return [];
    const first = Object.keys(rows[0]);
    const rest = new Set<string>();
    for (let i = 1; i < rows.length; i += 1) {
      for (const k of Object.keys(rows[i])) rest.add(k);
    }
    const out: string[] = [];
    for (const k of first) out.push(k);
    for (const k of rest) if (!out.includes(k)) out.push(k);
    return out;
  }, [rows]);

  if (rows.length === 0) {
    return <div className="emptyState">No rows to display.</div>;
  }

  return (
    <div className="tableWrap" style={{ maxHeight }}>
      <table className="table">
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c}>{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              {columns.map((c) => (
                <td key={c}>{formatCell(r[c], c)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function formatCell(v: unknown, columnName: string): string {
  if (v === null || v === undefined) return "";

  if (typeof v === "number") {
    const dateText = maybeFormatEpoch(columnName, v);
    if (dateText) return dateText;
    return Number.isFinite(v) ? v.toLocaleString() : String(v);
  }
  if (typeof v === "boolean") return v ? "true" : "false";
  if (typeof v === "string") {
    const iso = maybeFormatIsoDate(columnName, v);
    return iso ?? v;
  }
  if (v instanceof Date) return v.toISOString();
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
}

function maybeFormatEpoch(columnName: string, n: number): string | null {
  if (!/date|time/i.test(columnName)) return null;
  if (!Number.isFinite(n)) return null;

  if (n > 1e11 && n < 1e13) {
    return formatDate(new Date(n));
  }
  if (n > 1e9 && n < 1e11) {
    return formatDate(new Date(n * 1000));
  }
  return null;
}

function maybeFormatIsoDate(columnName: string, s: string): string | null {
  if (!/date|time/i.test(columnName)) return null;
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return null;
  return formatDate(d);
}

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}
