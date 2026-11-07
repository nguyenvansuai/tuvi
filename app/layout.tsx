import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/components/ThemeProvider';
import AutoVietnamese from '@/components/AutoVietnamese';
import SuaiBrand from '@/components/SuaiBrand';
import { SITE_URL } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Tử Vi Sự AI · Lập lá số Tử Vi Đẩu Số & AI luận giải',
  description: 'Lập lá số Tử Vi Đẩu Số theo hệ Nghê Hải Hạ, AI luận giải sâu cách cục, Đại Hạn, Lưu Niên, tình cảm, sự nghiệp, tài lộc, sức khỏe',
  keywords: 'tử vi, tử vi đẩu số, lập lá số tử vi, xem tử vi, luận giải tử vi AI, Nghê Hải Hạ, Sự AI',
  metadataBase: new URL(SITE_URL),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Tử Vi Sự AI · Lập lá số Tử Vi Đẩu Số & AI luận giải',
    description: 'Lập lá số Tử Vi Đẩu Số theo hệ Nghê Hải Hạ, AI luận giải sâu cách cục, Đại Hạn, Lưu Niên, tình cảm, sự nghiệp, tài lộc, sức khỏe',
    url: SITE_URL,
    siteName: 'Tử Vi Sự AI',
    locale: 'vi_VN',
    type: 'website',
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION || undefined,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `(function(){try{var t=localStorage.getItem('ziwei-theme');if(t==='light'||t==='dark')document.documentElement.setAttribute('data-theme',t);else document.documentElement.setAttribute('data-theme','dark');}catch(e){}})();` }} />
      </head>
      <body className="min-h-screen">
        <ThemeProvider>
          {children}
        </ThemeProvider>
        <SuaiBrand />
        <AutoVietnamese />
      </body>
    </html>
  );
}
