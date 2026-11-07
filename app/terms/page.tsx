export const metadata = { title: 'Điều khoản · Tử Vi Sự AI', description: 'Điều khoản sử dụng Tử Vi Sự AI' };

const h2 = { fontSize: 18, marginTop: 32, marginBottom: 12 } as const;

export default function TermsPage() {
  return (
    <>
      <header style={{ position: 'sticky', top: 0, zIndex: 50, background: 'var(--bg-0)', borderBottom: '1px solid var(--bdr)', padding: '14px 24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
        <a href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--tx-3)', textDecoration: 'none' }}>
          <span style={{ fontSize: '16px' }}>‹</span>
          <span>Về trang chủ</span>
        </a>
        <div style={{ width: '1px', height: '20px', background: 'var(--bdr-med)' }} />
        <span style={{ fontSize: '12px', color: 'var(--ac)', letterSpacing: '0.2em' }}>Tử Vi Sự AI</span>
      </header>
      <main style={{ maxWidth: 800, margin: '0 auto', padding: '60px 24px 80px', color: 'var(--tx-1)', lineHeight: 1.8 }}>
        <h1 style={{ fontSize: 28, fontWeight: 600, marginBottom: 8 }}>Điều khoản sử dụng</h1>
        <p style={{ fontSize: 12, color: 'var(--tx-3)', marginBottom: 32 }}>Cập nhật: 11/2026</p>

        <h2 style={h2}>1. Tính chất nội dung</h2>
        <p>Tử Vi Đẩu Số là một phần văn hóa truyền thống phương Đông. Lá số và phần AI luận giải chỉ mang tính tham khảo, giải trí và phát triển bản thân; không phải lời khuyên y tế, tài chính, đầu tư, pháp lý hay căn cứ cho quyết định quan trọng.</p>

        <h2 style={h2}>2. AI luận giải</h2>
        <p>Nội dung do AI tạo tự động, có thể chưa chính xác hoặc không đầy đủ. Bạn tự chịu trách nhiệm khi sử dụng thông tin.</p>

        <h2 style={h2}>3. Mã nguồn và bản quyền</h2>
        <p>Engine lập lá số dựa trên dự án mã nguồn mở ziwei-doushu (giấy phép MIT), được Sự AI Việt hóa và bổ sung AI luận giải. Trích dẫn bài giảng “Thiên Kỷ” thuộc bản quyền của chủ sở hữu; cổ thư thuộc phạm vi công cộng.</p>

        <h2 style={h2}>4. Liên hệ</h2>
        <p>Sự AI — <a href="https://suai.vn" style={{ color: 'var(--ac)' }}>suai.vn</a></p>

        <p style={{ marginTop: 48, fontSize: 12, color: 'var(--tx-3)' }}>
          <a href="/privacy" style={{ color: 'var(--ac)' }}>Quyền riêng tư</a> · <a href="/" style={{ color: 'var(--ac)' }}>Về trang chủ</a>
        </p>
      </main>
    </>
  );
}
