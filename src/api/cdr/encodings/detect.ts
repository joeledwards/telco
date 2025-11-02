import { EncodingType } from "./"

export function detectEncoding(line: string): EncodingType | undefined {
  const pair = line.split(",", 2)

  if (pair.length != 2) {
    return undefined
  }

  const [idStr, data] = pair
  const id = parseInt(idStr)

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