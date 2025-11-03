import { CDRRecord } from "../record";

function decode(text: string): CDRRecord | undefined {
  const parts = text.split(",");

  if (parts.length != 5) {
    return undefined;
  }

  const [idStr, dmcc, mncStr, bytesUsedStr, cellIdStr] = parts;
  const id = parseInt(idStr);
  const mnc = parseInt(mncStr);
  const bytesUsed = parseInt(bytesUsedStr);
  const cellId = parseInt(cellIdStr);

  if (isNaN(id) || isNaN(mnc) || isNaN(bytesUsed) || isNaN(cellId)) {
    return undefined;
  }

  return new CDRRecord(id, bytesUsed, mnc, dmcc, cellId, undefined);
}

function encode(record: CDRRecord): string | undefined {
  return `${record.id},${record.dmcc},${record.mnc},${record.bytesUsed},${record.cellId}`;
}

export { decode, encode };
export default { decode, encode };
