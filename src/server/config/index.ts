export type StorageConfig =
  | { mode: "memory" }
  | { mode: "database"; connectionString: string };

let cachedConfig: StorageConfig | undefined;

export async function getConfig(): Promise<StorageConfig> {
  if (cachedConfig) {
    return cachedConfig;
  }

  const connectionString = process.env.DATABASE_URL;

  cachedConfig = connectionString
    ? { mode: "database", connectionString }
    : { mode: "memory" };

  return cachedConfig;
}

export async function isDatabaseEnabled(): Promise<boolean> {
  const config = await getConfig();
  return config.mode === "database";
}
