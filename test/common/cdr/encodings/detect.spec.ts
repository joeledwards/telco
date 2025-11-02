import { describe, expect, it } from "vitest";

import { detectEncoding } from "../../../../src/api/cdr/encodings/detect";
import { EncodingType } from "../../../../src/api/cdr/encodings";


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
