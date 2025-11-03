import { createServer, IncomingMessage, ServerResponse } from "node:http";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";

import { decode } from "./cdr/decode";
import { CDRRecord } from "./cdr";
import { storage, type RecordFilters } from "./storage";
import { ParseError, ParseResult, ParsedRecord } from "./cdr/types";
import { getConfig } from "./config";

const projectRoot = path.resolve(__dirname, "..", "..");
const publicDir = path.join(projectRoot, "public");

const HOST = process.env.HOST ?? "127.0.0.1";
const PORT = Number(process.env.PORT ?? 3000);

const mimeTypes: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".ico": "image/x-icon",
  ".png": "image/png",
  ".svg": "image/svg+xml",
};

function parseNumberParam(
  raw: string | null,
  fallback?: number
): number | undefined {
  if (raw === null || raw.length === 0) {
    return fallback;
  }
  const value = Number(raw);
  return Number.isFinite(value) ? value : fallback;
}

function sendJSON(res: ServerResponse, status: number, payload: unknown): void {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(payload));
}

function decodeLine(
  record: CDRRecord,
  lineNumber: number,
  rawLine: string
): ParsedRecord {
  return {
    lineNumber,
    rawLine,
    id: record.id,
    bytesUsed: record.bytesUsed,
    mnc: record.mnc,
    dmcc: record.dmcc,
    cellId: record.cellId,
    ip: record.ip,
  };
}

async function readRequestBody(req: IncomingMessage): Promise<string> {
  const chunks: Buffer[] = [];

  for await (const chunk of req) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }

  return Buffer.concat(chunks).toString("utf-8");
}

function parseContent(fileName: string | undefined, content: string): ParseResult {
  const lines = content.split(/\r?\n/);
  const records: ParsedRecord[] = [];
  const invalidRecords: ParseError[] = [];
  let skippedLines = 0;

  lines.forEach((line, index) => {
    const lineNumber = index + 1;

    if (line.trim().length === 0) {
      skippedLines += 1;
      return;
    }

    try {
      const decoded = decode(line);

      if (decoded) {
        records.push(decodeLine(decoded, lineNumber, line));
      } else {
        invalidRecords.push({
          lineNumber,
          content: line,
          reason: "Unable to detect encoding or decode record",
        });
      }
    } catch (err) {
      const reason =
        err instanceof Error ? err.message : "Unknown decoding error";
      invalidRecords.push({ lineNumber, content: line, reason });
    }
  });

  return {
    fileName: fileName ?? "unknown",
    totalLines: lines.length,
    parsedLines: records.length,
    skippedLines,
    errors: invalidRecords.length,
    records,
    invalidRecords,
  };
}

async function handleUpload(
  req: IncomingMessage,
  res: ServerResponse
): Promise<void> {
  try {
    const rawBody = await readRequestBody(req);
    if (!rawBody) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Request body is empty" }));
      return;
    }

    let payload: { fileName?: string; content?: string };
    try {
      payload = JSON.parse(rawBody);
    } catch {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Invalid JSON payload" }));
      return;
    }

    if (!payload.content || payload.content.length === 0) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "content is required" }));
      return;
    }

    const result = parseContent(payload.fileName, payload.content);

    const fileRecord = await storage.createFile({
      fileName: result.fileName,
      totalLines: result.totalLines,
      parsedLines: result.parsedLines,
      skippedLines: result.skippedLines,
      errorCount: result.errors,
    });

    if (result.records.length > 0) {
      await storage.appendRecords(fileRecord.id, result.records);
    }

    sendJSON(res, 200, {
      ...result,
      fileId: fileRecord.id,
      uploadedAt: fileRecord.uploadedAt,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    sendJSON(res, 500, { error: message });
  }
}

async function serveStaticFile(
  filePath: string,
  res: ServerResponse
): Promise<void> {
  try {
    const fileStat = await stat(filePath);

    if (fileStat.isDirectory()) {
      const indexPath = path.join(filePath, "index.html");
      await serveStaticFile(indexPath, res);
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = mimeTypes[ext] ?? "application/octet-stream";
    const file = await readFile(filePath);

    res.writeHead(200, { "Content-Type": contentType });
    res.end(file);
  } catch {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Not found");
  }
}

const server = createServer(async (req, res) => {
  if (!req.url) {
    res.writeHead(400, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Bad request");
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host}`);

  if (req.method === "POST" && url.pathname === "/api/cdr/upload") {
    await handleUpload(req, res);
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/cdr/files") {
    const limit = parseNumberParam(url.searchParams.get("limit"), 50);
    const offset = parseNumberParam(url.searchParams.get("offset"), 0);
    const order = url.searchParams.get("orderBy") === "fileName"
      ? "fileName"
      : "uploadedAt";
    const direction = url.searchParams.get("direction") === "asc" ? "asc" : "desc";

    const files = await storage.listFiles({
      limit,
      offset,
      orderBy: order,
      direction,
    });

    sendJSON(res, 200, { files });
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/cdr/records") {
    const filters: RecordFilters = {};
    const s = url.searchParams;
    const maybeFileId = parseNumberParam(s.get("fileId"));
    const maybeCdrId = parseNumberParam(s.get("cdrId"));
    const maybeMnc = parseNumberParam(s.get("mnc"));
    const maybeCellId = parseNumberParam(s.get("cellId"));

    if (maybeFileId !== undefined) filters.fileId = maybeFileId;
    if (maybeCdrId !== undefined) filters.cdrId = maybeCdrId;
    if (maybeMnc !== undefined) filters.mnc = maybeMnc;
    if (maybeCellId !== undefined) filters.cellId = maybeCellId;

    const dmcc = s.get("dmcc");
    if (dmcc) filters.dmcc = dmcc;
    const ip = s.get("ip");
    if (ip) filters.ip = ip;
    const text = s.get("text");
    if (text) filters.text = text;

    const limit = parseNumberParam(s.get("limit"), 50);
    const offset = parseNumberParam(s.get("offset"), 0);
    const orderBy = s.get("orderBy") === "lineNumber" ? "lineNumber" : "createdAt";
    const direction = s.get("direction") === "asc" ? "asc" : "desc";
    const includeTotal = s.get("includeTotal") === "true";

    const result = await storage.searchRecords(filters, {
      limit,
      offset,
      orderBy,
      direction,
      includeTotal,
    });

    sendJSON(res, 200, result);
    return;
  }

  if (req.method === "GET") {
    let filePath = path.join(publicDir, url.pathname);

    if (url.pathname === "/") {
      filePath = path.join(publicDir, "index.html");
    }

    await serveStaticFile(filePath, res);
    return;
  }

  res.writeHead(405, { "Content-Type": "text/plain; charset=utf-8" });
  res.end("Method not allowed");
});

getConfig().then(() => {
  server.listen(PORT, HOST, () => {
    console.log(`Server listening on http://${HOST}:${PORT}`);
  });
});
