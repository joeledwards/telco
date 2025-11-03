import { CDRRecord } from "./record";
import encodings, { EncodingType, encodingMap } from "./encodings";
import { detectEncoding } from "./encodings/detect";

export function decode(line: string): CDRRecord | undefined {
  const encoding = detectEncoding(line);

  if (!encoding) {
    return undefined;
  }

  const decoder = encodings[encodingMap[encoding]];

  return decoder.decode(line);
}
