import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Docspot AI",
  description:
    "Docspot AI helps handle dental calls and support patient conversations.",
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
  openGraph: {
    title: "Docspot AI",
    description:
      "Docspot AI helps handle dental calls and support patient conversations.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Docspot AI",
    description:
      "Docspot AI helps handle dental calls and support patient conversations.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
        <elevenlabs-convai agent-id="agent_2201kqzkna2mfdf8kxt27bpbm64s"></elevenlabs-convai>
        <Script
          src="https://unpkg.com/@elevenlabs/convai-widget-embed"
          async
          type="text/javascript"
        />
      </body>
    </html>
  );
}
