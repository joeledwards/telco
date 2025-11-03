import basic from "./basic";
import extended from "./extended";
import hex from "./hex";

const encodings = { basic, extended, hex };
type EncodingKey = keyof typeof encodings;

export enum EncodingType {
  Basic = "basic",
  Extended = "extended",
  Hex = "hex",
}

export const encodingMap: Record<EncodingType, EncodingKey> = {
  [EncodingType.Basic]: "basic",
  [EncodingType.Extended]: "extended",
  [EncodingType.Hex]: "hex",
};

export { basic, extended, hex };
export type { EncodingKey };
export default encodings;
