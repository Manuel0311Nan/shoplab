import Image, { type StaticImageData } from "next/image";
import { cn } from "@/shared/lib/utils";

/** Marco de móvil para enseñar pantallas de la app. El marco es oscuro también en tema claro. */
export function MarcoMovil({
  children,
  className,
}: Readonly<{ children: React.ReactNode; className?: string }>) {
  return (
    <div
      className={cn(
        "rounded-[2.4rem] bg-neutral-900 p-2 shadow-[0_24px_50px_rgb(35_26_10/0.18)]",
        className,
      )}
    >
      <div className="overflow-hidden rounded-[1.9rem]">{children}</div>
    </div>
  );
}

/** Captura real de la app (390×844 a 2x) dentro del marco. */
export function Captura({
  src,
  alt,
  className,
  prioridad = false,
}: Readonly<{ src: StaticImageData; alt: string; className?: string; prioridad?: boolean }>) {
  return (
    <MarcoMovil className={className}>
      <Image
        src={src}
        alt={alt}
        placeholder="blur"
        priority={prioridad}
        sizes="(min-width: 768px) 300px, 70vw"
        className="block h-auto w-full"
      />
    </MarcoMovil>
  );
}
