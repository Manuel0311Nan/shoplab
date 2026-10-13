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

/**
 * 500 para errores no previstos (bugs, caída de la BD...). No expone el detalle:
 * eso va al log del servidor. Mantiene el contrato `ErrorResponse` para que la app
 * móvil siempre reciba JSON, nunca la página HTML de error de Next.
 */
export function internalErrorResponse(): NextResponse<ErrorResponse> {
  return NextResponse.json(
    { error: { code: "ERROR_INTERNO", message: "Ha ocurrido un error inesperado" } },
    { status: 500 },
  );
}

/** 204 sin cuerpo, para operaciones que no devuelven nada (p. ej. DELETE). */
export function noContentResponse(): Response {
  return new Response(null, { status: 204 });
}
