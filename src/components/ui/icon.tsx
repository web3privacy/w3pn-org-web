import * as React from "react";
import { cn } from "@/lib/utils";

// Material Symbols Rounded (loaded in apps/explorer/src/app/layout.tsx).
// This keeps Explorer icons visually aligned with Stacks and enables "filled" variants via FILL=1.
export type IconName =
  | "menu"
  | "close"
  | "search"
  | "arrow_back"
  | "arrow_right_alt"
  | "expand_more"
  | "expand_less"
  | "chevron_right"
  | "check"
  | "tune"
  | "grid_view"
  | "view_agenda"
  | "public"
  | "radio_button_checked"
  | "open_in_new";

export function Icon({
  name,
  size = 20,
  filled = false,
  className,
  title,
}: {
  name: IconName;
  size?: number;
  filled?: boolean;
  className?: string;
  title?: string;
}) {
  return (
    <span
      className={cn("material-symbols-rounded shrink-0 select-none", className)}
      style={{
        fontSize: size,
        fontVariationSettings: `"FILL" ${filled ? 1 : 0}, "wght" 400, "GRAD" 0, "opsz" 24`,
      }}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      {name}
    </span>
  );
}

