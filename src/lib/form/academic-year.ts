import { m } from '$lib/paraglide/messages';
import { Field } from './field.svelte';

export function nextFromStart(start: string): string {
  const year = yearFromString(start);
  return year ? `/ ${year + 1}` : '/ 0000';
}

export function yearFromString(input: string | null | undefined): number | undefined {
  const year = input ? Number.parseInt(input) : NaN;
  return Number.isFinite(year) ? year : undefined;
}
