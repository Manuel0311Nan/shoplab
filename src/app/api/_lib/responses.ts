import { NextResponse } from "next/server";
import type { ErrorResponse } from "@/contracts/error";
import type { AppError, ErrorType } from "@/shared/kernel/errors";
import type { Result } from "@/shared/kernel/result";

const statusByErrorType: Record<ErrorType, number> = {
  validation: 400,
  unauthorized: 401,
  forbidden: 403,
  not_found: 404,
  conflict: 409,
};

export function errorResponse(error: AppError): NextResponse<ErrorResponse> {
  return NextResponse.json(
    {
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
      },
    },
    { status: statusByErrorType[error.type] },
  );
}

export function resultResponse<T>(
  result: Result<T>,
  successStatus = 200,
): NextResponse<T | ErrorResponse> {
  if (!result.ok) {
    return errorResponse(result.error);
  }
  return NextResponse.json(result.value, { status: successStatus });
}
