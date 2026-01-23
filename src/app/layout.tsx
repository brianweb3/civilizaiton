import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import "./globals.css";
import ClientLayout from "./ClientLayout";

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "civilizAItion",
  description: "A live experiment in post-human governance. A virtual territory governed entirely by AI.",
  keywords: ["AI governance", "autonomous territory", "simulation", "post-human"],
  authors: [{ name: "civilizAItion SYSTEM" }],
  icons: {
    icon: '/icon.png',
    apple: '/icon.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={jetbrainsMono.variable}>
      <body className="bg-[var(--bg)] text-[var(--text)] font-sans">
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
