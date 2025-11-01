import { describe, expect, it } from "vitest";

import hex from "../../../src/cdr/encodings/hex";
import { CDRRecord } from "../../../src/cdr/record";

describe("hex encoding stubs", () => {
  it("returns undefined for decode until implemented", () => {
    expect(hex.decode("some raw line")).toBeUndefined();
  });

  it("returns undefined for encode until implemented", () => {
    const record = new CDRRecord(7, 512);

    expect(hex.encode(record)).toBeUndefined();
  });
});
