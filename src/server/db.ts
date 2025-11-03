import { Pool, PoolConfig } from "pg";

const connectionString = process.env.DATABASE_URL;
const explicitHost = process.env.PGHOST;

export const isDatabaseEnabled = Boolean(connectionString || explicitHost);

let pool: Pool | undefined;

function createPool(): Pool {
  const config: PoolConfig = connectionString
    ? { connectionString }
    : {
        host: explicitHost!,
        port: process.env.PGPORT ? Number(process.env.PGPORT) : 5432,
        user: process.env.PGUSER ?? "postgres",
        password: process.env.PGPASSWORD,
        database: process.env.PGDATABASE ?? "telco",
      };

  return new Pool(config);
}

function getPool(): Pool {
  if (!isDatabaseEnabled) {
    throw new Error("Database is not configured.");
  }

  if (!pool) {
    pool = createPool();
  }

  return pool;
}

export async function withTransaction<T>(
  handler: (client: import("pg").PoolClient) => Promise<T>
): Promise<T> {
  const activePool = getPool();
  const client = await activePool.connect();
  try {
    await client.query("BEGIN");
    const result = await handler(client);
    await client.query("COMMIT");
    return result;
  } catch (err) {
    try {
      await client.query("ROLLBACK");
    } catch (rollbackErr) {
      console.error("Failed to rollback transaction:", rollbackErr);
    }
    throw err;
  } finally {
    client.release();
  }
}

export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = undefined;
  }
}

process.on("SIGINT", async () => {
  await closePool();
  process.exit(0);
});
