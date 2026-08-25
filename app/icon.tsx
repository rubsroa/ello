import { ImageResponse } from "next/og";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";
export default function Icon() { return new ImageResponse(<div style={{ alignItems: "center", background: "#0E2536", color: "#F4F1EA", display: "flex", fontSize: 40, fontWeight: 300, height: "100%", justifyContent: "center", letterSpacing: "-4px", width: "100%" }}>e’</div>, size); }
