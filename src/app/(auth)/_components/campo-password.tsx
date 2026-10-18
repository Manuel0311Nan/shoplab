"use client";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { Campo } from "./campo";

type Props = Omit<React.ComponentProps<typeof Campo>, "type" | "accesorio">;

/** Campo de contraseña con botón de 44 px para mostrarla u ocultarla. */
export function CampoPassword(props: Props) {
  const [visible, setVisible] = useState(false);
  return (
    <Campo
      {...props}
      type={visible ? "text" : "password"}
      accesorio={
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label="Mostrar contraseña"
          aria-pressed={visible}
          className="absolute top-0 right-0 flex size-11 items-center justify-center rounded-lg text-muted-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          {visible ? (
            <EyeOff className="size-5" aria-hidden="true" />
          ) : (
            <Eye className="size-5" aria-hidden="true" />
          )}
        </button>
      }
    />
  );
}
