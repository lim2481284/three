import { ImageResponse } from "next/og";
import { THREE_CELLS } from "@/lib/voxel3";
import { seo } from "@/data/content";

export const alt = seo.ogAlt;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const dynamic = "force-static";

export default function Image() {
  const u = 30;
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "linear-gradient(180deg, #030609 0%, #07170f 70%, #030609 100%)",
          position: "relative",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 170, display: "flex", background: "linear-gradient(180deg, transparent, rgba(0,112,74,0.25))" }} />
        <div style={{ position: "absolute", right: 120, top: 90, width: 12 * u, height: 15 * u, display: "flex" }}>
          {THREE_CELLS.map((c, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                left: c.col * u,
                top: c.row * u,
                width: u - 2,
                height: u - 2,
                background: "#00EC97",
                boxShadow: "0 0 24px rgba(0,236,151,0.6)",
              }}
            />
          ))}
        </div>
        <div style={{ position: "absolute", left: 80, top: 210, display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: 150, fontWeight: 900, color: "#F5F7F8", letterSpacing: -4, lineHeight: 1 }}>
            <span style={{ color: "#00EC97" }}>$</span>THREE
          </div>
          <div style={{ display: "flex", marginTop: 28, fontSize: 34, letterSpacing: 10, color: "#F5F7F8" }}>
            THREE DIGITS&nbsp;<span style={{ color: "#00EC97" }}>MINIMUM</span>
          </div>
          <div style={{ display: "flex", marginTop: 26, fontSize: 20, letterSpacing: 6, color: "#71898D" }}>IT WAS ALWAYS THREE.</div>
        </div>
      </div>
    ),
    size,
  );
}
