export type ErrorType =
  | "validation"
  | "not_found"
  | "conflict"
  | "forbidden"
  | "unauthorized";

export interface AppError{
    readonly type: ErrorType;
    readonly code: string;
    readonly message: string;
    readonly details?: Readonly<Record<string, unknown>>
}

export const notFoundError = (code: string, message: string): AppError => ({
    type: "not_found",
    code,
    message
});

export const conflictError = (code: string, message: string): AppError => ({
  type: "conflict",
  code,
  message,
});

export const forbiddenError = (code: string, message: string): AppError => ({
  type: "forbidden",
  code,
  message,
});