import { describe, expect, it } from "vitest";

import { encode } from "../../../src/server/cdr/encode";
import { CDRRecord } from "../../../src/server/cdr";


describe("encode", () => {
  function compare(record: CDRRecord, expected: string) {
    const text = encode(record)
    if (text === undefined) {
        expect(text).toBeDefined
    } else {
        expect(text).toBe(expected)
    }
  }

  it("correctly detects and encodes records with basic ID", () => {
    compare(new CDRRecord(2,1,undefined,undefined,undefined,undefined), "2,1");
  });

  it("correctly detects and encodes records with extended ID", () => {
    compare(new CDRRecord(4,1,3,"heyo",5,undefined), "4,heyo,3,1,5");
  });

  it("correctly detects and encodes records with hex ID", () => {
    compare(new CDRRecord(6,1,3,undefined,5,"1.1.1.1"), "6,000300010000000501010101");
  });

  it("returns undefined for invalid records", () => {
    expect(encode(new CDRRecord(4, 1))).toBeUndefined();
    expect(encode(new CDRRecord(4,1,undefined,"heyo",5,undefined))).toBeUndefined();
    expect(encode(new CDRRecord(4,1,3,undefined,5,undefined))).toBeUndefined();
    expect(encode(new CDRRecord(4,1,3,"heyo",undefined,undefined))).toBeUndefined();

    expect(encode(new CDRRecord(6, 1))).toBeUndefined();
    expect(encode(new CDRRecord(6,1,undefined,undefined,5,"1.1.1.1"))).toBeUndefined();
    expect(encode(new CDRRecord(6,1,3,undefined,undefined,"1.1.1.1"))).toBeUndefined();
    expect(encode(new CDRRecord(6,1,3,undefined,5,undefined))).toBeUndefined();
  });
});
