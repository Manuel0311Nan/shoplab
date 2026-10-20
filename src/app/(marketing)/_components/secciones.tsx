import {
  CalendarDays,
  Check,
  ListChecks,
  ListPlus,
  Package,
  Plus,
  SlidersHorizontal,
  Users,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { LoginForm } from "@/app/(auth)/_components/login-form";
import despensa from "../_img/despensa.webp";
import lista from "../_img/lista.webp";
import misListas from "../_img/mis-listas.webp";
import { CarruselFuncionamiento } from "./carrusel-funcionamiento";
import { Captura } from "./marco-movil";

const CONTENEDOR = "mx-auto w-full max-w-6xl px-5 md:px-6";
const BOTON_PRIMARIO =
  "inline-flex min-h-12 items-center justify-center rounded-xl bg-primary px-6 font-semibold text-primary-foreground outline-none hover:bg-primary/90 focus-visible:ring-3 focus-visible:ring-ring/50";
const ANTETITULO = "text-sm font-semibold tracking-wide text-primary uppercase";
const TITULO_SECCION =
  "font-heading text-3xl leading-tight font-extrabold tracking-tight md:text-5xl";

export function Cabecera() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur">
      <nav
        aria-label="Principal"
        className={`${CONTENEDOR} flex h-16 items-center justify-between gap-4`}
      >
        <Link
          href="/"
          className="flex items-center gap-2.5 outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <Image
            src="/icon.svg"
            alt=""
            width={36}
            height={36}
            unoptimized
            className="rounded-[10px]"
          />
          <span className="font-heading text-2xl font-extrabold tracking-tight text-primary">
            Migas
          </span>
        </Link>
        <div className="flex items-center gap-2 md:gap-7">
          <a
            href="#como"
            className="hidden text-sm font-medium text-muted-foreground hover:text-foreground md:inline"
          >
            Cómo funciona
          </a>
          <a
            href="#hogar"
            className="hidden text-sm font-medium text-muted-foreground hover:text-foreground md:inline"
          >
            Hogar compartido
          </a>
          <a
            href="#precios"
            className="hidden text-sm font-medium text-muted-foreground hover:text-foreground md:inline"
          >
            Precios
          </a>
          <Link
            href="/login"
            className="inline-flex min-h-11 items-center rounded-xl border border-input px-4 text-sm font-semibold outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            Entrar
          </Link>
          <Link
            href="/registro"
            className={`${BOTON_PRIMARIO} hidden min-h-11 px-4 text-sm sm:inline-flex`}
          >
            Crear cuenta
          </Link>
        </div>
      </nav>
    </header>
  );
}

export function Hero() {
  return (
    <section className={`${CONTENEDOR} grid items-center gap-14 py-14 md:grid-cols-2 md:py-24`}>
      <div className="flex flex-col gap-6">
        <span className="self-start rounded-full bg-secondary px-3.5 py-1.5 text-sm font-semibold text-secondary-foreground">
          Lista de la compra, despensa y recetas del hogar
        </span>
        <h1 className="font-heading text-[2.6rem] leading-[1.04] font-extrabold tracking-tight md:text-7xl">
          Haz <span className="text-primary">buenas migas</span> con tu despensa
        </h1>
        <p className="max-w-lg text-lg text-muted-foreground md:text-xl">
          Apuntad la compra en una lista que compartís en casa. Lo que compráis entra en la despensa
          con un toque, y Migas os avisa antes de que algo caduque.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/registro"
            className={`${BOTON_PRIMARIO} min-h-13 px-7 text-lg shadow-[0_6px_18px_rgb(189_68_68/0.25)]`}
          >
            Crear cuenta gratis
          </Link>
          <Link
            href="/login"
            className="inline-flex min-h-13 items-center rounded-xl bg-accent px-6 text-lg font-semibold text-accent-foreground outline-none hover:bg-accent/80 focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            Ya tengo cuenta · Entrar
          </Link>
        </div>
        <ul className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
          {[
            "Gratis para todo el hogar",
            "Sin límite de miembros",
            "Desde el móvil, se instala como app",
          ].map((texto) => (
            <li key={texto} className="flex items-center gap-1.5">
              <Check className="size-4 text-[#4f7d47]" aria-hidden="true" />
              {texto}
            </li>
          ))}
        </ul>
      </div>

      <div className="relative flex justify-center pb-12">
        <div
          aria-hidden="true"
          className="absolute top-10 left-1/2 aspect-square w-[min(440px,90%)] -translate-x-1/2 rounded-full bg-accent"
        />
        <Captura
          src={lista}
          alt="Lista de la compra compartida, por categorías"
          className="relative mt-14 -mr-12 w-[min(240px,42vw)] -rotate-4"
        />
        <Captura
          src={despensa}
          alt="Despensa con aviso de productos que caducan esta semana"
          className="relative w-[min(265px,46vw)]"
          prioridad
        />
        <div className="absolute bottom-0 left-1/2 flex -translate-x-1/3 items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3 whitespace-nowrap shadow-[0_10px_30px_rgb(35_26_10/0.12)]">
          <span className="flex size-9 items-center justify-center rounded-xl bg-secondary">
            <Package className="size-5 text-secondary-foreground" aria-hidden="true" />
          </span>
          <span className="flex flex-col leading-tight">
            <strong className="text-sm">Compra hecha</strong>
            <span className="text-xs text-muted-foreground">Todo a la despensa</span>
          </span>
        </div>
      </div>
    </section>
  );
}

