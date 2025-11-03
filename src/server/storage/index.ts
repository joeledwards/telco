import { getConfig } from "../config";
import { createPostgresStorage } from "./postgres";
import { createMemoryStorage } from "./memory";
import { ParsedRecord } from "../cdr/types";

export type FileInsert = {
  fileName: string;
  totalLines: number;
  parsedLines: number;
  skippedLines: number;
  errorCount: number;
};

export type FileSummary = FileInsert & {
  id: number;
  uploadedAt: string;
};

export type ListFilesOptions = {
  limit?: number;
  offset?: number;
  orderBy?: "uploadedAt" | "fileName";
  direction?: "asc" | "desc";
};

export type StoredRecord = ParsedRecord & {
  fileId: number;
  createdAt: string;
};

export type RecordFilters = {
  fileId?: number;
  cdrId?: number;
  mnc?: number;
  dmcc?: string;
  cellId?: number;
  ip?: string;
  text?: string;
};

export type RecordSearchOptions = {
  limit?: number;
  offset?: number;
  orderBy?: "lineNumber" | "createdAt";
  direction?: "asc" | "desc";
  includeTotal?: boolean;
};

export type RecordSearchResult = {
  records: StoredRecord[];
  total?: number;
};

export type Storage = {
  createFile(file: FileInsert): Promise<FileSummary>;
  appendRecords(fileId: number, records: ParsedRecord[]): Promise<number>;
  listFiles(options?: ListFilesOptions): Promise<FileSummary[]>;
  getFile(
    fileId: number
  ): Promise<(FileSummary & { recordCount: number }) | null>;
  searchRecords(
    filters: RecordFilters,
    options?: RecordSearchOptions
  ): Promise<RecordSearchResult>;
};

let storageInstance: Storage | undefined;

export async function loadStorage(): Promise<Storage> {
  if (storageInstance) {
    return storageInstance;
  }

  const config = await getConfig();

  storageInstance =
    config.mode === "database"
      ? await createPostgresStorage(config.connectionString)
      : createMemoryStorage();

  return storageInstance;
}

export const storagePromise = loadStorage();
export const storage = {
  async createFile(file: FileInsert) {
    const impl = await storagePromise;
    return impl.createFile(file);
  },
  async appendRecords(fileId: number, records: ParsedRecord[]) {
    const impl = await storagePromise;
    return impl.appendRecords(fileId, records);
  },
  async listFiles(options?: ListFilesOptions) {
    const impl = await storagePromise;
    return impl.listFiles(options);
  },
  async getFile(fileId: number) {
    const impl = await storagePromise;
    return impl.getFile(fileId);
  },
  async searchRecords(filters: RecordFilters, options?: RecordSearchOptions) {
    const impl = await storagePromise;
    return impl.searchRecords(filters, options);
  },
};
