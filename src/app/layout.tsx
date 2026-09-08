import type { Metadata } from "next";
import { Suspense } from "react";
import "./globals.css";
import "./sidebar-summary.css";
import "./print-card.css";
import "./mobile.css";
import "./mobile-preview.css";
import MobileCardPreview from "./components/mobile-card-preview";
import PrintButtonInterceptor from "./components/print-button-interceptor";
import SiteFooter from "./components/site-footer";

export const metadata: Metadata = {
  title: "Gradly — Academic Result Studio",
  description: "Create premium, print-ready student result cards with a focused academic workflow.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <Suspense fallback={null}>
          {children}
          <PrintButtonInterceptor />
          <MobileCardPreview />
          <SiteFooter />
        </Suspense>
      </body>
    </html>
  );
}
