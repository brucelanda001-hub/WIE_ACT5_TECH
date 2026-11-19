import type { Metadata, Viewport } from "next";
import { Baloo_Bhaijaan_2, Noto_Sans_Arabic, Nunito_Sans } from "next/font/google";
import "./globals.css";

const nunito = Nunito_Sans({ subsets: ["latin", "latin-ext"], weight: ["400", "600", "700", "800"], variable: "--font-nunito" });
const baloo = Baloo_Bhaijaan_2({ subsets: ["latin", "arabic"], weight: ["500", "600", "700", "800"], variable: "--font-baloo" });
const notoAr = Noto_Sans_Arabic({ subsets: ["arabic"], weight: ["400", "600", "700"], variable: "--font-noto-ar" });

export const metadata: Metadata = {
  title: "EdNova: your learning buddy",
  description: "A safe GenAI learning companion for children, with parents in control.",
  applicationName: "EdNova",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "EdNova", statusBarStyle: "default" },
  formatDetection: { telephone: false },
  icons: { icon: [{ url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }], apple: "/icons/apple-touch-icon.png" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  interactiveWidget: "resizes-content",
  themeColor: "#2340c8",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${nunito.variable} ${baloo.variable} ${notoAr.variable} font-sans antialiased min-h-dvh flex flex-col`}>
        {children}
      </body>
    </html>
  );
}
