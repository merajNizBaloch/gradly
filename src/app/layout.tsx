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

function AppLoading() {
  return (
    <main className="grid min-h-screen place-items-center bg-[#f5f5f3] p-6 text-[#17202a]">
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-xl bg-[#17365D] text-lg font-black text-white">G</div>
        <h1 className="text-lg font-bold">Loading Gradly</h1>
        <p className="mt-2 text-sm text-slate-500">Preparing the result studio…</p>
      </div>
    </main>
  );
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <Suspense fallback={<AppLoading />}>{children}</Suspense>
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
