let counter = 0;

export function makeId(prefix: string): string {
  counter += 1;
  return `${prefix}_${Date.now().toString(36)}${counter.toString(36)}`;
}

export function nodeRefId(): string {
  counter += 1;
  return `n${counter.toString(36)}${Math.random().toString(36).slice(2, 5)}`;
}
