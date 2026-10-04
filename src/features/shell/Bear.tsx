import { useId } from "react";
import { cn } from "@/lib/utils";

export type BearPose = "idle" | "wave" | "sleep";

/** Loaf the bear: a shaded SVG that reads as 3D. Shipped as a flat image in the pet window. */
export function Bear({ pose = "idle", className }: { pose?: BearPose; className?: string }) {
  const u = useId().replace(/:/g, "");
  const g = (name: string) => `${name}-${u}`;
  const url = (name: string) => `url(#${g(name)})`;
  return (
    <svg viewBox="0 0 200 200" role="img" aria-label="Loaf the bear" className={cn("overflow-visible", className)}>
      <defs>
        <radialGradient id={g("fur")} cx="35%" cy="25%" r="85%"><stop offset="0" stopColor="#F6D3A4" /><stop offset=".45" stopColor="#E0A163" /><stop offset="1" stopColor="#A9672F" /></radialGradient>
        <radialGradient id={g("dark")} cx="35%" cy="25%" r="90%"><stop offset="0" stopColor="#E7B27A" /><stop offset="1" stopColor="#93561F" /></radialGradient>
        <radialGradient id={g("belly")} cx="40%" cy="30%" r="80%"><stop offset="0" stopColor="#FFF1DA" /><stop offset="1" stopColor="#EBC391" /></radialGradient>
        <radialGradient id={g("ear")} cx="40%" cy="35%" r="80%"><stop offset="0" stopColor="#FFC2B8" /><stop offset="1" stopColor="#D98476" /></radialGradient>
        <radialGradient id={g("nose")} cx="35%" cy="30%" r="80%"><stop offset="0" stopColor="#6B4A3A" /><stop offset="1" stopColor="#241410" /></radialGradient>
        <radialGradient id={g("eye")} cx="35%" cy="30%" r="80%"><stop offset="0" stopColor="#5B4036" /><stop offset="1" stopColor="#17100D" /></radialGradient>
        <radialGradient id={g("gloss")} cx="30%" cy="20%" r="60%"><stop offset="0" stopColor="#fff" stopOpacity=".75" /><stop offset="1" stopColor="#fff" stopOpacity="0" /></radialGradient>
      </defs>
      <ellipse cx="100" cy="188" rx="62" ry="7" fill="#000" opacity=".25" />
      <ellipse cx="70" cy="178" rx="19" ry="12" fill={url("dark")} />
      <ellipse cx="130" cy="178" rx="19" ry="12" fill={url("dark")} />
      <ellipse cx="70" cy="180" rx="9" ry="6" fill={url("ear")} opacity=".8" />
      <ellipse cx="130" cy="180" rx="9" ry="6" fill={url("ear")} opacity=".8" />
      <ellipse cx="100" cy="140" rx="56" ry="46" fill={url("fur")} />
      <ellipse cx="100" cy="148" rx="33" ry="30" fill={url("belly")} />
      <ellipse cx="82" cy="118" rx="22" ry="12" fill={url("gloss")} opacity=".5" />
      <g><ellipse cx="50" cy="140" rx="14" ry="25" transform="rotate(14 50 140)" fill={url("dark")} /><ellipse cx="46" cy="130" rx="6" ry="10" fill={url("gloss")} opacity=".6" /></g>
      <g
        style={pose === "wave" ? { transformOrigin: "142px 122px", transform: "rotate(-130deg)" } : undefined}
        className={pose === "wave" ? "bear-wave" : undefined}
      >
        <ellipse cx="150" cy="140" rx="14" ry="25" transform="rotate(-14 150 140)" fill={url("dark")} /><ellipse cx="146" cy="130" rx="6" ry="10" fill={url("gloss")} opacity=".6" />
      </g>
      <circle cx="54" cy="36" r="20" fill={url("dark")} /><circle cx="54" cy="38" r="11" fill={url("ear")} />
      <circle cx="146" cy="36" r="20" fill={url("dark")} /><circle cx="146" cy="38" r="11" fill={url("ear")} />
      <ellipse cx="100" cy="80" rx="60" ry="52" fill={url("fur")} />
      <path d="M78 36 q6 -5 10 1 M95 31 q6 -5 10 0 M112 36 q6 -5 10 1" fill="none" stroke="#B97A3E" strokeWidth="3" strokeLinecap="round" opacity=".55" />
      <ellipse cx="78" cy="52" rx="30" ry="15" fill={url("gloss")} />
      <ellipse cx="64" cy="94" rx="10" ry="6.5" fill="#FF8F86" opacity=".45" /><ellipse cx="136" cy="94" rx="10" ry="6.5" fill="#FF8F86" opacity=".45" />
      <ellipse cx="100" cy="95" rx="26" ry="19" fill={url("belly")} />
      {pose === "sleep" ? (
        <g fill="none" stroke="#3A2620" strokeWidth="3.5" strokeLinecap="round"><path d="M68 74 q9 8 18 0" /><path d="M114 74 q9 8 18 0" /></g>
      ) : (
        <g>
          <ellipse cx="77" cy="72" rx="8" ry="9" fill={url("eye")} /><ellipse cx="123" cy="72" rx="8" ry="9" fill={url("eye")} />
          <circle cx="74.5" cy="68.5" r="3.2" fill="#fff" /><circle cx="120.5" cy="68.5" r="3.2" fill="#fff" />
          <circle cx="80" cy="76" r="1.6" fill="#fff" opacity=".8" /><circle cx="126" cy="76" r="1.6" fill="#fff" opacity=".8" />
        </g>
      )}
      <ellipse cx="100" cy="86" rx="9.5" ry="6.5" fill={url("nose")} /><ellipse cx="97" cy="84" rx="3.5" ry="1.8" fill="#fff" opacity=".6" />
      <path d="M100 92 v5 M100 97 q-7 7 -15 1 M100 97 q7 7 15 1" fill="none" stroke="#3A2620" strokeWidth="2.6" strokeLinecap="round" />
    </svg>
  );
}
