import { describe, expect, it } from "vitest";

import hex from "../../../../src/server/cdr/encodings/hex";
import { CDRRecord } from "../../../../src/server/cdr";

describe("hex encoding stubs", () => {
  it("returns the record for a valid line", () => {
    const record = new CDRRecord(26, 1, 2, "meh", 3, "1.1.1.1");
    expect(hex.encode(record)).toBe("26,000200010000000301010101");
  });

  it("returns undefined for invalid text", () => {
    expect(hex.decode("some raw line")).toBeUndefined();
  });
});
