import { describe, expect, it } from "vitest";

import basic from "../../../../src/server/cdr/encodings/basic";
import { CDRRecord } from "../../../../src/server/cdr";

describe("basic encoding stubs", () => {
  it("returns the record for valid text", () => {
    const record = new CDRRecord(42, 1024, 33, "meh", 22, "1.1.1.1");
    expect(basic.encode(record)).toBe("42,1024");
  });

  it("returns undefined for invalid text", () => {
    expect(basic.decode("some raw line")).toBeUndefined();
  });

});
