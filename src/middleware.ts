import { getSessionCookie } from "better-auth/cookies";
import { type NextRequest, NextResponse } from "next/server";

/** Pantallas que se ven sin sesión (la home pública y el acceso). El resto exige al menos la cookie. */
const PUBLICAS = ["/", "/login", "/registro"];

/**
 * Capa 1 de la protección de rutas: sin cookie de sesión, directo a /login,
 * sin tocar la base de datos.
 *
 * NO es seguridad: la cookie se puede inventar o estar caducada. La comprobación
 * real es la capa 2: `getAuthContext()` / `getIdentity()` en cada página, Server
 * Action y endpoint.
 *
 * Por eso aquí NO se saca a nadie de /login por tener cookie: con una cookie
 * caducada, /login mandaría a / y / (que sí valida) de vuelta a /login, en bucle.
 * Esa redirección la hace /login con la sesión ya validada.
 */
export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  if (PUBLICAS.includes(pathname) || getSessionCookie(request) !== null) {
    return NextResponse.next();
  }

  const login = new URL("/login", request.url);
  login.searchParams.set("next", `${pathname}${search}`);
  return NextResponse.redirect(login);
}

export const config = {
  // Node y no Edge: el paquete de cookies de Better Auth arrastra código que Edge no admite.
  // (Estable desde Next 15.5.)
  runtime: "nodejs",
  // Todo menos la API (responde 401 en JSON), los internos de Next y los estáticos.
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.[a-zA-Z0-9]+$).*)"],
};
