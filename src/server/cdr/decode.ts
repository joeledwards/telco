import { CDRRecord } from "./record";
import { getDecoder } from "./encodings";
import { detectEncoding } from "./encodings/detect";

export function decode(text: string): CDRRecord | undefined {
  const encoding = detectEncoding(text);

  if (!encoding) {
    return undefined;
  }

  const decoder = getDecoder(encoding);
  return decoder(text);
}
