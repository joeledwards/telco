import { Pool } from "pg";

import type {
  Storage,
  FileInsert,
  FileSummary,
  StoredRecord,
  ListFilesOptions,
  RecordFilters,
  RecordSearchOptions,
  RecordSearchResult,
} from "./index";
import type { ParsedRecord } from "../cdr/types";

type FileRow = {
  id: number;
  file_name: string;
  uploaded_at: string;
  total_lines: number;
  parsed_records: number;
  skipped_lines: number;
  invalid_records: number;
};

type RecordRow = {
  id: number;
  file_id: number;
  line_number: number;
  raw_line: string;
  cdr_id: number;
  bytes_used: number;
  mnc: number | null;
  dmcc: string | null;
  cell_id: number | null;
  ip: string | null;
  created_at: string;
};

const FILE_COLUMN_MAP: Record<NonNullable<ListFilesOptions["orderBy"]>, string> = {
  uploadedAt: "uploaded_at",
  fileName: "file_name",
};

const RECORD_ORDER_MAP: Record<
  NonNullable<RecordSearchOptions["orderBy"]>,
  string
> = {
  createdAt: "created_at",
  lineNumber: "line_number",
};

function mapFileRow(row: FileRow): FileSummary {
  return {
    id: row.id,
    fileName: row.file_name,
    uploadedAt: row.uploaded_at,
    totalLines: row.total_lines,
    parsedLines: row.parsed_records,
    skippedLines: row.skipped_lines,
    errorCount: row.invalid_records,
  };
}

function mapRecordRow(row: RecordRow): StoredRecord {
  return {
    fileId: row.file_id,
    createdAt: row.created_at,
    lineNumber: row.line_number,
    rawLine: row.raw_line,
    id: row.cdr_id,
    bytesUsed: row.bytes_used,
    mnc: row.mnc ?? undefined,
    dmcc: row.dmcc ?? undefined,
    cellId: row.cell_id ?? undefined,
    ip: row.ip ?? undefined,
  };
}

function buildRecordFilter(
  filters: RecordFilters,
  values: Array<string | number>
): string {
  const clauses: string[] = [];

  if (filters.fileId !== undefined) {
    values.push(filters.fileId);
    clauses.push(`file_id = $${values.length}`);
  }
  if (filters.cdrId !== undefined) {
    values.push(filters.cdrId);
    clauses.push(`cdr_id = $${values.length}`);
  }
  if (filters.mnc !== undefined) {
    values.push(filters.mnc);
    clauses.push(`mnc = $${values.length}`);
  }
  if (filters.dmcc !== undefined) {
    values.push(filters.dmcc);
    clauses.push(`dmcc = $${values.length}`);
  }
  if (filters.cellId !== undefined) {
    values.push(filters.cellId);
    clauses.push(`cell_id = $${values.length}`);
  }
  if (filters.ip !== undefined) {
    values.push(`%${filters.ip}%`);
    clauses.push(`ip ILIKE $${values.length}`);
  }
  if (filters.text) {
    values.push(`%${filters.text}%`);
    clauses.push(`raw_line ILIKE $${values.length}`);
  }

  return clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
}

function buildRecordInsertQuery(
  fileId: number,
  records: ParsedRecord[]
): { text: string; values: Array<number | string | null> } {
  const values: Array<number | string | null> = [];
  const columns = [
    "file_id",
    "line_number",
    "raw_line",
    "cdr_id",
    "bytes_used",
    "mnc",
    "dmcc",
    "cell_id",
    "ip",
  ];
  const tuples = records.map((record, index) => {
    const base = index * columns.length;
    values.push(
      fileId,
      record.lineNumber,
      record.rawLine,
      record.id,
      record.bytesUsed,
      record.mnc ?? null,
      record.dmcc ?? null,
      record.cellId ?? null,
      record.ip ?? null
    );
    const placeholders = columns
      .map((_, columnIndex) => `$${base + columnIndex + 1}`)
      .join(", ");
    return `(${placeholders})`;
  });

  return {
    text: `INSERT INTO cdr_records (${columns.join(", ")}) VALUES ${tuples.join(
      ", "
    )}`,
    values,
  };
}

