import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Playfair_Display, Text_Me_One } from "next/font/google";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { AccessibilityProvider } from "@/context/AccessibilityContext";
import { CurrencyProvider } from "@/context/CurrencyContext";
import { TitleBar } from "@/components/layout/TitleBar";
import { AccessibilityMenu } from "@/components/accessibility/AccessibilityMenu";
import { AccessibilityWidget } from "@/components/accessibility-widget";
import { ToastProvider } from "@/components/ui/Toast";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
});

const textMeOne = Text_Me_One({
  weight: "400",
  variable: "--font-text-me-one",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SMART LABS",
  description: "Learning Management System for English Institute",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#FFFFFF",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${playfair.variable} ${textMeOne.variable} antialiased bg-gray-50`}
      >
        <AuthProvider>
          <ThemeProvider>
            <CurrencyProvider>
              <AccessibilityProvider>
                <ToastProvider>
                  <TitleBar />
                  {children}
                  <AccessibilityWidget />
                </ToastProvider>
              </AccessibilityProvider>
            </CurrencyProvider>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
