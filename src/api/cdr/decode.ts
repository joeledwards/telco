import { CDRRecord } from "../../common/cdr";
import encodings from "./encodings";
import { EncodingType, encodingMap } from "./encodings";
import { detectEncoding } from "./encodings/detect";

export function decode(line: string): CDRRecord | undefined {
  const encoding = detectEncoding(line);

  if (!encoding) {
    return undefined;
  }

  const decoder = encodings[encodingMap[encoding]];

  return decoder.decode(line);
}
