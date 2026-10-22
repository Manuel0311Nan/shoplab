import {
  Apple,
  Bath,
  Beef,
  Carrot,
  Croissant,
  CupSoda,
  Drumstick,
  Fish,
  Ham,
  Leaf,
  type LucideIcon,
  Milk,
  ShoppingBasket,
  Snowflake,
  SprayCan,
  Wheat,
} from "lucide-react";
import type { CategoriaDto } from "@/contracts/categoria";

/** Un dibujo por categoría (los productos no tienen ilustración propia). */
const ICONO: Readonly<Record<CategoriaDto, LucideIcon>> = {
  frutas: Apple,
  verduras: Carrot,
  vacuno: Beef,
  pollo_pavo: Drumstick,
  cerdo_cordero: Ham,
  charcuteria: Ham,
  pescado: Fish,
  lacteos_huevos: Milk,
  panaderia: Croissant,
  despensa: Wheat,
  especias: Leaf,
  bebidas: CupSoda,
  congelados: Snowflake,
  limpieza: SprayCan,
  higiene: Bath,
  otros: ShoppingBasket,
};

export function IconoCategoria({
  categoria,
  className,
}: {
  categoria: CategoriaDto;
  className?: string;
}) {
  const Icono = ICONO[categoria];
  return <Icono className={className} strokeWidth={1.5} aria-hidden="true" />;
}
