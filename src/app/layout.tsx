import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: {
    default: "شیمی‌یار | دستیار هوشمند فرمولاسیون شوینده و آرایشی-بهداشتی",
    template: "%s | شیمی‌یار",
  },
  description:
    "دستیار پژوهشی مبتنی بر RAG برای پژوهش، توسعه، پشتیبانی فرمولاسیون و عیب‌یابی محصولات شوینده، آرایشی و بهداشتی — با استناد به اسناد، جستجوی ترکیبی و گراف دانش.",
  keywords: [
    "فرمولاسیون",
    "شوینده",
    "آرایشی بهداشتی",
    "هوش مصنوعی",
    "RAG",
    "گراف دانش",
    "عیب‌یابی",
    "AI Formulation Assistant",
  ],
  authors: [{ name: "تیم شیمی‌یار" }],
  robots: { index: false, follow: false }, // سند محرمانه شرکت نباید عمومی شود
  openGraph: {
    title: "شیمی‌یار | دستیار هوشمند فرمولاسیون",
    description:
      "پاسخ به پرسش‌های فنی فرمولاسیون با استناد به اسناد سازمانی — جستجوی ترکیبی، گراف دانش و پشتیبانی عیب‌یابی.",
    siteName: "شیمی‌یار",
    type: "website",
    locale: "fa_IR",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0c1512",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl" className="dark" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/css2?family=Vazirmatn:wght@300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-background text-foreground antialiased">
        {children}
        <Toaster position="bottom-center" richColors closeButton />
      </body>
    </html>
  );
}
