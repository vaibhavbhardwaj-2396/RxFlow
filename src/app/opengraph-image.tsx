import { ImageResponse } from "next/og";

export const alt =
  "RxFlow — your prescription, turned into a living treatment plan";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "88px",
        background: "#f5f7f4",
        color: "#1b241f",
        fontFamily: "Georgia, 'Times New Roman', serif",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: "#2f7d5f",
          }}
        />
        <div style={{ fontSize: 40, fontWeight: 600, display: "flex" }}>
          RxFlow
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            fontSize: 68,
            fontWeight: 600,
            lineHeight: 1.1,
          }}
        >
          <div style={{ display: "flex" }}>Your treatment plan,</div>
          <div style={{ display: "flex" }}>finally organized.</div>
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 30,
            color: "#55625b",
            fontFamily: "system-ui, sans-serif",
          }}
        >
          The right treatments, on the right days, through every phase and
          break.
        </div>
      </div>

      <div
        style={{
          display: "flex",
          fontSize: 24,
          color: "#8b948c",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        A scheduling and adherence tool — not a medical adviser.
      </div>
    </div>,
    size,
  );
}
