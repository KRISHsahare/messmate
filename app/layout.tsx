import type { Metadata, Viewport } from "next";
import { Baloo_2, Nunito } from "next/font/google";

import { ToastProvider } from "@/components/ui/toast";
import "./globals.css";

const display = Baloo_2({
  variable: "--font-baloo",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  display: "swap",
});

const body = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "MESS MATE — Daily mess menu, ratings & feedback",
    template: "%s · MESS MATE",
  },
  description:
    "See today's hostel mess menu, rate every meal, and send feedback straight to the mess administrator.",
  applicationName: "MESS MATE",
};

export const viewport: Viewport = {
  themeColor: "#f97316",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${body.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-cream-100 text-cocoa-900">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
