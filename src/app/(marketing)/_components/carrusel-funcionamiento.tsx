"use client";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/shared/lib/utils";
import gastar from "../_img/gastar.webp";
import guardar from "../_img/guardar.webp";
import lista from "../_img/lista.webp";
import rapida from "../_img/rapida.webp";
import recetas from "../_img/recetas.webp";
import { pasoVecino, pasoVisible } from "./carrusel";
import { Captura } from "./marco-movil";

const PASOS = [
  {
    titulo: "Apuntad entre todos",
    texto:
      "Escribe «pech» y Migas te sugiere Pechuga de pollo, con su emoji y su categoría, en el orden en que recorres el súper. Una lista por tienda y una general que las reúne todas; los yogures, por packs.",
    pantalla: <Captura src={lista} alt="Lista de la compra por categorías, con emojis" />,
  },
  {
    titulo: "En el súper, un toque",
    texto:
      "Cambia a la vista rápida: cada producto es una casilla y un toque lo pasa al carro. La cantidad va en la esquina y, si mantienes pulsado, la cambias.",
    pantalla: (
      <Captura
        src={rapida}
        alt="Vista rápida: cuadrícula de productos con su emoji y su cantidad"
      />
    ),
  },
  {
    titulo: "Guardad sin teclear",
    texto:
      "Al terminar la compra, todo pasa a la despensa con un toque, y cada producto va donde lo guardasteis la última vez: nevera, congelador o armario. La caducidad, solo si quieres.",
    pantalla: (
      <Captura
        src={guardar}
        alt="Al terminar la compra: ¿lo guardas en la despensa?, con la ubicación propuesta"
      />
    ),
  },
  {
    titulo: "Gastad antes de que caduque",
    texto:
      "«−1» y listo, con «Deshacer» por si acaso. La despensa avisa de lo que caduca esta semana y de lo abierto que conviene revisar; si algo se acaba, a la lista con un toque.",
    pantalla: <Captura src={gastar} alt="Despensa: gastado 1 yogur, con Deshacer y A la lista" />,
  },
  {
    titulo: "Cocinad con lo que hay",
    texto:
      "Migas mira tu despensa y te propone recetas con lo que tienes, empezando por lo que caduca antes y ajustando las raciones. Si quieres hacer más, lo que falta va a la lista con un toque.",
    pantalla: (
      <Captura src={recetas} alt="Recetas que se pueden hacer con lo que hay en la despensa" />
    ),
  },
];

/**
 * «Cómo funciona» como carrusel horizontal, en móvil y en ordenador: deslizar o
 * arrastrar (scroll-snap), flechas, puntos y teclado (← →). El paso activo sale
 * del scroll, así el gesto y los botones nunca se desincronizan.
 */
export function CarruselFuncionamiento() {
  const pista = useRef<HTMLUListElement>(null);
  const [activo, setActivo] = useState(0);
  const total = PASOS.length;

  const irA = useCallback((paso: number) => {
    const el = pista.current;
    if (!el) return;
    const suave = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollTo({ left: paso * el.clientWidth, behavior: suave ? "smooth" : "auto" });
  }, []);

  useEffect(() => {
    const el = pista.current;
    if (!el) return;
    const alMoverse = () => setActivo(pasoVisible(el.scrollLeft, el.clientWidth, total));
    el.addEventListener("scroll", alMoverse, { passive: true });
    return () => el.removeEventListener("scroll", alMoverse);
  }, [total]);

  const alPulsarTecla = (e: React.KeyboardEvent) => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    e.preventDefault();
    irA(pasoVecino(activo, e.key === "ArrowLeft" ? -1 : 1, total));
  };

  return (
    <div
      role="region"
      aria-roledescription="carrusel"
      aria-label="Cómo funciona Migas"
      onKeyDown={alPulsarTecla}
      className="flex flex-col gap-8"
    >
      <ul
        ref={pista}
        // Enfocable para moverse con el teclado; el anillo marca dónde está el foco.
        tabIndex={0}
        className="flex snap-x snap-mandatory [scrollbar-width:none] overflow-x-auto overscroll-x-contain rounded-3xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50 [&::-webkit-scrollbar]:hidden"
      >
        {PASOS.map((paso, i) => (
          <li
            key={paso.titulo}
            role="group"
            aria-roledescription="paso"
            aria-label={`${i + 1} de ${total}`}
            aria-hidden={i !== activo}
            inert={i !== activo}
            // Holgura para que la sombra del móvil no se corte con el overflow del carrusel.
            className="w-full shrink-0 snap-center snap-always px-1 pt-4 pb-14"
          >
            <div className="grid items-center gap-8 md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] md:gap-16">
              <div className="mx-auto w-[min(270px,72vw)] md:mr-0 md:w-[300px]">
                {paso.pantalla}
              </div>
              <div className="flex flex-col gap-4 text-center md:text-left">
                <span className="text-sm font-semibold tracking-wide text-primary uppercase">
                  Paso {i + 1} de {total}
                </span>
                <h3 className="font-heading text-3xl font-bold tracking-tight md:text-4xl">
                  {paso.titulo}
                </h3>
                <p className="mx-auto max-w-md text-lg text-muted-foreground md:mx-0">
                  {paso.texto}
                </p>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <div className="flex items-center justify-center gap-4">
        <BotonFlecha
          etiqueta="Paso anterior"
          desactivado={activo === 0}
          onClick={() => irA(pasoVecino(activo, -1, total))}
        >
          <ChevronLeft className="size-5" aria-hidden="true" />
        </BotonFlecha>
        <div className="flex items-center">
          {PASOS.map((paso, i) => (
            <button
              key={paso.titulo}
              type="button"
              aria-label={`Ir al paso ${i + 1}: ${paso.titulo}`}
              aria-current={i === activo ? "step" : undefined}
              onClick={() => irA(i)}
              className="group flex size-11 items-center justify-center rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <span
                className={cn(
                  "h-2.5 rounded-full transition-all motion-reduce:transition-none",
                  i === activo ? "w-7 bg-primary" : "w-2.5 bg-border group-hover:bg-input",
                )}
              />
            </button>
          ))}
        </div>
        <BotonFlecha
          etiqueta="Paso siguiente"
          desactivado={activo === total - 1}
          onClick={() => irA(pasoVecino(activo, 1, total))}
        >
          <ChevronRight className="size-5" aria-hidden="true" />
        </BotonFlecha>
      </div>
      <p aria-live="polite" className="sr-only">
        Paso {activo + 1} de {total}: {PASOS[activo]?.titulo}
      </p>
    </div>
  );
}

function BotonFlecha({
  etiqueta,
  desactivado,
  onClick,
  children,
}: Readonly<{
  etiqueta: string;
  desactivado: boolean;
  onClick: () => void;
  children: React.ReactNode;
}>) {
  return (
    <button
      type="button"
      aria-label={etiqueta}
      disabled={desactivado}
      onClick={onClick}
      className="flex size-12 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-card transition-opacity outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-40"
    >
      {children}
    </button>
  );
}
