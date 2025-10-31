export class CDRRecord {
  constructor(
    public id: number,
    public bytes_used: number,
    public mnc?: number,
    public dmcc?: string,
    public cellid?: number,
    public ip?: string
  ) {}
}