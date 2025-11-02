import { describe, expect, it } from "vitest";

import extended from "../../../../src/api/cdr/encodings/extended";
import { CDRRecord } from "../../../../src/common/cdr";

describe("extended encoding stubs", () => {
  it("returns the record for a valid line", () => {
    const record = new CDRRecord(94, 1024, 33, "meh", 22, "1.1.1.1");
    expect(extended.encode(record)).toBe("94,meh,33,1024,22");
  });

  it("returns undefined for invalid text", () => {
    expect(extended.decode("some raw line")).toBeUndefined();
  });
});
