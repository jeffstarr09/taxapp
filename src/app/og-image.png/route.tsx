import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET(request: Request) {
  const { origin } = new URL(request.url);
  const logoSrc = `${origin}/drop-logo.png`;

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
          background: "linear-gradient(145deg, #0a0a0a 0%, #1a1a1a 50%, #0a0a0a 100%)",
          fontFamily: "system-ui, sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Subtle radial glow behind logo */}
        <div
          style={{
            position: "absolute",
            width: 600,
            height: 600,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(232,69,10,0.15) 0%, transparent 70%)",
            top: -60,
            display: "flex",
          }}
        />

        {/* Logo */}
        <img
          src={logoSrc}
          width={240}
          height={240}
          style={{ marginBottom: 24 }}
        />

        {/* CTA tagline */}
        <div
          style={{
            color: "#ffffff",
            fontSize: 52,
            fontWeight: 700,
            textAlign: "center",
            letterSpacing: "-0.02em",
            marginBottom: 16,
          }}
        >
          Climb the Leaderboard
        </div>

        {/* Subtitle */}
        <div
          style={{
            color: "#a3a3a3",
            fontSize: 28,
            fontWeight: 500,
            textAlign: "center",
          }}
        >
          AI counts your reps. You bring the effort.
        </div>

        {/* Bottom bar */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 6,
            background: "linear-gradient(90deg, #e8450a, #dc2626)",
            display: "flex",
          }}
        />
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
