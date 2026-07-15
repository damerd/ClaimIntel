export class AppError extends Error {
  constructor(message, { code = "UNKNOWN_ERROR", userMessage = message, cause = null, details = {} } = {}) {
    super(message, { cause });
    this.name = "AppError";
    this.code = code;
    this.userMessage = userMessage;
    this.details = details;
  }
}

export function normalizeError(error, fallbackMessage = "An unexpected error occurred.") {
  if (error instanceof AppError) return error;
  return new AppError(error?.message || fallbackMessage, {
    code: "UNEXPECTED_ERROR",
    userMessage: fallbackMessage,
    cause: error,
  });
}
