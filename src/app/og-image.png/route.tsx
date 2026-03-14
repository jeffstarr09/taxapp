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
          background: "linear-gradient(135deg, #0a0a0a 0%, #1a0a0a 50%, #0a0a0a 100%)",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 140,
            fontWeight: 900,
            letterSpacing: "-0.05em",
            marginBottom: 20,
          }}
        >
          <span style={{ color: "#ffffff" }}>DR</span>
          <span style={{ color: "#dc2626" }}>O</span>
          <span style={{ color: "#ffffff" }}>P</span>
        </div>
        <div
          style={{
            width: 120,
            height: 3,
            background: "linear-gradient(90deg, transparent, #dc2626, transparent)",
            marginBottom: 30,
          }}
        />
        <div
          style={{
            color: "#a3a3a3",
            fontSize: 32,
            fontWeight: 500,
            textAlign: "center",
            maxWidth: 700,
          }}
        >
          AI-Powered Push-up Counter
        </div>
        <div
          style={{
            display: "flex",
            gap: 40,
            marginTop: 50,
            color: "#737373",
            fontSize: 22,
          }}
        >
          <span>Real-time Form Tracking</span>
          <span style={{ color: "#dc2626" }}>•</span>
          <span>Leaderboards</span>
          <span style={{ color: "#dc2626" }}>•</span>
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
