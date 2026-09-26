import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#111210",
          borderRadius: 6,
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M6 7h5a4 4 0 0 1 0 8h-1m8 2h-5a4 4 0 0 1 0-8h1" stroke="#f3f2ee" strokeWidth="1.8" strokeLinecap="round" />
          <circle cx="5.5" cy="7" r="1.5" fill="#5b7cff" />
          <circle cx="18.5" cy="17" r="1.5" fill="#5b7cff" />
        </svg>
      </div>
    ),
    size,
  );
}
