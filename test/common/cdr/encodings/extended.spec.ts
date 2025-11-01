import { describe, expect, it } from "vitest";

import extended from "../../../../src/api/cdr/encodings/extended";
import { CDRRecord } from "../../../../src/common/cdr";

describe("extended encoding stubs", () => {
  it("returns undefined for decode until implemented", () => {
    expect(extended.decode("some raw line")).toBeUndefined();
  });

  it("returns undefined for encode until implemented", () => {
    const record = new CDRRecord(99, 2048);

    expect(extended.encode(record)).toBeUndefined();
  });
});
