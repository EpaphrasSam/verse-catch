export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public isOperational: boolean = true
  ) {
    super(message);
    this.name = "AppError";
    Object.setPrototypeOf(this, AppError.prototype);
  }

  toJSON() {
    return {
      error: {
        message: this.message,
        code: this.code,
        statusCode: this.statusCode,
      },
    };
  }
}

export class FileSizeError extends AppError {
  constructor(message: string) {
    super(message, "FILE_SIZE_ERROR", 413);
    this.name = "FileSizeError";
  }
}

export class TranscriptionError extends AppError {
  constructor(message: string) {
    super(message, "TRANSCRIPTION_ERROR", 500);
    this.name = "TranscriptionError";
  }
}

export class StorageError extends AppError {
  constructor(message: string) {
    super(message, "STORAGE_ERROR", 507);
    this.name = "StorageError";
  }
}

// Helper to format error for client
export const formatErrorForClient = (
  error: unknown
): { message: string; code: string } => {
  if (error instanceof AppError) {
    return {
      message: error.message,
      code: error.code,
    };
  }

  if (error instanceof Error) {
    return {
      message: error.message,
      code: "UNKNOWN_ERROR",
    };
  }

  return {
    message: "An unexpected error occurred",
    code: "UNKNOWN_ERROR",
  };
};
