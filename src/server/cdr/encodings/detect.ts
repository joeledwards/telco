import { CDRRecord } from "../record";
import { EncodingType } from "./index";

export function detectEncoding(text: string): EncodingType | undefined {
  const pair = text.split(",", 2);

  if (pair.length != 2) {
    return undefined;
  }

  const [idStr] = pair;
  const id = parseInt(idStr);

  return idToEncoding(id);
}

export function selectEncoding(record: CDRRecord): EncodingType | undefined {
  return idToEncoding(record.id);
}

function idToEncoding(id: number): EncodingType | undefined {
  if (id == null) {
    return undefined;
  }

  if (isNaN(id)) {
    return undefined;
  }

  if (id % 10 === 4) {
    return EncodingType.Extended;
  }

  if (id % 10 === 6) {
    return EncodingType.Hex;
  }

  return EncodingType.Basic;
}