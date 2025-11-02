import { CDRRecord } from "../../../common/cdr";

function decode(text: string): CDRRecord | undefined {
  const parts = text.split(",");

  if (parts.length != 2) {
    return undefined;
  }

  const [idStr, hexData] = parts;
  const id = parseInt(idStr);

  if (isNaN(id)) {
    return undefined;
  }

  const buffer = Buffer.from(hexData, "hex");

  const mnc = buffer[0] << 8 | buffer[1];
  const bytesUsed = buffer[2] << 8 | buffer[3];
  const cellId = buffer[4] << 8 | buffer[5];
  const ip = `${buffer[6]}.${buffer[7]}.${buffer[8]}.${buffer[9]}`;

  return new CDRRecord(
    id,
    bytesUsed,
    mnc,
    undefined,
    cellId,
    ip,
  );
}

function encode(record: CDRRecord): string | undefined {
  const buffer = Buffer.alloc(12);

  if (
    record.id == null ||
    record.mnc == null ||
    record.bytesUsed == null ||
    record.cellId == null ||
    record.ip == null
  ) {
    return undefined;
  }

  buffer[0] = record.mnc >> 8 & 0xff;
  buffer[1] = record.mnc & 0xff;
  buffer[2] = record.bytesUsed >> 8 & 0xff;
  buffer[3] = record.bytesUsed & 0xff;
  buffer[4] = record.cellId >> 24 & 0xff;
  buffer[5] = record.cellId >> 16 & 0xff;
  buffer[6] = record.cellId >> 8 & 0xff;
  buffer[7] = record.cellId & 0xff;

  const octets = record.ip.split("\.")

  buffer[8] = parseInt(octets[0]) & 0xff
  buffer[9] = parseInt(octets[1]) & 0xff
  buffer[10] = parseInt(octets[2]) & 0xff
  buffer[11] = parseInt(octets[3]) & 0xff

  const hex = buffer.toString("hex");

  return `${record.id},${hex}`
}

export { decode, encode };
export default { decode, encode };
