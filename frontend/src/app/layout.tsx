import type { Metadata } from "next";
import { Outfit, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "../components/auth/AuthProvider";
import { ToastProvider } from "../components/ui/Toast";
import QueryProvider from "../providers/QueryProvider";

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
        {/* Dynamic Glowing Background Orbs */}
        <div className="fixed inset-0 z-[-1] pointer-events-none overflow-hidden">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-600/10 blur-[60px] animate-float opacity-70" />
          <div className="absolute top-[40%] right-[-10%] w-[35%] h-[50%] rounded-full bg-purple-600/10 blur-[60px] animate-float opacity-50" style={{ animationDelay: '2s' }} />
          <div className="absolute bottom-[-10%] left-[20%] w-[50%] h-[40%] rounded-full bg-cyan-600/10 blur-[60px] animate-float opacity-60" style={{ animationDelay: '4s' }} />
          {/* Subtle noise texture overlay */}
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay"></div>
        </div>
        
        <AuthProvider>
          <QueryProvider>
            <ToastProvider>
              {children}
            </ToastProvider>
          </QueryProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
