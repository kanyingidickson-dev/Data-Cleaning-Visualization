import { useMemo } from "react";

type Props = {
  rows: Array<Record<string, unknown>>;
  maxHeight?: number;
};

export default function DataTable({ rows, maxHeight = 520 }: Props) {
  const columns = useMemo(() => {
    const keys = new Set<string>();
    for (const r of rows) {
      for (const k of Object.keys(r)) keys.add(k);
    }
    return Array.from(keys);
  }, [rows]);

  if (rows.length === 0) {
    return <div className="card">No rows to display.</div>;
  }

  return (
    <div className="card" style={{ overflow: "auto", maxHeight }}>
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
                <td key={c}>{formatCell(r[c])}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function formatCell(v: unknown): string {
  if (v === null || v === undefined) return "";
  if (typeof v === "number") return Number.isFinite(v) ? v.toLocaleString() : String(v);
  if (typeof v === "boolean") return v ? "true" : "false";
  if (typeof v === "string") return v;
  if (v instanceof Date) return v.toISOString();
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
}
