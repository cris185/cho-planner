import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

import { I18nProvider } from "@/components/i18n-provider";
import { PwaRegister } from "@/components/pwa-register";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { DEFAULT_LOCALE } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  title: "CHO Planner",
  description: "Gestor de tareas personal con asistente de IA y Google Calendar.",
  appleWebApp: { capable: true, title: "CHO Planner", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: "#534AB7",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const dict = getDictionary();

  return (
    <html
      lang={DEFAULT_LOCALE}
      suppressHydrationWarning
      className={cn("h-full", "antialiased", "font-sans", geist.variable)}
    >
      <body className="flex min-h-full flex-col">
        <I18nProvider dict={dict}>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {children}
            <Toaster richColors position="top-right" />
            <PwaRegister />
          </ThemeProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
