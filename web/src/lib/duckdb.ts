import * as duckdb from "@duckdb/duckdb-wasm";
import duckdb_wasm from "@duckdb/duckdb-wasm/dist/duckdb-mvp.wasm?url";
import mvp_worker from "@duckdb/duckdb-wasm/dist/duckdb-browser-mvp.worker.js?url";
import duckdb_wasm_eh from "@duckdb/duckdb-wasm/dist/duckdb-eh.wasm?url";
import eh_worker from "@duckdb/duckdb-wasm/dist/duckdb-browser-eh.worker.js?url";

const MANUAL_BUNDLES: duckdb.DuckDBBundles = {
  mvp: {
    mainModule: duckdb_wasm,
    mainWorker: mvp_worker,
  },
  eh: {
    mainModule: duckdb_wasm_eh,
    mainWorker: eh_worker,
  },
};

let dbPromise: Promise<duckdb.AsyncDuckDB> | null = null;
let connPromise: Promise<duckdb.AsyncDuckDBConnection> | null = null;

export async function getDuckDB(): Promise<duckdb.AsyncDuckDB> {
  if (!dbPromise) {
    dbPromise = (async () => {
      const bundle = await duckdb.selectBundle(MANUAL_BUNDLES);
      const worker = new Worker(bundle.mainWorker!);
      const logger = new duckdb.ConsoleLogger();
      const db = new duckdb.AsyncDuckDB(logger, worker);
      await db.instantiate(bundle.mainModule, bundle.pthreadWorker);
      return db;
    })();
  }
  return dbPromise;
}

export async function getConnection(): Promise<duckdb.AsyncDuckDBConnection> {
  if (!connPromise) {
    connPromise = (async () => {
      const db = await getDuckDB();
      return db.connect();
    })();
  }
  return connPromise;
}

export async function resetConnection(): Promise<void> {
  if (connPromise) {
    const conn = await connPromise;
    await conn.close();
  }
  connPromise = null;
}

export function arrowTableToJsonRows(table: { toArray: () => Array<{ toJSON: () => unknown }> }):
  Array<Record<string, unknown>> {
  return table.toArray().map((row) => row.toJSON() as Record<string, unknown>);
}
