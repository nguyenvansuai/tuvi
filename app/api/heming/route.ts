import { streamChat, notConfigured, AI_ENABLED } from '@/lib/ai/freellm';
import { chartToText, SYSTEM_PROMPT } from '@/lib/ai/chart-text';
import { vn } from '@/lib/i18n/vn';
import type { ZiweiChart } from '@/lib/ziwei/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const DEFAULT_TASK = `Hai người này có hợp nhau không? Trả lời theo đúng 3 mục:
**Kết luận** — điểm hợp duyên /10 và 1–2 câu nhận xét.
**Điểm chính** — 3 gạch đầu dòng: tính cách (cung Mệnh), tình cảm (cung Phu Thê), tiền bạc/hợp tác.
**Lời khuyên** — 2 gạch đầu dòng để sống hòa hợp.`;

export async function POST(req: Request) {
  if (!AI_ENABLED()) return notConfigured();
  let body: { chartA?: ZiweiChart; chartB?: ZiweiChart; question?: string };
  try { body = await req.json(); } catch { return Response.json({ error: 'JSON không hợp lệ' }, { status: 400 }); }
  const { chartA, chartB, question } = body;
  if (!chartA?.palaces?.length || !chartB?.palaces?.length) {
    return Response.json({ error: 'Thiếu lá số của một trong hai người' }, { status: 400 });
  }
  const q = typeof question === 'string' && question.trim() ? vn(question.trim()).slice(0, 2000) : '';
  return streamChat([
    {
      role: 'system',
      content: `${SYSTEM_PROMPT}\n\nNhiệm vụ: xem hợp lá số (hợp duyên) giữa hai người.\n\n${chartToText(chartA, 'Người A')}\n\n${chartToText(chartB, 'Người B')}`,
    },
    { role: 'user', content: q ? `Câu hỏi về hai lá số trên: ${q}` : DEFAULT_TASK },
  ], { maxTokens: 1200 });
}
