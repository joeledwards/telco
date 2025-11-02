import { describe, expect, it } from "vitest";

import { CDRRecord } from "../../../src/cdr";

describe("Record", () => {
  it("builds instances with the provided values", () => {
    const record = new CDRRecord(42, 1024, 310, "2604", 77, "10.0.0.12");

    expect(record.id).toBe(42);
    expect(record.bytesUsed).toBe(1024);
    expect(record.mnc).toBe(310);
    expect(record.dmcc).toBe("2604");
    expect(record.cellId).toBe(77);
    expect(record.ip).toBe("10.0.0.12");
  });
});
