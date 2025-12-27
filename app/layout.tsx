import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { Shell } from "@/components/shell";
import { ProfileSync } from "@/components/profile-sync";
import { RealtimeProvider } from "@/components/realtime-provider";
import { Toaster } from "sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Flux.social | Command Center",
  description: "Social Media Management for Pros",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider appearance={{ baseTheme: dark }}>
      <html lang="en" className="dark">
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          <ProfileSync />
          <RealtimeProvider>
            <Toaster position="top-right" richColors />
            <Shell>{children}</Shell>
          </RealtimeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
