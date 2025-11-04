import { describe, expect, it } from "vitest";

import { detectEncoding, selectEncoding } from "../../../../src/server/cdr/encodings/detect";
import { EncodingType } from "../../../../src/server/cdr/encodings";
import { CDRRecord } from "../../../../src/server/cdr";


describe("detectEncoding", () => {
  it("correctly detects extended encoding", () => {
    expect(detectEncoding("4,a")).toBe(EncodingType.Extended);
    expect(detectEncoding("14,a")).toBe(EncodingType.Extended);
  });

  it("correctly detects hex encoding", () => {
    expect(detectEncoding("6,a")).toBe(EncodingType.Hex);
    expect(detectEncoding("16,a")).toBe(EncodingType.Hex);
  });

  it("correctly detects extended encoding", () => {
    expect(detectEncoding("0,a")).toBe(EncodingType.Basic);
    expect(detectEncoding("1,a")).toBe(EncodingType.Basic);
    expect(detectEncoding("2,a")).toBe(EncodingType.Basic);
    expect(detectEncoding("3,a")).toBe(EncodingType.Basic);
    expect(detectEncoding("5,a")).toBe(EncodingType.Basic);
    expect(detectEncoding("7,a")).toBe(EncodingType.Basic);
    expect(detectEncoding("8,a")).toBe(EncodingType.Basic);
    expect(detectEncoding("9,a")).toBe(EncodingType.Basic);
    expect(detectEncoding("10,a")).toBe(EncodingType.Basic);
    expect(detectEncoding("01,a")).toBe(EncodingType.Basic);
  });

  it("returns undefined for invalid structure", () => {
    expect(detectEncoding("")).toBeUndefined();
    expect(detectEncoding(",a")).toBeUndefined();
    expect(detectEncoding("2")).toBeUndefined();
    expect(detectEncoding("4")).toBeUndefined();
    expect(detectEncoding("6")).toBeUndefined();
    expect(detectEncoding("2.a")).toBeUndefined();
    expect(detectEncoding("4.a")).toBeUndefined();
    expect(detectEncoding("6.a")).toBeUndefined();
  });
});

describe("selectEncoding", () => {
  it("correctly selects extended encoding", () => {
    expect(selectEncoding(new CDRRecord(4, 1))).toBe(EncodingType.Extended);
    expect(selectEncoding(new CDRRecord(14, 1))).toBe(EncodingType.Extended);
  });

  it("correctly detects hex encoding", () => {
    expect(selectEncoding(new CDRRecord(6, 1))).toBe(EncodingType.Hex);
    expect(selectEncoding(new CDRRecord(16, 1))).toBe(EncodingType.Hex);
  });

  it("correctly detects extended encoding", () => {
    expect(selectEncoding(new CDRRecord(0, 1))).toBe(EncodingType.Basic);
    expect(selectEncoding(new CDRRecord(1, 1))).toBe(EncodingType.Basic);
    expect(selectEncoding(new CDRRecord(2, 1))).toBe(EncodingType.Basic);
    expect(selectEncoding(new CDRRecord(3, 1))).toBe(EncodingType.Basic);
    expect(selectEncoding(new CDRRecord(5, 1))).toBe(EncodingType.Basic);
    expect(selectEncoding(new CDRRecord(7, 1))).toBe(EncodingType.Basic);
    expect(selectEncoding(new CDRRecord(8, 1))).toBe(EncodingType.Basic);
    expect(selectEncoding(new CDRRecord(9, 1))).toBe(EncodingType.Basic);
    expect(selectEncoding(new CDRRecord(10, 1))).toBe(EncodingType.Basic);
  });
});
