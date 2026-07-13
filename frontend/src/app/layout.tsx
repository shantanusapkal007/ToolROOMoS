import type { Metadata } from "next";
import { Outfit, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "../components/auth/AuthProvider";
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
      className={`${fontOutfit.variable} ${fontSpaceGrotesk.variable} antialiased`}
    >
      <body className="mission-control-bg min-h-screen text-[#ededed] font-sans antialiased selection:bg-purple-500/30">
        {/* Dynamic Glowing Background Orbs (OLED Vibe) */}
        <div className="fixed inset-0 z-[-1] pointer-events-none overflow-hidden bg-[#05050A]">
          <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-500/20 blur-[100px] animate-float opacity-80" />
          <div className="absolute top-[30%] right-[-20%] w-[60%] h-[60%] rounded-full bg-purple-700/20 blur-[120px] animate-float opacity-70" style={{ animationDelay: '2s' }} />
          <div className="absolute bottom-[-20%] left-[10%] w-[50%] h-[50%] rounded-full bg-cyan-500/20 blur-[100px] animate-float opacity-60" style={{ animationDelay: '4s' }} />
          {/* Noise texture overlay */}
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.04] mix-blend-overlay"></div>
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