const PROBLEMAS = [
  {
    titulo: "Compramos lo mismo dos veces",
    texto: "Cada uno apunta en su nota y al final hay tres paquetes de arroz en el armario.",
  },
  {
    titulo: "La lista se pierde en WhatsApp",
    texto: "Entre fotos y audios, nadie sabe cuál es la última versión.",
  },
  {
    titulo: "Lo del fondo de la nevera caduca",
    texto: "Y nos damos cuenta cuando ya solo queda tirarlo.",
  },
];

export function Problemas() {
  return (
    <section className="border-y border-border bg-muted">
      <div className={`${CONTENEDOR} flex flex-col gap-9 py-16 md:py-20`}>
        <h2 className="text-center font-heading text-3xl font-extrabold tracking-tight md:text-4xl">
          «¿Quedaba leche?»
        </h2>
        <ul className="grid gap-5 md:grid-cols-3">
          {PROBLEMAS.map((p) => (
            <li key={p.titulo} className="flex flex-col gap-2 rounded-2xl bg-card p-7 shadow-card">
              <h3 className="font-heading text-xl font-bold">{p.titulo}</h3>
              <p className="text-muted-foreground">{p.texto}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function Funcionamiento() {
  return (
    <section id="como" className={`${CONTENEDOR} flex scroll-mt-20 flex-col gap-12 py-20 md:py-28`}>
      <div className="flex flex-col items-center gap-3 text-center">
        <span className={ANTETITULO}>Cómo funciona</span>
        <h2 className={`${TITULO_SECCION} max-w-3xl`}>
          De la lista a la despensa, y de la despensa a la mesa
        </h2>
      </div>
      <CarruselFuncionamiento />
    </section>
  );
}

const VENTAJAS = [
  {
    icono: Users,
    titulo: "Un hogar, todos dentro",
    texto: "Sin límite de miembros. Lo que uno apunta, lo ven los demás.",
  },
  {
    icono: ListChecks,
    titulo: "Una lista para cada ocasión",
    texto:
      "La de la semana, la barbacoa, el cumple. Las que archivas se borran solas a los 15 días.",
  },
  {
    icono: Package,
    titulo: "Tu despensa, a tu manera",
    texto: "Nevera, Congelador y Armario de serie. Añade las ubicaciones que tengas en casa.",
  },
  {
    icono: SlidersHorizontal,
    titulo: "Por ubicación o por categoría",
    texto: "Ordena la despensa como la miras: por dónde está o por lo que es.",
  },
  {
    icono: CalendarDays,
    titulo: "Caducidad, solo si importa",
    texto: "Pon fecha a la pechuga y olvídate del arroz. Nada de apuntarlas una a una.",
  },
  {
    icono: ListPlus,
    titulo: "Queda poco, a la lista",
    texto: "Cuando algo se acaba, Migas te ofrece añadirlo a la compra.",
  },
];

export function Hogar() {
  return (
    <section id="hogar" className="scroll-mt-16 border-y border-border bg-card">
      <div
        className={`${CONTENEDOR} grid items-center gap-14 py-20 md:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] md:py-28`}
      >
        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-3">
            <span className={ANTETITULO}>Hogar compartido</span>
            <h2 className={TITULO_SECCION}>En casa hacemos buenas migas</h2>
            <p className="max-w-xl text-lg text-muted-foreground">
              Invita a quien hace la compra contigo. Todos veis la misma lista y la misma despensa.
            </p>
          </div>
          <ul className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
            {VENTAJAS.map(({ icono: Icono, titulo, texto }) => (
              <li key={titulo} className="flex gap-3.5">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-muted">
                  <Icono className="size-5 text-primary" aria-hidden="true" />
                </span>
                <div>
                  <h3 className="font-semibold">{titulo}</h3>
                  <p className="text-[15px] text-muted-foreground">{texto}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <Captura
          src={misListas}
          alt="Mis listas: Compra de la semana, Cumple de Martina y Barbacoa del sábado"
          className="mx-auto w-[min(270px,72vw)] rotate-3"
        />
      </div>
    </section>
  );
}

export function Precios() {
  return (
    <section
      id="precios"
      className={`${CONTENEDOR} flex scroll-mt-20 flex-col gap-11 py-20 md:py-28`}
    >
      <div className="flex flex-col items-center gap-3 text-center">
        <span className={ANTETITULO}>Precios</span>
        <h2 className={TITULO_SECCION}>Gratis para empezar. Y para quedarse.</h2>
        <p className="text-lg text-muted-foreground">Se paga por hogar, no por persona.</p>
      </div>
      <div className="mx-auto grid w-full max-w-4xl gap-6 md:grid-cols-2">
        <div className="flex flex-col gap-5 rounded-3xl border-2 border-primary bg-card p-8">
          <div>
            <h3 className="font-heading text-2xl font-bold">Gratis</h3>
            <p className="text-muted-foreground">Todo lo que necesita un hogar</p>
          </div>
          <p className="font-heading text-5xl font-extrabold tracking-tight">0 €</p>
          <ul className="flex flex-col gap-2.5">
            {[
              "1 hogar con miembros ilimitados",
              "Listas compartidas",
              "Despensa con ubicaciones y caducidades",
            ].map((texto) => (
              <li key={texto} className="flex gap-2.5">
                <Check className="mt-0.5 size-5 shrink-0 text-[#4f7d47]" aria-hidden="true" />
                {texto}
              </li>
            ))}
          </ul>
          <Link href="/registro" className={`${BOTON_PRIMARIO} mt-auto`}>
            Crear cuenta gratis
          </Link>
        </div>
        <div className="flex flex-col gap-5 rounded-3xl border border-border bg-muted p-8">
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h3 className="font-heading text-2xl font-bold">Premium hogar</h3>
              <span className="rounded-full bg-accent px-2.5 py-0.5 text-xs font-semibold text-accent-foreground">
                Próximamente
              </span>
            </div>
            <p className="text-muted-foreground">Para ahorrar tiempo y no tirar comida</p>
          </div>
          <p className="font-heading text-5xl font-extrabold tracking-tight">
            2,99 €
            <span className="font-sans text-lg font-semibold tracking-normal text-muted-foreground">
              {" "}
              /mes
            </span>
          </p>
          <ul className="flex flex-col gap-2.5">
            {[
              "Recetas según tu despensa",
              "Avisos de caducidad en el móvil",
              "Importar tus recetas",
              "Historial de compras",
            ].map((texto) => (
              <li key={texto} className="flex gap-2.5">
                <Plus className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
                {texto}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

export function Acceso() {
  return (
    <section id="entrar" className="scroll-mt-16 bg-[#231a0a] text-[#fff8f3]">
      <div className={`${CONTENEDOR} grid items-center gap-12 py-20 md:grid-cols-2 md:py-24`}>
        <div className="flex flex-col gap-5">
          <h2 className="font-heading text-4xl leading-[1.05] font-extrabold tracking-tight md:text-6xl">
            Que no se tire ni una miga
          </h2>
          <p className="max-w-md text-lg text-[#ecd6c4]">
            Crea tu cuenta, ponle nombre a tu hogar y la primera lista ya está esperando. Luego
            invita al resto.
          </p>
          <Link href="/registro" className={`${BOTON_PRIMARIO} min-h-13 self-start px-7 text-lg`}>
            Crear cuenta gratis
          </Link>
        </div>
        <div className="mx-auto flex w-full max-w-sm flex-col gap-5 rounded-3xl bg-background p-7 text-foreground shadow-[0_24px_60px_rgb(0_0_0/0.3)]">
          <LoginForm destino="/listas" Titulo="h2" />
          <p className="text-center text-sm text-muted-foreground">
            ¿No tienes cuenta?{" "}
            <Link
              href="/registro"
              className="inline-flex min-h-11 items-center font-semibold text-primary underline-offset-4 hover:underline"
            >
              Regístrate
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}

export function Pie() {
  return (
    <footer className="border-t border-white/10 bg-[#231a0a] text-[#ecd6c4]">
      <div
        className={`${CONTENEDOR} flex flex-wrap items-center justify-between gap-4 py-7 text-sm`}
      >
        <p>
          <span className="font-heading text-lg font-extrabold text-[#fff8f3]">Migas</span> · Haz
          buenas migas con tu despensa
        </p>
        <nav aria-label="Cuenta" className="flex gap-6">
          <Link href="/login" className="inline-flex min-h-11 items-center hover:text-[#fff8f3]">
            Entrar
          </Link>
          <Link href="/registro" className="inline-flex min-h-11 items-center hover:text-[#fff8f3]">
            Crear cuenta
          </Link>
        </nav>
      </div>
    </footer>
  );
}
