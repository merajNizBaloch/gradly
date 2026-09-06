import type { Metadata } from "next";
import "./globals.css";
import SiteFooter from "./components/site-footer";
import SidebarTabs from "./components/sidebar-tabs";
import ResultPreviewFix from "./components/result-preview-fix";
import OverlayZoom from "./components/overlay-zoom";
import CompactDesignControl from "./components/compact-design-control";

export const metadata: Metadata = {
  title: "Gradly — Student Result Generator",
  description: "Create premium, print-ready student result cards.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        {children}
        <CompactDesignControl />
        <SidebarTabs />
        <ResultPreviewFix />
        <OverlayZoom />
        <SiteFooter />
      </body>
    </html>
  );
}