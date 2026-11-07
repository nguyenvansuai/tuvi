export const metadata = { title: 'Quyền riêng tư · Tử Vi Sự AI', description: 'Chính sách quyền riêng tư của Tử Vi Sự AI' };

const h2 = { fontSize: 18, marginTop: 32, marginBottom: 12 } as const;

export default function PrivacyPage() {
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
        <h1 style={{ fontSize: 28, fontWeight: 600, marginBottom: 8 }}>Chính sách quyền riêng tư</h1>
        <p style={{ fontSize: 12, color: 'var(--tx-3)', marginBottom: 32 }}>Cập nhật: 11/2026</p>

        <h2 style={h2}>1. Thông tin được sử dụng</h2>
        <ul style={{ paddingLeft: 24 }}>
          <li>Họ tên (không bắt buộc), ngày giờ sinh, giới tính, nơi sinh — chỉ để lập lá số.</li>
          <li>Câu hỏi bạn gửi cho phần AI luận giải.</li>
        </ul>

        <h2 style={h2}>2. Cách xử lý</h2>
        <ul style={{ paddingLeft: 24 }}>
          <li>Lá số được tính ngay trên trình duyệt của bạn, không cần tài khoản.</li>
          <li>Khi dùng AI luận giải, dữ liệu lá số và câu hỏi được gửi tới dịch vụ AI của Sự AI để tạo câu trả lời. Trang không lưu lịch sử hội thoại trên máy chủ.</li>
          <li>Trình duyệt có thể lưu tùy chọn giao diện (sáng/tối) trong localStorage.</li>
        </ul>

        <h2 style={h2}>3. Chia sẻ thông tin</h2>
        <p>Sự AI không bán hay chia sẻ thông tin cá nhân của bạn cho bên thứ ba, trừ khi pháp luật yêu cầu.</p>

        <h2 style={h2}>4. Liên hệ</h2>
        <p>Mọi câu hỏi về quyền riêng tư, vui lòng liên hệ qua <a href="https://suai.vn" style={{ color: 'var(--ac)' }}>suai.vn</a>.</p>

        <p style={{ marginTop: 48, fontSize: 12, color: 'var(--tx-3)' }}>
          <a href="/terms" style={{ color: 'var(--ac)' }}>Điều khoản</a> · <a href="/" style={{ color: 'var(--ac)' }}>Về trang chủ</a>
        </p>
      </main>
    </>
  );
}
