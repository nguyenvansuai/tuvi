'use client';
import { useState } from 'react';
import { usePathname } from 'next/navigation';

/** Thông tin thương hiệu Sự AI — nút nổi góc dưới + thẻ giới thiệu khi bấm. */
export default function SuaiBrand() {
  const [open, setOpen] = useState(false);
  const path = usePathname() || '';
  // Trang lá số / hợp tuổi trên mobile có ô hỏi dính đáy → ẩn nút nổi (đã có SuaiInline trong trang)
  const hideOnMobile = path.startsWith('/chart') || path.startsWith('/heming');
  return (
    <div data-suai className={hideOnMobile ? 'hidden lg:block' : undefined} style={{ position: 'fixed', left: 16, bottom: 16, zIndex: 60, fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif' }}>
      {open && (
        <div
          role="dialog"
          aria-label="Giới thiệu Sự AI"
          style={{
            width: 280, maxWidth: 'calc(100vw - 32px)', marginBottom: 10, padding: 16, borderRadius: 14,
            background: '#ffffff', color: '#0f2a4a', boxShadow: '0 12px 32px rgba(0,0,0,0.28)',
            border: '1px solid rgba(15,42,74,0.12)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <img src="/suai-avatar.jpg" alt="Sự AI" width={56} height={56}
              style={{ width: 56, height: 56, borderRadius: '50%', objectFit: 'cover', objectPosition: '50% 22%', border: '2px solid #1aa7ec' }} />
            <div>
              <img src="/suai-logo.png" alt="SỰ AI" style={{ height: 22, width: 'auto', display: 'block' }} />
              <div style={{ fontSize: 12, color: '#4a5d75', marginTop: 4 }}>Johnny Nguyễn · Founder</div>
            </div>
          </div>
          <p style={{ fontSize: 13, lineHeight: 1.55, margin: '12px 0 10px', color: '#24384f' }}>
            Đào tạo AI thực chiến, xây dựng ứng dụng &amp; tự động hóa cho doanh nghiệp Việt.
          </p>
          <a href="https://suai.vn" target="_blank" rel="noopener noreferrer"
            style={{ display: 'block', textAlign: 'center', padding: '8px 12px', borderRadius: 10, background: '#0f4c8a', color: '#fff', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
            Truy cập suai.vn
          </a>
        </div>
      )}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        aria-label="Sự AI"
        style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '5px 12px 5px 5px', borderRadius: 999, cursor: 'pointer',
          background: 'rgba(255,255,255,0.96)', border: '1px solid rgba(15,42,74,0.15)', boxShadow: '0 4px 14px rgba(0,0,0,0.25)',
        }}
      >
        <img src="/suai-avatar.jpg" alt="" width={30} height={30}
          style={{ width: 30, height: 30, borderRadius: '50%', objectFit: 'cover', objectPosition: '50% 22%' }} />
        <span style={{ fontSize: 13, fontWeight: 700, color: '#0f4c8a', letterSpacing: 0.3 }}>SỰ AI</span>
      </button>
    </div>
  );
}

/** Dòng thương hiệu nằm trong trang (dùng cho mobile, nơi nút nổi bị ẩn). */
export function SuaiInline() {
  return (
    <a href="https://suai.vn" target="_blank" rel="noopener noreferrer"
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, margin: '28px auto 8px', textDecoration: 'none', color: 'inherit', opacity: 0.9 }}>
      <img src="/suai-avatar.jpg" alt="Sự AI" width={36} height={36}
        style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', objectPosition: '50% 22%', border: '2px solid #1aa7ec' }} />
      <span style={{ fontSize: 13, lineHeight: 1.4 }}>
        Phát triển bởi <strong style={{ color: '#1aa7ec' }}>SỰ AI</strong> · suai.vn
      </span>
    </a>
  );
}
