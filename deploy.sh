#!/usr/bin/env bash
# Deploy / cập nhật Tử Vi Sự AI trên VPS:   cd /opt/tuvi && ./deploy.sh
set -euo pipefail
cd "$(dirname "$0")"

if [ ! -f .env ]; then
  echo "❌ Chưa có file .env — chạy: cp .env.example .env && nano .env"; exit 1
fi
grep -q '^FREELLM_API_KEY=.\+' .env && ! grep -q 'dien-api-key-cua-ban' .env \
  || echo "⚠️  FREELLM_API_KEY chưa điền → web vẫn chạy nhưng AI luận giải sẽ tắt."

echo "▶ Lấy code mới nhất…"
git pull --ff-only

echo "▶ Build & khởi động container…"
docker compose up -d --build

echo "▶ Dọn image cũ…"
docker image prune -f >/dev/null

PORT=$(grep -E '^APP_PORT=' .env | cut -d= -f2); PORT=${PORT:-3020}
echo "▶ Kiểm tra http://127.0.0.1:${PORT} …"
for i in $(seq 1 30); do
  if curl -fsS -o /dev/null "http://127.0.0.1:${PORT}/"; then
    echo "✅ Deploy xong — https://tuvi.suai.vn"; exit 0
  fi
  sleep 2
done
echo "❌ App chưa phản hồi. Xem log: docker compose logs --tail=100 tuvi"; exit 1
