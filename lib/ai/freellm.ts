/**
 * Gọi FreeLLMAPI (Sự AI) — giao thức tương thích OpenAI /v1/chat/completions.
 * Cấu hình qua biến môi trường (xem .env.example):
 *   FREELLM_BASE_URL  mặc định https://freellmapi.suai.vn
 *   FREELLM_API_KEY   bắt buộc
 *   FREELLM_MODEL     mặc định "auto" (router tự chọn model)
 */
import 'server-only';

export type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string };

export const AI_ENABLED = () => Boolean(process.env.FREELLM_API_KEY);

const SSE_HEADERS = {
  'Content-Type': 'text/event-stream; charset=utf-8',
  'Cache-Control': 'no-cache, no-transform',
  Connection: 'keep-alive',
  'X-Accel-Buffering': 'no', // tắt buffer của nginx để chữ chạy ra ngay
};

/**
 * Gọi model ở chế độ stream rồi chuyển sang định dạng SSE mà UI đang đọc:
 *   data: {"delta":{"text":"..."}}\n\n   …   data: [DONE]\n\n
 */
export async function streamChat(messages: ChatMessage[], opts: { maxTokens?: number; temperature?: number } = {}): Promise<Response> {
  const base = (process.env.FREELLM_BASE_URL || 'https://freellmapi.suai.vn').replace(/\/+$/, '');
  const upstream = await fetch(`${base}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.FREELLM_API_KEY}`,
    },
    body: JSON.stringify({
      model: process.env.FREELLM_MODEL || 'auto',
      messages,
      stream: true,
      temperature: opts.temperature ?? 0.7,
      max_tokens: opts.maxTokens ?? 2500,
    }),
  });

  if (!upstream.ok || !upstream.body) {
    const detail = await upstream.text().catch(() => '');
    console.error('[freellm] upstream error', upstream.status, detail.slice(0, 500));
    return new Response(JSON.stringify({ error: 'upstream', status: upstream.status }), {
      status: 502, headers: { 'Content-Type': 'application/json' },
    });
  }

  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  const send = (c: ReadableStreamDefaultController<Uint8Array>, text: string) =>
    c.enqueue(encoder.encode(`data: ${JSON.stringify({ delta: { text } })}\n\n`));

  const reader = upstream.body.getReader();
  const isSSE = (upstream.headers.get('content-type') || '').includes('text/event-stream');

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        if (!isSSE) {
          // Một số router trả JSON thường dù đã xin stream — vẫn xử lý được.
          let raw = '';
          for (;;) {
            const { done, value } = await reader.read();
            if (done) break;
            raw += decoder.decode(value, { stream: true });
          }
          const json = JSON.parse(raw);
          const text = json?.choices?.[0]?.message?.content ?? '';
          if (text) send(controller, text);
        } else {
          let buf = '';
          for (;;) {
            const { done, value } = await reader.read();
            if (done) break;
            buf += decoder.decode(value, { stream: true });
            const lines = buf.split('\n');
            buf = lines.pop() ?? '';
            for (const rawLine of lines) {
              const line = rawLine.trim();
              if (!line.startsWith('data:')) continue;
              const data = line.slice(5).trim();
              if (!data || data === '[DONE]') continue;
              try {
                const j = JSON.parse(data);
                const text = j?.choices?.[0]?.delta?.content ?? j?.choices?.[0]?.message?.content ?? '';
                if (text) send(controller, text);
              } catch { /* bỏ qua dòng hỏng */ }
            }
          }
        }
      } catch (e) {
        console.error('[freellm] stream error', e);
        send(controller, '\n\n_(Kết nối AI bị gián đoạn, vui lòng thử lại.)_');
      } finally {
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
      }
    },
    cancel() { reader.cancel().catch(() => {}); },
  });

  return new Response(stream, { headers: SSE_HEADERS });
}

export function notConfigured(): Response {
  // UI coi 404 là "chưa cấu hình AI" và hiện hướng dẫn tương ứng
  return new Response(JSON.stringify({ error: 'FREELLM_API_KEY chưa được cấu hình' }), {
    status: 404, headers: { 'Content-Type': 'application/json' },
  });
}
