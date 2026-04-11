import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET() {
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
          background: "#ffffff",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 180,
            fontWeight: 900,
            letterSpacing: "-0.05em",
            marginBottom: 20,
          }}
        >
          <span style={{ color: "#111111" }}>DR</span>
          <span style={{ color: "#e8450a" }}>O</span>
          <span style={{ color: "#111111" }}>P</span>
        </div>
        <div
          style={{
            width: 140,
            height: 4,
            background: "#e8450a",
            borderRadius: 4,
            marginBottom: 40,
          }}
        />
        <div
          style={{
            color: "#111111",
            fontSize: 44,
            fontWeight: 700,
            textAlign: "center",
            maxWidth: 900,
            marginBottom: 20,
          }}
        >
          AI-Powered Pushup Counter
        </div>
        <div
          style={{
            display: "flex",
            gap: 40,
            marginTop: 30,
            color: "#6b7280",
            fontSize: 26,
            fontWeight: 500,
          }}
        >
          <span>Real-time Form Tracking</span>
          <span style={{ color: "#e8450a" }}>•</span>
          <span>Leaderboards</span>
          <span style={{ color: "#e8450a" }}>•</span>
          <span>Daily Challenges</span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
