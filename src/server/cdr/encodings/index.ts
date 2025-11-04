import { CDRRecord } from "../record";
import { detectEncoding, selectEncoding } from "./detect"
import basic from "./basic";
import extended from "./extended";
import hex from "./hex";

export enum EncodingType {
  Basic = "basic",
  Extended = "extended",
  Hex = "hex",
}

export type Decoder = (text: string) => CDRRecord | undefined;
export type Encoder = (record: CDRRecord) => string | undefined;

function getDecoder(type: EncodingType): Decoder {
  switch (type) {
    case EncodingType.Basic: return basic.decode
    case EncodingType.Extended: return extended.decode
    case EncodingType.Hex: return hex.decode
  }
}

function getEncoder(type: EncodingType): Encoder {
  switch (type) {
    case EncodingType.Basic: return basic.encode
    case EncodingType.Extended: return extended.encode
    case EncodingType.Hex: return hex.encode
  }
}

const encodings = { basic, extended, hex }
export { encodings, detectEncoding, selectEncoding, getDecoder, getEncoder }
