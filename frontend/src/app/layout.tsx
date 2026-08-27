import type { Metadata, Viewport } from "next";
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
import { PwaRegister } from "../components/pwa/PwaRegister";
import { OfflineIndicator } from "../components/pwa/OfflineIndicator";
import { PwaProvider } from "../context/PwaContext";



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

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0b0c0e" },
    { media: "(prefers-color-scheme: light)", color: "#137749" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "ToolRoomOS | Manufacturing Operating System",
  description: "Enterprise Manufacturing and Toolroom Operating System",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "ToolRoomOS",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512x512.png", sizes: "512x512", type: "image/png" },
      { url: "/favicon.ico" },
    ],
    shortcut: "/icon-192x192.png",
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
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
      className={`${fontPlexSans.variable} ${fontInconsolata.variable} antialiased`}
    >
      <body className="bg-canvas min-h-screen text-ink font-sans antialiased selection:bg-primary/20">
        <ThemeProvider>
          <AuthProvider>
            <PermissionProvider>
              <QueryProvider>
                <ToastProvider>
                  <NotificationProvider>
                    <PwaProvider>
                      <SpotlightWrapper>
                        {children}
                        <CommandPalette />
                        <NotificationCenter />
                        <PwaRegister />
                        <OfflineIndicator />
                      </SpotlightWrapper>
                    </PwaProvider>
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
