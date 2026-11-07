# Tử Vi Sự AI — Lập lá số Tử Vi Đẩu Số & AI luận giải

Bản Việt hóa của [Renhuai123/ziwei-doushu](https://github.com/Renhuai123/ziwei-doushu) (MIT) do **[Sự AI](https://suai.vn)** thực hiện:

- Giao diện 100% tiếng Việt, tên sao/cung theo thuật ngữ Tử Vi Việt Nam (Tử Vi, Thiên Cơ, Hóa Lộc, cung Quan Lộc…).
- **AI luận giải** (`/api/interpret`) và **xem hợp lá số** (`/api/heming`) qua FreeLLMAPI của Sự AI (chuẩn OpenAI, stream).
- Nơi sinh theo 63 tỉnh/thành Việt Nam, hiệu chỉnh giờ Mặt Trời thực theo kinh tuyến 105° (UTC+7); miền Nam giai đoạn 1960–13/6/1975 tự tính theo UTC+8.
- Đóng gói Docker + script `deploy.sh` cho VPS.

## Chạy thử trên máy

```bash
npm ci
cp .env.example .env.local   # điền FREELLM_API_KEY
npm run dev                  # http://localhost:3000
npm test                     # kiểm thử engine lập lá số
```

## Deploy trên VPS (Docker)

```bash
git clone https://github.com/nguyenvansuai/tuvi.git /opt/tuvi
cd /opt/tuvi
cp .env.example .env && nano .env      # điền FREELLM_API_KEY
./deploy.sh                            # build + chạy ở 127.0.0.1:3020
```

Nginx mẫu: `deploy/nginx-tuvi.suai.vn.conf` (đã tắt buffer cho stream AI). Cập nhật bản mới: `cd /opt/tuvi && ./deploy.sh`.

## Biến môi trường

| Biến | Mặc định | Ý nghĩa |
|---|---|---|
| `FREELLM_API_KEY` | — | API key FreeLLMAPI (bắt buộc để bật AI) |
| `FREELLM_BASE_URL` | `https://freellmapi.suai.vn` | Gốc API, gọi `/v1/chat/completions` |
| `FREELLM_MODEL` | `auto` | Model; `auto` để router tự chọn |
| `NEXT_PUBLIC_SITE_URL` | `https://tuvi.suai.vn` | Domain (dùng lúc build) |
| `APP_PORT` | `3020` | Cổng nội bộ trên VPS |

## Cấu trúc Việt hóa

- `lib/i18n/terms.vi.json` + `lib/i18n/vn.ts`: từ điển thuật ngữ Hán → Việt. Engine (`lib/ziwei/*`) vẫn dùng tên chữ Hán làm khóa logic nên **không đổi dữ liệu gốc**.
- `components/AutoVietnamese.tsx`: chuyển thuật ngữ động (tên sao, cung, can chi) trên giao diện sang tiếng Việt. Vùng muốn giữ chữ Hán (nguyên văn cổ thư) gắn `data-han`.
- `lib/ai/`: prompt tiếng Việt + kết nối FreeLLMAPI.

## Giấy phép

Mã nguồn: MIT (giữ nguyên `LICENSE` của dự án gốc). Trích dẫn bài giảng “Thiên Kỷ” của Nghê Hải Hạ thuộc bản quyền chủ sở hữu (CC BY-NC-SA, không dùng thương mại); cổ thư thuộc phạm vi công cộng.
