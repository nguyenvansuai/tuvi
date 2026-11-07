import { streamChat, notConfigured, AI_ENABLED, type ChatMessage } from '@/lib/ai/freellm';
import { chartToText, SYSTEM_PROMPT } from '@/lib/ai/chart-text';
import { vn } from '@/lib/i18n/vn';
import type { ZiweiChart } from '@/lib/ziwei/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_HISTORY = 12;
const MAX_CHARS = 4000;

export async function POST(req: Request) {
  if (!AI_ENABLED()) return notConfigured();
  let body: { chart?: ZiweiChart; messages?: { role: string; content: string }[] };
  try { body = await req.json(); } catch { return Response.json({ error: 'JSON không hợp lệ' }, { status: 400 }); }
  const { chart, messages } = body;
  if (!chart?.palaces?.length || !Array.isArray(messages) || !messages.length) {
    return Response.json({ error: 'Thiếu dữ liệu lá số hoặc câu hỏi' }, { status: 400 });
  }

  const history: ChatMessage[] = messages
    .filter(m => (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string' && m.content.trim())
    .slice(-MAX_HISTORY)
    // câu hỏi dựng sẵn có thể còn tên sao/cung chữ Hán → chuyển sang tiếng Việt
    .map(m => ({ role: m.role as 'user' | 'assistant', content: vn(m.content).slice(0, MAX_CHARS) }));
  if (history[history.length - 1]?.role !== 'user') return Response.json({ error: 'Thiếu câu hỏi' }, { status: 400 });

  const sys: ChatMessage = {
    role: 'system',
    content: `${SYSTEM_PROMPT}\n\nDưới đây là lá số của đương số:\n\n${chartToText(chart)}`,
  };
  return streamChat([sys, ...history]);
}