export async function createPostgresStorage(
  connectionString: string
): Promise<Storage> {
  const pool = new Pool({ connectionString });

  const storage: Storage = {
    async createFile(file: FileInsert): Promise<FileSummary> {
      const { rows } = await pool.query<FileRow>(
        `INSERT INTO cdr_files (file_name, total_lines, parsed_records, skipped_lines, invalid_records)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, file_name, uploaded_at, total_lines, parsed_records, skipped_lines, invalid_records`,
        [
          file.fileName,
          file.totalLines,
          file.parsedLines,
          file.skippedLines,
          file.errorCount,
        ]
      );
      return mapFileRow(rows[0]);
    },

    async appendRecords(fileId: number, records: ParsedRecord[]): Promise<number> {
      if (records.length === 0) {
        return 0;
      }

      const { text, values } = buildRecordInsertQuery(fileId, records);
      const result = await pool.query(text, values);
      return result.rowCount ?? records.length;
    },

    async listFiles(options?: ListFilesOptions): Promise<FileSummary[]> {
      const {
        limit = 50,
        offset = 0,
        orderBy = "uploadedAt",
        direction = "desc",
      } = options ?? {};

      const orderColumn = FILE_COLUMN_MAP[orderBy] ?? FILE_COLUMN_MAP.uploadedAt;
      const dir = direction === "asc" ? "ASC" : "DESC";

      const { rows } = await pool.query<FileRow>(
        `SELECT id, file_name, uploaded_at, total_lines, parsed_records, skipped_lines, invalid_records
         FROM cdr_files
         ORDER BY ${orderColumn} ${dir}
         LIMIT $1 OFFSET $2`,
        [limit, offset]
      );

      return rows.map(mapFileRow);
    },

    async getFile(
      fileId: number
    ): Promise<(FileSummary & { recordCount: number }) | null> {
      const { rows } = await pool.query<
        FileRow & { record_count: string }
      >(
        `SELECT id, file_name, uploaded_at, total_lines, parsed_records, skipped_lines, invalid_records,
                (SELECT COUNT(*) FROM cdr_records WHERE file_id = cdr_files.id) AS record_count
         FROM cdr_files
         WHERE id = $1`,
        [fileId]
      );

      if (rows.length === 0) {
        return null;
      }

      const row = rows[0];
      return {
        ...mapFileRow(row),
        recordCount: Number(row.record_count ?? 0),
      };
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

      const values: Array<string | number> = [];
      const whereClause = buildRecordFilter(filters, values);
      const orderColumn = RECORD_ORDER_MAP[orderBy] ?? RECORD_ORDER_MAP.createdAt;
      const dir = direction === "asc" ? "ASC" : "DESC";

      const limitIndex = values.push(limit);
      const offsetIndex = values.push(offset);

      const query = `SELECT id, file_id, line_number, raw_line, cdr_id, bytes_used, mnc, dmcc, cell_id, ip, created_at
        FROM cdr_records
        ${whereClause}
        ORDER BY ${orderColumn} ${dir}
        LIMIT $${limitIndex} OFFSET $${offsetIndex}`;

      const { rows } = await pool.query<RecordRow>(query, values);
      const records = rows.map(mapRecordRow);

      let total: number | undefined;
      if (includeTotal) {
        const countValues = values.slice(0, values.length - 2);
        const countQuery = `SELECT COUNT(*) AS total FROM cdr_records ${whereClause}`;
        const { rows: countRows } = await pool.query<{ total: string }>(
          countQuery,
          countValues
        );
        total = Number(countRows[0]?.total ?? 0);
      }

      return { records, total };
    },
  };

  return storage;
}
