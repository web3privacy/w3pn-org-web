import { orgAsset } from "@/lib/org/asset-url";

const ACCENT = "#70ff88";
export const ORG_BASE = "/org";

export function ProjectDetailLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#000",
        color: "#fff",
        colorScheme: "dark",
      }}
    >
      {children}
    </div>
  );
}

export { ACCENT };
export { orgAsset };
