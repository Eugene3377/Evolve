import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Evolve — Company spend, in one place",
  description:
    "Evolve is the finance operations workspace for expenses, bills, approvals, and reporting.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-paper-50 text-ink-950">
        {children}
      </body>
    </html>
  );
}
