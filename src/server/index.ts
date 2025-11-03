import { createServer, IncomingMessage, ServerResponse } from "node:http";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";

import { decode } from "../api/cdr/decode";
import { CDRRecord } from "../common/cdr";

type UploadRequest = {
  fileName?: string;
  content?: string;
};

type ParsedRecord = {
  id: number;
  bytesUsed: number;
  mnc?: number;
  dmcc?: string;
  cellId?: number;
  ip?: string;
};

type ParseError = {
  lineNumber: number;
  content: string;
  reason: string;
};

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

function recordToJson(record: CDRRecord): ParsedRecord {
  return {
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

function parseContent(
  fileName: string | undefined,
  content: string
): {
  fileName: string;
  totalLines: number;
  records: ParsedRecord[];
  errors: ParseError[];
} {
  const lines = content.split(/\r?\n/);
  const records: ParsedRecord[] = [];
  const errors: ParseError[] = [];

  lines.forEach((line, index) => {
    const lineNumber = index + 1;
    if (line.trim().length === 0) {
      return;
    }

    try {
      const decoded = decode(line);

      if (decoded) {
        records.push(recordToJson(decoded));
      } else {
        errors.push({
          lineNumber,
          content: line,
          reason: "Unable to detect encoding or decode record",
        });
      }
    } catch (err) {
      const reason =
        err instanceof Error ? err.message : "Unknown decoding error";
      errors.push({ lineNumber, content: line, reason });
    }
  });

  return {
    fileName: fileName ?? "unknown",
    totalLines: lines.length,
    records,
    errors,
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

    let payload: UploadRequest;
    try {
      payload = JSON.parse(rawBody) as UploadRequest;
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

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(result));
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: message }));
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

server.listen(PORT, HOST, () => {
  console.log(`Server listening on http://${HOST}:${PORT}`);
});
