import { CDRRecord } from "../record";

function decode(text: string): CDRRecord | undefined {
  const parts = text.split(",");

  if (parts.length != 2) {
    return undefined;
  }

  const [idStr, bytesUsedStr] = parts;

  if (idStr.length === 0) {
    return undefined;
  }

  const id = parseInt(idStr);
  const bytesUsed = parseInt(bytesUsedStr);

  if (isNaN(id) || isNaN(bytesUsed)) {
    return undefined;
  }

  return new CDRRecord(
    id,
    bytesUsed,
    undefined,
    undefined,
    undefined,
    undefined
  );
}

function encode(record: CDRRecord): string | undefined {
  return `${record.id},${record.bytesUsed}`;
}

export { decode, encode };
export default { decode, encode };
