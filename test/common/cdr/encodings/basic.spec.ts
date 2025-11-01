import { describe, expect, it } from "vitest";

import basic from "../../../../src/api/cdr/encodings/basic";
import { CDRRecord } from "../../../../src/common/cdr";

describe("basic encoding stubs", () => {
  it("returns undefined for decode until implemented", () => {
    expect(basic.decode("some raw line")).toBeUndefined();
  });

  it("returns undefined for encode until implemented", () => {
    const record = new CDRRecord(42, 1024);

    expect(basic.encode(record)).toBeUndefined();
  });
});
