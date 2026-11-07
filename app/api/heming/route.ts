import { streamChat, notConfigured, AI_ENABLED } from '@/lib/ai/freellm';
import { chartToText, SYSTEM_PROMPT } from '@/lib/ai/chart-text';
import { vn } from '@/lib/i18n/vn';
import type { ZiweiChart } from '@/lib/ziwei/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const DEFAULT_TASK = `Hãy xem hợp lá số của hai người theo cấu trúc sau:
**[Tổng quan mức độ hợp]** — chấm điểm hợp duyên trên thang 10 và giải thích ngắn.
**[Cung Mệnh hai người]** — tính cách bổ trợ hay xung khắc.
**[Cung Phu Thê đối chiếu]** — kỳ vọng tình cảm của mỗi người, điểm khớp và lệch.
**[Tam phương tứ chính & Tứ Hóa]** — Hóa Lộc/Hóa Kỵ của người này rơi vào cung nào của người kia (nếu suy ra được).
**[Tài lộc & hợp tác]** — có bổ trợ nhau về tiền bạc, công việc không.
**[Lời khuyên chung sống]** — 3–5 gợi ý cụ thể.`;

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
  ], { maxTokens: 3000 });
}
