import { useMemo, useState } from "react";

import * as duckdb from "@duckdb/duckdb-wasm";

import BarChart from "./components/BarChart";
import DataTable from "./components/DataTable";
import HistogramChart from "./components/HistogramChart";
import ScatterChart from "./components/ScatterChart";
import { arrowTableToJsonRows, getConnection, getDuckDB, resetConnection } from "./lib/duckdb";
import { createCleanedTableSql, createRawTableSql } from "./lib/pipelineSql";

const INPUT_FILE_NAME = "input.csv";

type PreviewState = {
  rawRows: Array<Record<string, unknown>>;
  cleanedRows: Array<Record<string, unknown>>;
};

type MetricsState = {
  rawCount: number | null;
  cleanedCount: number | null;
  departments: number | null;
};

export default function App() {
  const [busy, setBusy] = useState(false);
  const [busyLabel, setBusyLabel] = useState<string>("Working...");
  const [error, setError] = useState<string | null>(null);
  const [sql, setSql] = useState<string>("SELECT * FROM cleaned LIMIT 50;");
  const [sqlResult, setSqlResult] = useState<Array<Record<string, unknown>>>([]);
  const [preview, setPreview] = useState<PreviewState>({ rawRows: [], cleanedRows: [] });
  const [metrics, setMetrics] = useState<MetricsState>({
    rawCount: null,
    cleanedCount: null,
    departments: null,
  });

  const [ageMin, setAgeMin] = useState(16);
  const [ageMax, setAgeMax] = useState(80);
  const [expMin, setExpMin] = useState(0);
  const [expMax, setExpMax] = useState(60);

  const [salaryHist, setSalaryHist] = useState<{ labels: string[]; values: number[] }>({
    labels: [],
    values: [],
  });
  const [deptBar, setDeptBar] = useState<{ labels: string[]; values: number[] }>({
    labels: [],
    values: [],
  });
  const [scatter, setScatter] = useState<Array<[number, number]>>([]);

  const params = useMemo(
    () => ({ ageMin, ageMax, expMin, expMax }),
    [ageMin, ageMax, expMin, expMax],
  );

  const canClean = preview.rawRows.length > 0;
  const hasRaw = preview.rawRows.length > 0;

  async function loadSample(): Promise<void> {
    setError(null);
    setBusy(true);
    setBusyLabel("Loading sample dataset...");
    try {
      await resetAllState();
      const res = await fetch("./sample_messy_dataset.csv");
      if (!res.ok) throw new Error(`Failed to fetch sample dataset: ${res.status}`);
      const buf = new Uint8Array(await res.arrayBuffer());

      const db = await getDuckDB();
      await safeReplaceRegisteredFile(db, INPUT_FILE_NAME, buf);
      await createRawAndPreview();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  async function loadFromFile(file: File | null): Promise<void> {
    if (!file) return;
    setError(null);
    setBusy(true);
    setBusyLabel("Loading CSV...");
    try {
      await resetAllState();
      const db = await getDuckDB();
      await safeReplaceRegisteredFile(db, INPUT_FILE_NAME, file);
      await createRawAndPreview();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  async function loadFromUrl(url: string): Promise<void> {
    const trimmed = url.trim();
    if (!trimmed) return;
    setError(null);
    setBusy(true);
    setBusyLabel("Downloading CSV...");
    try {
      await resetAllState();
      const res = await fetch(trimmed);
      if (!res.ok) throw new Error(`Failed to fetch URL: ${res.status}`);
      const buf = new Uint8Array(await res.arrayBuffer());
      const db = await getDuckDB();
      await safeReplaceRegisteredFile(db, INPUT_FILE_NAME, buf);
      await createRawAndPreview();
    } catch (e) {
      setError(`${errorMessage(e)}\n\nTip: remote URLs must allow CORS for browser access.`);
    } finally {
      setBusy(false);
    }
  }

  async function runCleaning(): Promise<void> {
    setError(null);
    setBusy(true);
    setBusyLabel("Cleaning dataset...");
    try {
      const conn = await getConnection();
      await conn.query(createCleanedTableSql(params));

      const cleaned = await conn.query("SELECT * FROM cleaned LIMIT 200");
      setPreview((p) => ({ ...p, cleanedRows: arrowTableToJsonRows(cleaned) }));

      await refreshMetricsAndCharts();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  async function runSql(): Promise<void> {
    setError(null);
    setBusy(true);
    setBusyLabel("Running SQL...");
    try {
      const conn = await getConnection();
      const result = await conn.query(sql);
      setSqlResult(arrowTableToJsonRows(result));
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  async function exportCleanedCsv(): Promise<void> {
    setError(null);
    setBusy(true);
    setBusyLabel("Exporting CSV...");
    try {
      const conn = await getConnection();
      await conn.query(
        "COPY (SELECT * FROM cleaned) TO 'cleaned_dataset.csv' (HEADER, DELIMITER ',')",
      );
      const db = await getDuckDB();
      const bytes = await db.copyFileToBuffer("cleaned_dataset.csv");
      downloadBytes(bytes, "cleaned_dataset.csv", "text/csv");
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  async function resetAllState(): Promise<void> {
    setPreview({ rawRows: [], cleanedRows: [] });
    setSqlResult([]);
    setSalaryHist({ labels: [], values: [] });
    setDeptBar({ labels: [], values: [] });
    setScatter([]);
    setMetrics({ rawCount: null, cleanedCount: null, departments: null });
    await resetConnection();
  }

  async function createRawAndPreview(): Promise<void> {
    const conn = await getConnection();
    await conn.query(createRawTableSql(INPUT_FILE_NAME));
    const raw = await conn.query("SELECT * FROM raw LIMIT 200");
    setPreview((p) => ({ ...p, rawRows: arrowTableToJsonRows(raw) }));
    await refreshMetricsAndCharts();
  }

  async function refreshMetricsAndCharts(): Promise<void> {
    const conn = await getConnection();

    const rawCount = await conn.query("SELECT COUNT(*) AS n FROM raw");
    const rawCountVal = asNumber(arrowTableToJsonRows(rawCount)[0]?.n);

    let cleanedCountVal: number | null = null;
    let deptVal: number | null = null;

    try {
      const cleanedCount = await conn.query("SELECT COUNT(*) AS n FROM cleaned");
      cleanedCountVal = asNumber(arrowTableToJsonRows(cleanedCount)[0]?.n);
      const dept = await conn.query("SELECT COUNT(DISTINCT department) AS n FROM cleaned");
      deptVal = asNumber(arrowTableToJsonRows(dept)[0]?.n);
    } catch {
      // cleaned table might not exist yet
    }

    setMetrics({ rawCount: rawCountVal, cleanedCount: cleanedCountVal, departments: deptVal });

    await refreshCharts(conn);
  }

  async function refreshCharts(conn: Awaited<ReturnType<typeof getConnection>>): Promise<void> {
    try {
      const dept = await conn.query(
        "SELECT department, avg(salary_usd) AS avg_salary FROM cleaned GROUP BY department ORDER BY avg_salary DESC",
      );
      const deptRows = arrowTableToJsonRows(dept);
      setDeptBar({
        labels: deptRows.map((r) => String(r.department ?? "")),
        values: deptRows.map((r) => asNumber(r.avg_salary) ?? 0),
      });

      const buckets = 12;
      const hist = await conn.query(
        `WITH stats AS (
          SELECT min(salary_usd) AS minv, max(salary_usd) AS maxv FROM cleaned
        ), params AS (
          SELECT
            minv,
            maxv,
            CASE WHEN maxv > minv THEN (maxv - minv) / ${buckets} ELSE 1 END AS step
          FROM stats
        ), bounds AS (
          SELECT
            i AS b,
            minv + i * step AS startv,
            minv + (i + 1) * step AS endv,
            minv,
            maxv,
            step
          FROM params, range(${buckets}) t(i)
        ), counts AS (
          SELECT
            CASE
              WHEN salary_usd IS NULL THEN NULL
              WHEN (SELECT maxv FROM params) = (SELECT minv FROM params) THEN 0
              ELSE least(
                ${buckets - 1},
                greatest(0, CAST(floor((salary_usd - (SELECT minv FROM params)) / (SELECT step FROM params)) AS BIGINT))
              )
            END AS b,
            count(*) AS n
          FROM cleaned
          GROUP BY b
        )
        SELECT
          bounds.b,
          bounds.startv,
          bounds.endv,
          coalesce(counts.n, 0) AS n
        FROM bounds
        LEFT JOIN counts ON counts.b = bounds.b
        ORDER BY bounds.b`,
      );

      const histRows = arrowTableToJsonRows(hist);
      if (histRows.length > 0) {
        const labels: string[] = [];
        const values: number[] = [];
        for (const r of histRows) {
          const startv = asNumber(r.startv) ?? 0;
          const endv = asNumber(r.endv) ?? startv;
          labels.push(`${Math.round(startv).toLocaleString()}–${Math.round(endv).toLocaleString()}`);
          values.push(asNumber(r.n) ?? 0);
        }
        setSalaryHist({ labels, values });
      }

      const sc = await conn.query(
        "SELECT years_experience, salary_usd FROM cleaned WHERE years_experience IS NOT NULL AND salary_usd IS NOT NULL USING SAMPLE 400 ROWS",
      );
      const scRows = arrowTableToJsonRows(sc);
      setScatter(
        scRows
          .map(
            (r) =>
              [asNumber(r.years_experience) ?? 0, asNumber(r.salary_usd) ?? 0] as [number, number],
          )
          .filter((p) => Number.isFinite(p[0]) && Number.isFinite(p[1])),
      );
    } catch {
      // charts require cleaned
    }
  }

  return (
    <div className="appShell">
      {busy ? (
        <div className="loadingOverlay" role="status" aria-live="polite">
          <div className="loadingCard">
            <div className="spinner" />
            <div>
              <div style={{ fontWeight: 700 }}>{busyLabel}</div>
              <div className="muted">This can take a moment on large datasets.</div>
            </div>
          </div>
        </div>
      ) : null}
      <div className="container">
        <div className="header">
          <div className="title">
            <h1>Data Cleaning & Visualization</h1>
            <div className="subtitle">
              In-browser cleaning, profiling, SQL and charts. Runs on GitHub Pages.
            </div>
          </div>
          <div className="row">
            <span className="pill">DuckDB-WASM</span>
            <span className="pill">CSV / large data</span>
          </div>
        </div>

        <div className="grid">
          <div className="card">
            <div className="cardTitle">1) Load data</div>
            <div className="row">
              <button className="btn" disabled={busy} onClick={loadSample}>
                Load sample dataset
              </button>
              <label className="btn btnSecondary">
                Upload CSV
                <input
                  type="file"
                  accept={".csv,text/csv"}
                  style={{ display: "none" }}
                  onChange={(e) => void loadFromFile(e.target.files?.[0] ?? null)}
                  disabled={busy}
                />
              </label>
              <div className="spacer" />
            </div>

            <UrlLoader disabled={busy} onLoad={(u) => void loadFromUrl(u)} />

            <div className="row" style={{ marginTop: 10 }}>
              <span className="pill mono">raw rows: {metrics.rawCount ?? "-"}</span>
              <span className="pill mono">cleaned rows: {metrics.cleanedCount ?? "-"}</span>
              <span className="pill mono">departments: {metrics.departments ?? "-"}</span>
              <div className="spacer" />
              <button className="btn btnSecondary" disabled={busy} onClick={() => void resetAllState()}>
                Reset
              </button>
            </div>

            {error ? (
              <pre className="errorBox" style={{ whiteSpace: "pre-wrap", marginTop: 12 }}>
                {error}
              </pre>
            ) : null}
          </div>

          <div className="twoCols">
            <div>
              <div className="card">
                <div className="cardTitle">2) Cleaning rules (matches Python pipeline)</div>
                <div className="formGrid">
                  <div className="field">
                    <label className="muted">Age min</label>
                    <input
                      className="input"
                      value={ageMin}
                      onChange={(e) => setAgeMin(Number(e.target.value))}
                      type="number"
                      disabled={busy}
                    />
                  </div>
                  <div className="field">
                    <label className="muted">Age max</label>
                    <input
                      className="input"
                      value={ageMax}
                      onChange={(e) => setAgeMax(Number(e.target.value))}
                      type="number"
                      disabled={busy}
                    />
                  </div>
                  <div className="field">
                    <label className="muted">Exp min</label>
                    <input
                      className="input"
                      value={expMin}
                      onChange={(e) => setExpMin(Number(e.target.value))}
                      type="number"
                      disabled={busy}
                    />
                  </div>
                  <div className="field">
                    <label className="muted">Exp max</label>
                    <input
                      className="input"
                      value={expMax}
                      onChange={(e) => setExpMax(Number(e.target.value))}
                      type="number"
                      disabled={busy}
                    />
                  </div>
                  <button className="btn" disabled={busy || !canClean} onClick={() => void runCleaning()}>
                    Clean dataset
                  </button>
                </div>
                <div className="muted" style={{ marginTop: 8 }}>
                  Parsing salary, normalizing department, validating ranges, mapping remote, parsing hired date,
                  imputing salary (department median → global median).
                </div>
              </div>

              <div className="card">
                <div className="cardTitle">3) Preview</div>
                <div className="row" style={{ marginBottom: 10 }}>
                  <span className="pill">Raw (first 200)</span>
                </div>
                <DataTable rows={preview.rawRows} />

                <div className="row" style={{ marginTop: 14, marginBottom: 10 }}>
                  <span className="pill">Cleaned (first 200)</span>
                  <div className="spacer" />
                  <button
                    className="btn"
                    disabled={busy || preview.cleanedRows.length === 0}
                    onClick={() => void exportCleanedCsv()}
                  >
                    Export cleaned CSV
                  </button>
                </div>
                <DataTable rows={preview.cleanedRows} />
              </div>
            </div>

            <div>
              <div className="card">
                <div className="cardTitle">4) SQL Explorer</div>
                <div className="muted" style={{ marginBottom: 10 }}>
                  Tables: <span className="mono">raw</span>, <span className="mono">cleaned</span>
                </div>
                <textarea
                  className="input mono"
                  style={{ width: "100%", minHeight: 120 }}
                  value={sql}
                  onChange={(e) => setSql(e.target.value)}
                  disabled={busy}
                />
                <div className="row" style={{ marginTop: 10 }}>
                  <button className="btn" disabled={busy || !hasRaw} onClick={() => void runSql()}>
                    Run SQL
                  </button>
                  <div className="spacer" />
                </div>
                <DataTable rows={sqlResult} maxHeight={360} />
              </div>
            </div>
          </div>

          <div className="twoCols">
            <HistogramChart
              title="Salary distribution (cleaned)"
              xLabels={salaryHist.labels}
              yValues={salaryHist.values}
            />
            <BarChart
              title="Average salary by department (cleaned)"
              xLabels={deptBar.labels}
              yValues={deptBar.values}
              yLabel="Avg salary (USD)"
            />
          </div>

          <ScatterChart
            title="Salary vs years of experience (cleaned sample)"
            points={scatter}
            xLabel="Years experience"
            yLabel="Salary (USD)"
          />
        </div>
      </div>
    </div>
  );
}

function UrlLoader({
  disabled,
  onLoad,
}: {
  disabled: boolean;
  onLoad: (url: string) => void;
}) {
  const [url, setUrl] = useState("");
  return (
    <div className="row" style={{ marginTop: 12 }}>
      <input
        className="input grow"
        placeholder="Paste a CSV URL (must allow CORS)…"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") onLoad(url);
        }}
        disabled={disabled}
      />
      <button className="btn btnSecondary" disabled={disabled || !url.trim()} onClick={() => onLoad(url)}>
        Load from URL
      </button>
    </div>
  );
}

async function safeReplaceRegisteredFile(
  db: Awaited<ReturnType<typeof getDuckDB>>,
  name: string,
  input: Uint8Array | File,
): Promise<void> {
  try {
    await db.dropFile(name);
  } catch {
    // ignore
  }

  if (input instanceof File) {
    await db.registerFileHandle(
      name,
      input,
      duckdb.DuckDBDataProtocol.BROWSER_FILEREADER,
      false,
    );
    return;
  }

  await db.registerFileBuffer(name, input);
}

function downloadBytes(bytes: Uint8Array, filename: string, mime: string): void {
  const ab = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(ab).set(bytes);
  const blob = new Blob([ab], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function errorMessage(e: unknown): string {
  if (e instanceof Error) return e.message;
  return String(e);
}

function asNumber(v: unknown): number | null {
  if (v === null || v === undefined) return null;
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}
