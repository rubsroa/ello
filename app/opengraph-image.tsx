import { ImageResponse } from "next/og";

export const alt = "ell’o — Coiffure à Genève";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export default function OpenGraphImage() { return new ImageResponse(<div style={{ background: "#0E2536", color: "#FFFFFF", display: "flex", flexDirection: "column", height: "100%", justifyContent: "space-between", padding: "72px 84px", width: "100%" }}><div style={{ display: "flex", flexDirection: "column" }}><div style={{ fontSize: 100, fontWeight: 200, letterSpacing: "-8px" }}>ell’o</div><div style={{ color: "#B79457", fontSize: 18, letterSpacing: "8px", marginTop: 8, textTransform: "uppercase" }}>Coiffure · Genève</div></div><div style={{ fontSize: 22, fontWeight: 300, opacity: .72 }}>Femme · Homme · Ruelle du Midi 12</div></div>, size); }
