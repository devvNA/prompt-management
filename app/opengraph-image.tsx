import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Prompt Studio — AI Prompt Management";
export const contentType = "image/png";
export const size = { width: 1200, height: 630 };

export default function OGImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background:
          "linear-gradient(135deg, #0a0a0f 0%, #111127 40%, #0a0a0f 100%)",
        fontFamily: "system-ui, sans-serif",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Background grid pattern */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
          display: "flex",
        }}
      />

      {/* Glow orb top-left */}
      <div
        style={{
          position: "absolute",
          top: "-100px",
          left: "-50px",
          width: "500px",
          height: "500px",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(99,102,241,0.25) 0%, transparent 70%)",
          display: "flex",
        }}
      />

      {/* Glow orb bottom-right */}
      <div
        style={{
          position: "absolute",
          bottom: "-150px",
          right: "-100px",
          width: "600px",
          height: "600px",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(129,140,248,0.15) 0%, transparent 70%)",
          display: "flex",
        }}
      />

      {/* Content */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 10,
          padding: "60px",
        }}
      >
        {/* Icon */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "80px",
            height: "80px",
            borderRadius: "20px",
            background: "linear-gradient(135deg, #6366f1 0%, #818cf8 100%)",
            marginBottom: "32px",
            boxShadow: "0 0 60px rgba(99,102,241,0.4)",
          }}
        >
          <svg
            width="44"
            height="44"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 3L20 7.5V16.5L12 21L4 16.5V7.5L12 3Z" />
            <path d="M12 12L20 7.5" />
            <path d="M12 12V21" />
            <path d="M12 12L4 7.5" />
          </svg>
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: "64px",
            fontWeight: 700,
            color: "#fafafa",
            letterSpacing: "-2px",
            textAlign: "center",
            lineHeight: 1.1,
            display: "flex",
          }}
        >
          Prompt Studio
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: "24px",
            color: "#a1a1aa",
            marginTop: "16px",
            textAlign: "center",
            maxWidth: "700px",
            lineHeight: 1.5,
            display: "flex",
          }}
        >
          Organize, customize &amp; execute reusable AI prompt templates
        </div>

        {/* Tags row */}
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            gap: "12px",
            marginTop: "36px",
          }}
        >
          {["ChatGPT", "Claude", "Midjourney", "Variables", "Templates"].map(
            (tag) => (
              <div
                key={tag}
                style={{
                  display: "flex",
                  padding: "8px 20px",
                  borderRadius: "999px",
                  background: "rgba(99,102,241,0.15)",
                  border: "1px solid rgba(99,102,241,0.3)",
                  color: "#a5b4fc",
                  fontSize: "16px",
                  fontWeight: 500,
                }}
              >
                {tag}
              </div>
            ),
          )}
        </div>
      </div>
    </div>,
    { ...size },
  );
}
