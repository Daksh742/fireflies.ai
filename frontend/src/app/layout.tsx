import type { Metadata } from "next";
import { ThemeProvider } from "@/context/ThemeContext";
import { NotificationProvider } from "@/context/NotificationContext";
import { MainLayout } from "@/components/layout/MainLayout";
import "./globals.css";

export const metadata: Metadata = {
  title: "Fireflies.ai Meeting Intelligence",
  description: "AI-powered meeting assistant, transcript analyzer, and notes workspace",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <body className="antialiased min-h-screen" suppressHydrationWarning>
        <ThemeProvider>
          <NotificationProvider>
            <MainLayout>{children}</MainLayout>
          </NotificationProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
