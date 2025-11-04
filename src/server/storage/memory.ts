import type {
  Storage,
  FileInsert,
  FileSummary,
  StoredRecord,
  RecordFilters,
  RecordSearchOptions,
  RecordSearchResult,
  ListFilesOptions,
} from "./index";
import type { ParsedRecord } from "../cdr/types";

type StoredFile = FileSummary & { recordCount: number };

const files = new Map<number, StoredFile>();
const recordsByFile = new Map<number, StoredRecord[]>();
let nextFileId = 1;

function toFileSummary(file: StoredFile): FileSummary {
  const { recordCount: _recordCount, ...rest } = file;
  return rest;
}

function ensureRecordList(fileId: number): StoredRecord[] {
  if (!recordsByFile.has(fileId)) {
    recordsByFile.set(fileId, []);
  }
  return recordsByFile.get(fileId)!;
}

function matchesFilters(record: StoredRecord, filters: RecordFilters): boolean {
  if (filters.fileId !== undefined && record.fileId !== filters.fileId) {
    return false;
  }
  if (filters.cdrId !== undefined && record.id !== filters.cdrId) {
    return false;
  }
  if (filters.mnc !== undefined && record.mnc !== filters.mnc) {
    return false;
  }
  if (filters.dmcc !== undefined && record.dmcc !== filters.dmcc) {
    return false;
  }
  if (filters.cellId !== undefined && record.cellId !== filters.cellId) {
    return false;
  }
  if (filters.ip !== undefined) {
    const ipNeedle = filters.ip.toLowerCase();
    const haystack = record.ip?.toLowerCase() ?? "";
    if (!haystack.includes(ipNeedle)) {
      return false;
    }
  }
  if (filters.text) {
    const needle = filters.text.toLowerCase();
    if (!record.rawLine.toLowerCase().includes(needle)) {
      return false;
    }
  }
  return true;
}

function sortRecords(
  records: StoredRecord[],
  orderBy: Required<RecordSearchOptions>["orderBy"],
  direction: Required<RecordSearchOptions>["direction"]
): StoredRecord[] {
  const factor = direction === "asc" ? 1 : -1;
  return records.sort((a, b) => {
    const left = orderBy === "lineNumber" ? a.lineNumber : Date.parse(a.createdAt);
    const right = orderBy === "lineNumber" ? b.lineNumber : Date.parse(b.createdAt);
    if (left === right) {
      return 0;
    }
    return left > right ? factor : -factor;
  });
}

function paginate<T>(items: T[], limit = 50, offset = 0): T[] {
  const start = Math.max(offset, 0);
  return items.slice(start, start + (limit ?? items.length));
}

export function createMemoryStorage(): Storage {
  return {
    async createFile(file: FileInsert): Promise<FileSummary> {
      const stored: StoredFile = {
        ...file,
        id: nextFileId++,
        uploadedAt: new Date().toISOString(),
        recordCount: 0,
      };

      files.set(stored.id, stored);
      return toFileSummary(stored);
    },

    async appendRecords(fileId: number, records: ParsedRecord[]): Promise<number> {
      if (records.length === 0) {
        return 0;
      }

      const targetFile = files.get(fileId);
      if (!targetFile) {
        throw new Error(`File ${fileId} not found`);
      }

      const bucket = ensureRecordList(fileId);
      records.forEach((record) => {
        const storedRecord: StoredRecord = {
          ...record,
          fileId,
          createdAt: new Date().toISOString(),
        };
        bucket.push(storedRecord);
      });
      targetFile.recordCount += records.length;
      return records.length;
    },

    async listFiles(options?: ListFilesOptions): Promise<FileSummary[]> {
      const {
        limit = 50,
        offset = 0,
        orderBy = "uploadedAt",
        direction = "desc",
      } = options ?? {};

      const all = Array.from(files.values());
      const factor = direction === "asc" ? 1 : -1;
      all.sort((a, b) => {
        if (orderBy === "fileName") {
          return a.fileName.localeCompare(b.fileName) * factor;
        }
        return a.uploadedAt > b.uploadedAt ? factor : -factor;
      });

      return paginate(all, limit, offset).map(toFileSummary);
    },

    async getFile(
      fileId: number
    ): Promise<(FileSummary & { recordCount: number }) | null> {
      const file = files.get(fileId);
      return file ? { ...file } : null;
    },

    async searchRecords(
      filters: RecordFilters,
      options?: RecordSearchOptions
    ): Promise<RecordSearchResult> {
      const {
        limit = 50,
        offset = 0,
        orderBy = "createdAt",
        direction = "desc",
        includeTotal = false,
      } = options ?? {};

      let allRecords: StoredRecord[] = [];
      if (filters.fileId !== undefined) {
        allRecords = [...(recordsByFile.get(filters.fileId) ?? [])];
      } else {
        for (const bucket of recordsByFile.values()) {
          allRecords.push(...bucket);
        }
      }

      const filtered = filters
        ? allRecords.filter((record) => matchesFilters(record, filters))
        : allRecords;

      const sorted = sortRecords(filtered.slice(), orderBy, direction);
      const paged = paginate(sorted, limit, offset);

      return {
        records: paged,
        total: includeTotal ? filtered.length : undefined,
      };
    },
  };
}
