import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth/auth-context";
import { I18nProvider } from "@/lib/i18n/context";
import { AppShell } from "@/components/layout/app-shell";

export const metadata: Metadata = {
  title: "TelcoQualify Enterprise | Telecom Solution-Qualification & Presales",
  description: "Enterprise commercial intelligence, solution qualification, and presales workflow platform for Telecommunications & ISPs.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className="h-full">
      <body className="h-full flex flex-col bg-slate-100/60 dark:bg-slate-950">
        <AuthProvider>
          <I18nProvider>
            <AppShell>{children}</AppShell>
          </I18nProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
