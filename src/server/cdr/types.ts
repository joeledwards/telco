export type ParsedRecord = {
  lineNumber: number;
  rawLine: string;
  id: number;
  bytesUsed: number;
  mnc?: number;
  dmcc?: string;
  cellId?: number;
  ip?: string;
};

export type ParseError = {
  lineNumber: number;
  content: string;
  reason: string;
};

export type ParseResult = {
  fileName: string;
  totalLines: number;
  parsedLines: number;
  skippedLines: number;
  errors: number;
  records: ParsedRecord[];
  invalidRecords: ParseError[];
};
