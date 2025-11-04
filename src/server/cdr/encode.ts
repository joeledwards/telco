import { CDRRecord } from "./record";
import { getEncoder } from "./encodings";
import { selectEncoding } from "./encodings/detect";

export function encode(record: CDRRecord): string | undefined {
  const encoding = selectEncoding(record);

  if (!encoding) {
    return undefined;
  }

  const encoder = getEncoder(encoding);
  return encoder(record);
}
