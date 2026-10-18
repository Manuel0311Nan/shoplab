/**
 * Marco de las pantallas de acceso (login, registro, bienvenida). Mobile first:
 * columna única de 360 px que se centra en pantallas grandes.
 * Las redirecciones según la sesión van en cada page.tsx, no aquí: un layout no
 * se vuelve a ejecutar al navegar entre páginas que lo comparten.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col items-center px-5 pt-10 pb-10 sm:justify-center sm:pt-0">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <p className="text-center font-heading text-3xl font-bold text-primary">Migas</p>
        <main className="rounded-xl bg-card p-6 shadow-card">{children}</main>
      </div>
    </div>
  );
}
