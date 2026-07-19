import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

/**
 * Root metadata — inherited by every page unless overridden.
 * Individual pages can override title / description via their own metadata export.
 *
 * @see https://nextjs.org/docs/app/getting-started/metadata-and-og-images
 */
export const metadata = {
  // Title template: "Page Name | App Name"
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

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}

