import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "../components/auth/AuthProvider";
import { ToastProvider } from "../components/ui/Toast";
import QueryProvider from "../providers/QueryProvider";
import { CommandPalette } from "../components/ui/CommandPalette";
import { SpotlightWrapper } from "../components/ui/SpotlightWrapper";

const fontInter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: 'swap',
});

const fontJetBrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  display: 'swap',
});

export const metadata: Metadata = {
  title: "ToolRoomOS | Mission Control",
  description: "Manufacturing Operating System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${fontInter.variable} ${fontJetBrains.variable} antialiased`}>
      <body className="mission-control-bg min-h-screen text-[var(--text-primary)] font-sans antialiased selection:bg-[var(--color-brand)]/30">
        {/* Static Subtle Ambient Lighting (Apple HIG / Linear style) */}
        <div className="fixed inset-0 z-[-1] pointer-events-none overflow-hidden bg-[#0A0A0A]">
          <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] rounded-full bg-blue-500/10 blur-[120px] opacity-20" />
          <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] rounded-full bg-purple-500/10 blur-[120px] opacity-20" />
          {/* Subtle noise texture */}
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.02] mix-blend-overlay"></div>
        </div>
        
        <AuthProvider>
          <QueryProvider>
            <ToastProvider>
              <SpotlightWrapper>
                {children}
                <CommandPalette />
              </SpotlightWrapper>
            </ToastProvider>
          </QueryProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
