import type { Metadata } from "next";
import { Suspense } from "react";
import "./globals.css";
import SiteFooter from "./components/site-footer";
import SidebarTabs from "./components/sidebar-tabs";
import ResultPreviewFix from "./components/result-preview-fix";
import OverlayZoom from "./components/overlay-zoom";
import CompactDesignControl from "./components/compact-design-control";
import ResultDownload from "./components/result-download";
import SchoolLogoSync from "./components/school-logo-sync";
import ResultCardStyles from "./components/result-card-styles";

export const metadata: Metadata = {
  title: "Gradly — Student Result Generator",
  description: "Create premium, print-ready student result cards.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <Suspense fallback={null}>
          {children}
          <CompactDesignControl />
          <SchoolLogoSync />
          <ResultCardStyles />
          <SidebarTabs />
          <ResultPreviewFix />
          <OverlayZoom />
          <ResultDownload />
          <SiteFooter />
        </Suspense>
      </body>
    </html>
  );
}
