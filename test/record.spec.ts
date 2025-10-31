import { describe, expect, it } from "vitest";

import { decode, encode } from "../src/cdr/basic";
import { CDRRecord } from "../src/cdr/record";

describe("Record", () => {
  it("builds instances with the provided values", () => {
    const record = new CDRRecord(42, 1024, 310, "2604", 77, "10.0.0.12");

    expect(record.id).toBe(42);
    expect(record.bytes_used).toBe(1024);
    expect(record.mnc).toBe(310);
    expect(record.dmcc).toBe("2604");
    expect(record.cellid).toBe(77);
    expect(record.ip).toBe("10.0.0.12");
  });
});

describe("basic encoding stubs", () => {
  it("returns undefined for decode until implemented", () => {
    expect(decode("some raw line")).toBeUndefined();
  });

  it("returns undefined for encode until implemented", () => {
    const record = new CDRRecord(42, 1024);

    expect(encode(record)).toBeUndefined();
  });
});
