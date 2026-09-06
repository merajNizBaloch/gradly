import type { Metadata } from "next";
import { Suspense } from "react";
import "./globals.css";
import "./sidebar-unified.css";
import SiteFooter from "./components/site-footer";
import SidebarTabs from "./components/sidebar-tabs";
import ResultExporter from "./components/result-exporter";
import ResultPreviewFix from "./components/result-preview-fix";
import OverlayZoom from "./components/overlay-zoom";
import CompactDesignControl from "./components/compact-design-control";
import ReviewRemarks from "./components/review-remarks";

export const metadata: Metadata = {
  title: "Gradly — Student Result Generator",
  description: "Create premium, print-ready student result cards.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <Suspense fallback={null}>{children}</Suspense>
        <CompactDesignControl />
        <SidebarTabs />
        <ReviewRemarks />
        <ResultExporter />
        <ResultPreviewFix />
        <OverlayZoom />
        <SiteFooter />
      </body>
    </html>
  );
}
