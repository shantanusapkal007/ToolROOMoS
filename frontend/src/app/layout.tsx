import type { Metadata } from "next";
import { Outfit, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "../components/auth/AuthProvider";
import { PermissionProvider } from "../components/auth/PermissionProvider";
import { ToastProvider } from "../components/ui/Toast";
import QueryProvider from "../providers/QueryProvider";
import { CommandPalette } from "../components/ui/CommandPalette";
import { SpotlightWrapper } from "../components/ui/SpotlightWrapper";

const fontOutfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  display: 'swap',
});

const fontSpaceGrotesk = Space_Grotesk({
  variable: "--font-space",
  subsets: ["latin"],
  display: 'swap',
});

export const metadata: Metadata = {
  title: "ToolRoomOS | Dashboard",
  description: "Manufacturing Operating System",
};

import { NotificationProvider } from "../context/NotificationContext";
import { NotificationCenter } from "../components/ui/NotificationCenter";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${fontOutfit.variable} ${fontSpaceGrotesk.variable} antialiased`}
    >
      <body className="bg-[#F8F9FA] min-h-screen text-zinc-900 font-sans antialiased selection:bg-blue-500/20">
        <AuthProvider>
          <PermissionProvider>
            <QueryProvider>
              <ToastProvider>
                <NotificationProvider>
                  <SpotlightWrapper>
                    {children}
                    <CommandPalette />
                    <NotificationCenter />
                  </SpotlightWrapper>
                </NotificationProvider>
              </ToastProvider>
            </QueryProvider>
          </PermissionProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
