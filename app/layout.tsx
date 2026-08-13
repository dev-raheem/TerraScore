import type { Metadata } from "next";
import { Inter, Geist, JetBrains_Mono } from "next/font/google";
import { ConfettiProvider } from "@/lib/confetti-context";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "TerraScore — Employee Performance & Growth Portal",
    template: "%s | TerraScore",
  },
  description: "Employee performance, recognition and growth portal",
  robots: {
    index: false,
    follow: false,
  },
};

const noFlashThemeScript = `
(function(){
  try {
    var t = localStorage.getItem('terrascore_theme');
    if (t === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
  } catch (e) {}
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${geist.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: noFlashThemeScript }} />
      </head>
      <body suppressHydrationWarning>
        <ConfettiProvider>{children}</ConfettiProvider>
      </body>
    </html>
  );
}
