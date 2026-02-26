type PostgrestLikeError = {
  message?: string;
  details?: string;
  hint?: string;
  code?: string;
};

export function buildApiErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error) {
    return error.message || fallback;
  }

  if (error && typeof error === "object") {
    const candidate = error as PostgrestLikeError;
    const parts = [candidate.message, candidate.details, candidate.hint, candidate.code]
      .filter((value): value is string => Boolean(value && value.trim()))
      .map((value) => value.trim());
    if (parts.length > 0) {
      return parts.join(" | ");
    }
  }

  return fallback;
}

