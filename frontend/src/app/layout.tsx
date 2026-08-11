import type { Metadata } from "next";
import { IBM_Plex_Sans, Inconsolata } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "../components/auth/AuthProvider";
import { PermissionProvider } from "../components/auth/PermissionProvider";
import { ToastProvider } from "../components/ui/Toast";
import QueryProvider from "../providers/QueryProvider";
import { CommandPalette } from "../components/ui/CommandPalette";
import { SpotlightWrapper } from "../components/ui/SpotlightWrapper";
import { NotificationProvider } from "../context/NotificationContext";
import { ThemeProvider } from "../context/ThemeContext";
import { NotificationCenter } from "../components/ui/NotificationCenter";

const fontPlexSans = IBM_Plex_Sans({
  variable: "--font-plex-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: 'swap',
});

const fontInconsolata = Inconsolata({
  variable: "--font-inconsolata",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: 'swap',
});

export const metadata: Metadata = {
  title: "ToolRoomOS | Manufacturing Operating System",
  description: "Enterprise Manufacturing and Toolroom Operating System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${fontPlexSans.variable} ${fontInconsolata.variable} antialiased`}
    >
      <body className="bg-canvas min-h-screen text-ink font-sans antialiased selection:bg-primary/20">
        <ThemeProvider>
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
        </ThemeProvider>
      </body>
    </html>
  );
}
