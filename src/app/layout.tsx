import type { Metadata } from "next";
import { Geist_Mono, Plus_Jakarta_Sans } from "next/font/google";
import { Toaster } from "@/components/toaster";
import { StoreProvider } from "@/lib/store";
import "./globals.css";

const sans = Plus_Jakarta_Sans({ variable: "--font-sans-brand", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "WinGrid CRM", template: "%s · WinGrid CRM" },
  description: "Multi-organization sales CRM: leads, pipeline, activities and reporting in one workspace.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${sans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full">
        <StoreProvider>
          {children}
          <Toaster />
        </StoreProvider>
      </body>
    </html>
  );
}
