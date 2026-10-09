export class Memory {
  private readonly shortTerm: string[] = [];
  remember(value: string): void { this.shortTerm.push(value); }
  recent(): string[] { return this.shortTerm.slice(-20); }
}
