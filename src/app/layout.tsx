import type { Metadata } from "next";
import "./globals.css";
import SiteFooter from "./components/site-footer";

export const metadata: Metadata = { title: "Gradly — Student Result Generator", description: "Create premium, print-ready student result cards." };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}<SiteFooter /></body></html>;
}
