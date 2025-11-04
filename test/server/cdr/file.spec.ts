import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { decode } from "../../../src/server/cdr/decode";
import { CDRRecord } from "../../../src/server/cdr";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const fixturePath = resolve(__dirname, "../../assets/cdr.dat");

describe("example CDR fixture", () => {
  it("parses all records from the sample data file", () => {
    const lines = readFileSync(fixturePath, "utf-8")
      .split(/\r?\n/)
      .filter((line) => line.length > 0);

    const records = lines.map((line) => {
      const record = decode(line);
      expect(record, `Expected to decode "${line}"`).toBeDefined();
      return record!;
    });

    expect(records).toEqual([
      new CDRRecord(4, 495594, 0, "0d39f", 214),
      new CDRRecord(16, 12921, 48771, undefined, 192, "99.229.230.61"),
      new CDRRecord(9991, 2935),
      new CDRRecord(316, 12921, 3721, undefined, 578228938, "192.1.74.255"),
      new CDRRecord(7194, 495593, 394, "b33", 192),
      new CDRRecord(7291, 293451),
    ]);
  });
});
