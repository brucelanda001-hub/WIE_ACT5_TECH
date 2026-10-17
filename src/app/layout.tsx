import type { Metadata } from "next";
import { Nunito_Sans, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const nunito = Nunito_Sans({ subsets: ["latin"], weight: ["500", "600", "700"], variable: "--font-nunito" });
const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], weight: ["600", "700", "800"], variable: "--font-jakarta" });

export const metadata: Metadata = {
  title: "EdNova — Learning Platform",
  description: "A safe GenAI learning buddy for children.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" rel="stylesheet" />
      </head>
      <body className={`${nunito.variable} ${jakarta.variable} font-sans bg-[#f8f9ff] text-[#111c29] antialiased min-h-screen flex flex-col`}>
        {children}
      </body>
    </html>
  );
}