import { BookOpen, Clock, ListChecks, Package, Plus } from "lucide-react";
import { cn } from "@/shared/lib/utils";

const RECETAS = [
  {
    nombre: "Arroz con pollo y espinacas",
    minutos: 35,
    usa: 3,
    nota: { texto: "La pechuga caduca en 2 días", tono: "pronto" },
  },
  {
    nombre: "Tortilla de espinacas y queso fresco",
    minutos: 20,
    usa: 3,
    nota: { texto: "Tienes todo", tono: "ok" },
  },
  {
    nombre: "Ensalada de garbanzos y atún",
    minutos: 10,
    usa: 3,
    nota: { texto: "Te falta: cebolla", tono: "falta" },
  },
  {
    nombre: "Macarrones con tomate y atún",
    minutos: 25,
    usa: 3,
    nota: { texto: "Tienes todo", tono: "ok" },
  },
] as const;

const FILTROS = ["Caduca pronto", "Rápidas", "Sin ir a comprar"] as const;

const TONOS = {
  pronto: "bg-amber-100 text-amber-900",
  ok: "bg-[#c3eab7] text-[#2e4e28]",
  falta: "bg-[#fff2e2] text-[#574140]",
} as const;

/**
 * Maqueta de la futura pantalla de Recetas (vista 4, aún sin construir) para la home.
 * Se dibuja con la misma paleta que la app y escala con su contenedor (unidades cqw),
 * para que encaje en el marco de móvil igual que las capturas reales.
 */
export function RecetasMock() {
  return (
    <div className="@container aspect-[390/844] w-full overflow-hidden bg-[#fff8f3] text-[#231a0a]">
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between px-[5cqw] pt-[4cqw]">
          <span className="font-heading text-[6.5cqw] font-bold text-[#bd4444]">Migas</span>
          <span className="flex size-[10cqw] items-center justify-center rounded-full bg-[#c3eab7] text-[4.5cqw] font-semibold text-[#2e4e28]">
            L
          </span>
        </div>

        <div className="flex flex-1 flex-col gap-[3.5cqw] px-[5cqw] pt-[5cqw]">
          <div className="flex flex-col gap-[1cqw]">
            <span className="font-heading text-[8.5cqw] leading-tight font-bold">Recetas</span>
            <span className="text-[3.8cqw] text-[#574140]">Con lo que hay en tu despensa</span>
          </div>

          <div className="flex gap-[2cqw]">
            {FILTROS.map((filtro, i) => (
              <span
                key={filtro}
                className={cn(
                  "rounded-full px-[3cqw] py-[1.4cqw] text-[3.2cqw] font-semibold whitespace-nowrap",
                  i === 0 ? "bg-[#bd4444] text-white" : "bg-[#fff2e2] text-[#231a0a]",
                )}
              >
                {filtro}
              </span>
            ))}
          </div>

          {RECETAS.map((receta) => (
            <div
              key={receta.nombre}
              className="flex flex-col gap-[2cqw] rounded-[4cqw] bg-white p-[4cqw] shadow-[0_2px_8px_rgb(45_41_38/0.06)]"
            >
              <span className="font-heading text-[4.6cqw] leading-tight font-semibold">
                {receta.nombre}
              </span>
              <span className="flex items-center gap-[1.5cqw] text-[3.3cqw] text-[#574140]">
                <Clock className="size-[3.6cqw]" aria-hidden="true" />
                {receta.minutos} min · usa {receta.usa} de tu despensa
              </span>
              <div className="flex items-center justify-between gap-[2cqw]">
                <span
                  className={cn(
                    "rounded-full px-[2.6cqw] py-[0.8cqw] text-[3.1cqw] font-medium",
                    TONOS[receta.nota.tono],
                  )}
                >
                  {receta.nota.texto}
                </span>
                {receta.nota.tono === "falta" && (
                  <span className="flex items-center gap-[1cqw] text-[3.1cqw] font-semibold text-[#bd4444]">
                    <Plus className="size-[3.4cqw]" aria-hidden="true" />A la lista
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-3 border-t border-[#ecd6c4] py-[3cqw] text-[3.1cqw] font-semibold">
          <span className="flex flex-col items-center gap-[0.6cqw] text-[#574140]">
            <ListChecks className="size-[5.5cqw]" aria-hidden="true" />
            Listas
          </span>
          <span className="flex flex-col items-center gap-[0.6cqw] text-[#574140]">
            <Package className="size-[5.5cqw]" aria-hidden="true" />
            Despensa
          </span>
          <span className="flex flex-col items-center gap-[0.6cqw] text-[#bd4444]">
            <BookOpen className="size-[5.5cqw]" aria-hidden="true" />
            Recetas
          </span>
        </div>
      </div>
    </div>
  );
}
