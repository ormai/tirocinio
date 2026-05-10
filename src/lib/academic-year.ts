export function nextFromStart(start: string): string {
  const year = parseNumberFromForm(start);
  return year ? `/ ${year + 1}` : '/ 0000';
}

export function parseNumberFromForm(input: string | null | undefined): number | undefined {
  const year = input ? Number.parseInt(input) : NaN;
  return Number.isFinite(year) ? year : undefined;
}
