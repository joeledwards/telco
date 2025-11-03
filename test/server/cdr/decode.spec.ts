import { describe, expect, it } from "vitest";

import { decode } from "../../../src/server/cdr/decode";
import { CDRRecord } from "../../../src/server/cdr";


describe("detectEncoding", () => {
  function compare(text: string, record: CDRRecord) {
    const r = decode(text)
    if (r === undefined) {
        expect(r).toBeDefined
    } else {
        expect(r.id).toBe(record.id)
        expect(r.bytesUsed).toBe(record.bytesUsed)
        expect(r.mnc).toBe(record.mnc)
        expect(r.dmcc).toBe(record.dmcc)
        expect(r.cellId).toBe(record.cellId)
        expect(r.ip).toBe(record.ip)
    }
  }

  it("correctly detects and decodes valid records", () => {
    compare("2,1", new CDRRecord(2,1,undefined,undefined,undefined,undefined));
    compare("4,heyo,3,1,5", new CDRRecord(4,1,3,"heyo",5,undefined));
    compare("6,00030001000501010101", new CDRRecord(6,1,3,undefined,5,"1.1.1.1"));
  });

  it("returns undefined for invalid records", () => {
    expect(decode("")).toBeUndefined();
    expect(decode(",a")).toBeUndefined();
    expect(decode("2")).toBeUndefined();
    expect(decode("4")).toBeUndefined();
    expect(decode("6")).toBeUndefined();
    expect(decode("2.a")).toBeUndefined();
    expect(decode("4.a")).toBeUndefined();
    expect(decode("6.a")).toBeUndefined();
  });
});
