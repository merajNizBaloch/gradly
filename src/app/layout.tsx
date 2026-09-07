import type { Metadata } from "next";
import { Suspense } from "react";
import "./globals.css";
import SiteFooter from "./components/site-footer";
import ResultDownload from "./components/result-download";
import SchoolLogoSync from "./components/school-logo-sync";
import ResultCardStyles from "./components/result-card-styles";
import WorkspaceSettingsOverlay from "./components/workspace-settings-overlay";

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
          <SchoolLogoSync />
          <WorkspaceSettingsOverlay />
          <ResultCardStyles />
          <ResultDownload />
          <SiteFooter />
        </Suspense>
      </body>
    </html>
  );
}
