import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, Space_Grotesk } from "next/font/google";

import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-ibm-plex-mono",
  weight: ["400", "500", "600"],
});

const siteTitle = "Prompt Studio — AI Prompt Management";
const siteDescription =
  "Organize, customize, and execute reusable AI prompt templates with dynamic variables. A high-end prompt management studio for ChatGPT, Claude, Midjourney, and more.";
const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://prompt-studio.netlify.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: siteTitle,
    template: "%s | Prompt Studio",
  },
  description: siteDescription,
  keywords: [
    "AI prompts",
    "prompt management",
    "prompt templates",
    "ChatGPT prompts",
    "Claude prompts",
    "Midjourney prompts",
    "AI workflow",
    "prompt engineering",
    "prompt library",
    "prompt studio",
  ],
  authors: [{ name: "Prompt Studio" }],
  creator: "Prompt Studio",
  publisher: "Prompt Studio",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "Prompt Studio",
    title: siteTitle,
    description: siteDescription,
  },
  twitter: {
    card: "summary_large_image",
    title: siteTitle,
    description: siteDescription,
  },
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/apple-icon", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0f",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`${spaceGrotesk.variable} ${ibmPlexMono.variable} min-h-screen`}
      >
        {children}
      </body>
    </html>
  );
}
