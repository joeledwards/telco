export class CDRRecord {
  constructor(
    public id: number,
    public bytesUsed: number,
    public mnc?: number,
    public dmcc?: string,
    public cellId?: number,
    public ip?: string
  ) {}
}