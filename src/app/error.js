"use client";

import { useEffect } from "react";

/**
 * Root error boundary — catches all unhandled errors including chunk load failures.
 * When a ChunkLoadError occurs (common after redeployment on Hostinger),
 * automatically reloads the page to fetch fresh chunks.
 */
export default function GlobalError({ error, reset }) {
  useEffect(() => {
    console.error("[GlobalError]", error);

    // Auto-reload on chunk load failures (happens after redeployment)
    const msg = (error?.message || "").toLowerCase();
    if (
      msg.includes("chunk") ||
      msg.includes("loading chunk") ||
      msg.includes("failed to load") ||
      msg.includes("loading css chunk") ||
      error?.name === "ChunkLoadError"
    ) {
      // Only auto-reload once to prevent infinite loops
      const key = "chunk_reload_" + window.location.pathname;
      if (!sessionStorage.getItem(key)) {
        sessionStorage.setItem(key, "1");
        window.location.reload();
      }
    }
  }, [error]);

  const isChunkError =
    (error?.message || "").toLowerCase().includes("chunk") ||
    (error?.message || "").toLowerCase().includes("failed to load");

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "24px",
        padding: "24px",
        textAlign: "center",
        fontFamily:
          'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        backgroundColor: "#f8fafc",
        color: "#0f172a",
      }}
    >
      <span style={{ fontSize: "56px" }}>⚠️</span>
      <h1
        style={{
          fontSize: "24px",
          fontWeight: 800,
          margin: 0,
          letterSpacing: "-0.02em",
        }}
      >
        Something went wrong
      </h1>
      <p
        style={{
          fontSize: "14px",
          color: "#64748b",
          maxWidth: "400px",
          margin: 0,
          lineHeight: 1.6,
        }}
      >
        {isChunkError
          ? "The app was recently updated. Please reload the page to get the latest version."
          : error?.message ||
            "An unexpected error occurred. Please try again."}
      </p>
      <button
        onClick={() => {
          if (isChunkError) {
            window.location.reload();
          } else {
            reset();
          }
        }}
        style={{
          padding: "12px 32px",
          fontSize: "14px",
          fontWeight: 700,
          color: "#ffffff",
          backgroundColor: "#4f46e5",
          border: "none",
          borderRadius: "12px",
          cursor: "pointer",
          transition: "background-color 0.2s",
        }}
        onMouseOver={(e) => (e.target.style.backgroundColor = "#4338ca")}
        onMouseOut={(e) => (e.target.style.backgroundColor = "#4f46e5")}
      >
        {isChunkError ? "Reload Page" : "Try Again"}
      </button>
    </div>
  );
}
