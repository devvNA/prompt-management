import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#0a0a0f",
        borderRadius: "6px",
      }}
    >
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#6366f1"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 3L20 7.5V16.5L12 21L4 16.5V7.5L12 3Z" />
        <path d="M12 12L20 7.5" />
        <path d="M12 12V21" />
        <path d="M12 12L4 7.5" />
      </svg>
    </div>,
    { ...size },
  );
}
