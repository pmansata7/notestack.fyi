/** Turn Tauri invoke failures into user-visible text. */
export function formatInvokeError(error: unknown): string {
  if (typeof error === "string") {
    return error;
  }
  if (error instanceof Error) {
    return error.message;
  }
  if (error && typeof error === "object") {
    const record = error as Record<string, unknown>;
    if (typeof record.message === "string" && record.message.length > 0) {
      return record.message;
    }
    try {
      return JSON.stringify(error);
    } catch {
      /* fall through */
    }
  }
  return String(error);
}
