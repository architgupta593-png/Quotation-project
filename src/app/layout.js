import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

/**
 * Root metadata — inherited by every page unless overridden.
 */
export const metadata = {
  title: {
    default: "mandeholidays",
    template: "%s | mandeholidays",
  },
  description:
    "A modern full-stack web application built with Next.js, MongoDB, and Cloudinary.",
  metadataBase: new URL(
    process.env.NEXTAUTH_URL || "http://localhost:3000"
  ),
  openGraph: {
    title: "mandeholidays",
    description:
      "A modern full-stack web application built with Next.js, MongoDB, and Cloudinary.",
    type: "website",
    locale: "en_US",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
};

/**
 * Inline script that catches chunk/CSS load failures BEFORE React hydrates.
 * If a script/css chunk 404s after redeployment, the page auto-reloads once
 * to fetch the updated HTML with correct chunk references.
 */
const chunkErrorRecoveryScript = `
(function(){
  var KEY = '__chunk_reload__';
  window.addEventListener('error', function(e) {
    var t = (e.target || {});
    // Detect failed <script> or <link> loads (chunk 404s)
    if (t.tagName === 'SCRIPT' || t.tagName === 'LINK') {
      var src = t.src || t.href || '';
      if (src.indexOf('/_next/') !== -1 && !sessionStorage.getItem(KEY)) {
        sessionStorage.setItem(KEY, '1');
        window.location.reload();
      }
    }
  }, true);
  // Also catch unhandled promise rejections from dynamic imports
  window.addEventListener('unhandledrejection', function(e) {
    var msg = (e.reason && e.reason.message) || '';
    if ((msg.indexOf('chunk') !== -1 || msg.indexOf('Failed to fetch') !== -1) && !sessionStorage.getItem(KEY)) {
      sessionStorage.setItem(KEY, '1');
      window.location.reload();
    }
  });
  // Clear the reload flag after successful page load so future deploys can trigger it again
  window.addEventListener('load', function() {
    sessionStorage.removeItem(KEY);
  });
})();
`;

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        {/* Chunk error recovery: auto-reload when _next/ chunks 404 after redeployment */}
        <script dangerouslySetInnerHTML={{ __html: chunkErrorRecoveryScript }} />

        {/* Critical inline CSS fallback — guarantees minimum styling even if CSS chunk fails */}
        <style dangerouslySetInnerHTML={{ __html: `
          body {
            margin: 0;
            font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
            background-color: #ffffff;
            color: #0f172a;
          }
        `}} />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
