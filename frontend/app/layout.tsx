import type { Metadata } from "next";

import { Providers } from "@/app/providers";
import { AppHeader } from "@/components/layout/AppHeader";
import { NavigationOverlay } from "@/components/layout/NavigationOverlay";
import { Toaster } from "@/components/ui/Toaster";
import "./globals.css";

export const metadata: Metadata = {
  title: "LMS Frontend",
  description: "Multi-tenant LMS frontend with role-based dashboards."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <AppHeader />
          <NavigationOverlay />
          <Toaster />
          <main>{children}</main>
        </Providers>
      </body>
    </html>
  );
}
