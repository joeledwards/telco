import { describe, expect, it } from "vitest";

import hex from "../../../../src/server/cdr/encodings/hex";
import { CDRRecord } from "../../../../src/server/cdr";

describe("hex encoding stubs", () => {
  function compare(text: string, record: CDRRecord) {
    const r = hex.decode(text)
        expect(r!.id).toBe(record.id)
        expect(r!.bytesUsed).toBe(record.bytesUsed)
        expect(r!.mnc).toBe(record.mnc)
        expect(r!.dmcc).toBe(record.dmcc)
        expect(r!.cellId).toBe(record.cellId)
        expect(r!.ip).toBe(record.ip)
  }

  it("returns the record for a valid ipv4 line", () => {
    const line = "26,000200010000000301010101"
    const record = new CDRRecord(26, 1, 2, undefined, 3, "1.1.1.1");
    compare(line, record)
  });

  it("returns the record for a valid ipv6 line", () => {
    const line = "26,000200010000000320010db885a3000000008a2e03707334"
    const record = new CDRRecord(26, 1, 2, undefined, 3, "2001:0db8:85a3:0000:0000:8a2e:0370:7334");
    compare(line, record)
  });

  it("returns undefined for invalid text", () => {
    expect(hex.decode("some raw line")).toBeUndefined();
  });
});
