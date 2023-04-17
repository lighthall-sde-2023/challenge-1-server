import path from "path";
import * as fs from "fs";
import Database from "better-sqlite3";
import cluster from "cluster";
import { IClickInfo } from "./types";

const DATABASE_DIR = path.join(process.cwd(), "db");

if (cluster.isPrimary) {
  if (!fs.existsSync(DATABASE_DIR)) {
    fs.mkdirSync(DATABASE_DIR, { recursive: true });
  }
}

const db = Database(path.join(DATABASE_DIR, "data.db"));

if (cluster.isPrimary) {
  const TABLE_STATEMENTS = [
    `
    CREATE TABLE IF NOT EXISTS locations(
        id TEXT PRIMARY KEY,
        clicks INTEGER NOT NULL
    ) WITHOUT ROWID;
    `,
  ];

  // fix concurrency issues
  db.pragma("journal_mode = WAL");

  db.pragma("wal_checkpoint(RESTART)");

  const checkDbSize = async () => {
    try {
      const stats = await fs.promises.stat(
        path.join(DATABASE_DIR, "data.db-wal")
      );
      if (stats.size / (1024 * 1024) > 50) {
        db.pragma("wal_checkpoint(RESTART)");
      }
    } catch (error: any) {
      if (error.code !== "ENOENT") throw error;
    }
  };
  setInterval(checkDbSize, 5000).unref();

  db.transaction((statements: string[]) => {
    statements.forEach((statement) => {
      db.prepare(statement).run();
    });
  }).immediate(TABLE_STATEMENTS);
}

export function getTime(offset?: number) {
  return Math.round(Date.now()) + (offset || 0);
}

const UpdateClicksStatement = db.prepare<{
  id: string;
  delta: number;
}>(`INSERT INTO locations (id, clicks) VALUES (@id, @delta)
ON CONFLICT(id) DO UPDATE SET clicks = clicks + @delta;`);

const GetClicksStatement = db.prepare(
  `SELECT * FROM locations ORDER BY clicks DESC`
);

export function incrementClicks(id: string, delta = 1) {
  UpdateClicksStatement.run({
    id: id,
    delta: delta,
  });
}

export function getClicks() {
  return GetClicksStatement.all() as IClickInfo[];
}
