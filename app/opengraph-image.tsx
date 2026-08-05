import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const runtime = "nodejs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "OpusGen AI — Studio-quality product photography, powered by AI";

export default async function Image() {
  const logoData = await readFile(join(process.cwd(), "public/logo/2-removebg-preview.png"));
  const logoSrc = `data:image/png;base64,${logoData.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#0f0404",
          backgroundImage:
            "radial-gradient(ellipse 900px 600px at 75% 20%, rgba(210,22,22,0.35) 0%, rgba(180,10,10,0.08) 45%, transparent 70%)",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logoSrc} width={120} height={120} alt="" style={{ marginBottom: 28 }} />
        <div style={{ display: "flex", fontSize: 72, fontWeight: 900, letterSpacing: -2 }}>
          <span style={{ color: "rgba(255,255,255,0.96)" }}>OpusGen</span>
          <span style={{ color: "#f87171", marginLeft: 20 }}>Ai</span>
        </div>
        <div style={{ display: "flex", fontSize: 30, color: "rgba(255,255,255,0.6)", marginTop: 22 }}>
          Studio-quality product photography, powered by AI
        </div>
      </div>
    ),
    { ...size }
  );
}
