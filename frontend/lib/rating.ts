function toCandidateNumber(value: unknown): number {
  if (typeof value === 'number') {
    return value;
  }
  if (typeof value === 'string') {
    return Number(value);
  }
  return Number.NaN;
}

export function toNumericRating(value: unknown): number | null {
  const candidate = toCandidateNumber(value);
  return Number.isFinite(candidate) ? candidate : null;
}

export function formatRating(value: unknown, fractionDigits = 1): string {
  const rating = toNumericRating(value);
  if (rating === null) {
    return 'n/a';
  }
  return rating.toFixed(fractionDigits);
}

