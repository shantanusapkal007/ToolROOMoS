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
      <body className="mission-control-bg min-h-screen text-zinc-900 font-sans antialiased selection:bg-blue-500/30">
        {/* Dynamic Glowing Background Orbs (Premium Light Mode Vibe) */}
        <div className="fixed inset-0 z-[-1] pointer-events-none overflow-hidden bg-[#FBFBFC]">
          {/* Top Left - Soft Blue */}
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-400/15 blur-[120px] animate-float opacity-90" />
          {/* Middle Right - Soft Purple/Pink */}
          <div className="absolute top-[20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-indigo-400/10 blur-[140px] animate-float opacity-80" style={{ animationDelay: '2s' }} />
          {/* Bottom Left - Soft Emerald */}
          <div className="absolute bottom-[-10%] left-[10%] w-[50%] h-[50%] rounded-full bg-emerald-400/10 blur-[120px] animate-float opacity-70" style={{ animationDelay: '4s' }} />
          
          {/* Ambient center warmth */}
          <div className="absolute top-[40%] left-[30%] w-[40%] h-[40%] rounded-full bg-orange-200/20 blur-[150px] animate-float opacity-50" style={{ animationDelay: '3s' }} />
          
          {/* Noise texture overlay for texture */}
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay"></div>
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
