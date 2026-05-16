import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VoteLens",
  description: "Election Analytics Dashboard",

  icons: {
    icon: [
      {
        url: "/icon.png",
        type: "image/png",
      },
    ],
    shortcut: [
      {
        url: "/icon.png",
        type: "image/png",
      },
    ],
    apple: [
      {
        url: "/icon.png",
        type: "image/png",
      },
    ],
  },

  openGraph: {
    title: "VoteLens",
    description: "Election Analytics Dashboard",
    siteName: "VoteLens",
    images: [
      {
        url: "/icon.png",
        width: 1200,
        height: 1200,
        alt: "VoteLens Logo",
      },
    ],
  },
};

/**
 * Root layout utama untuk seluruh halaman VoteLens.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}