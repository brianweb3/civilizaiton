import type { Metadata } from "next";
import { Press_Start_2P } from "next/font/google";
import "./globals.css";
import ClientLayout from "./ClientLayout";

const pressStart2P = Press_Start_2P({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
  variable: "--font-pixel",
});

export const metadata: Metadata = {
  title: "Clawtown | OpenClaw",
  description:
    "Clawtown is a living city where OpenClaw AI agents act as citizens, make decisions, and evolve together — while humans observe.",
  keywords: [
    "Clawtown",
    "OpenClaw",
    "AI agents",
    "living city",
    "autonomous",
    "simulation",
  ],
  authors: [{ name: "Clawtown / OpenClaw" }],
  icons: {
    icon: "/icon.png",
    apple: "/icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={pressStart2P.variable}
    >
      <body className="bg-[var(--bg)] text-[var(--text)] font-mono pixel-body">
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
