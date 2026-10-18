import { getSessionCookie } from "better-auth/cookies";
import { type NextRequest, NextResponse } from "next/server";

/** Pantallas para quien NO ha entrado: con sesión no tiene sentido verlas. */
const SOLO_SIN_SESION = ["/login", "/registro"];

/**
 * Capa 1 de la protección de rutas: una redirección rápida mirando SOLO si existe la
 * cookie de sesión, sin tocar la base de datos (corre en Edge).
 *
 * NO es seguridad: la cookie se puede inventar. La comprobación real es la capa 2:
 * `getAuthContext()` / `getIdentity()` en cada página, Server Action y endpoint.
 * Aquí solo se evita el parpadeo de una página protegida antes de redirigir.
 */
export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const hayCookie = getSessionCookie(request) !== null;
  const esSoloSinSesion = SOLO_SIN_SESION.includes(pathname);

  if (esSoloSinSesion && hayCookie) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (!esSoloSinSesion && !hayCookie) {
    const login = new URL("/login", request.url);
    if (pathname !== "/") login.searchParams.set("next", `${pathname}${search}`);
    return NextResponse.redirect(login);
  }

  return NextResponse.next();
}

export const config = {
  // Node y no Edge: el paquete de cookies de Better Auth arrastra código que Edge no admite.
  // (Estable desde Next 15.5.)
  runtime: "nodejs",
  // Todo menos la API (responde 401 en JSON), los internos de Next y los estáticos.
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.[a-zA-Z0-9]+$).*)"],
};
