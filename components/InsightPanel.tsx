'use client';
import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import type { ZiweiChart, Palace } from '@/lib/ziwei/types';
import type { TimeView } from './TimeNav';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  hidden?: boolean; // don't show user bubble for auto/topic messages
}

interface SelectedSiHua {
  starName: string;
  siHua: string;
  view: TimeView;
}

interface InsightPanelProps {
  chart: ZiweiChart;
  selectedPalace?: Palace | null;
  selectedSiHua?: SelectedSiHua | null;
}

const TOPICS = [
  { key: 'overview',     label: 'Mệnh cách' },
  { key: 'love',        label: 'Tình cảm' },
  { key: 'career',      label: 'Sự nghiệp' },
  { key: 'wealth',      label: 'Tài lộc' },
  { key: 'health',      label: 'Sức khỏe' },
  { key: 'personality', label: 'Tính cách' },
] as const;

/** Prompt chủ đề — ngắn gọn, ưu tiên kết luận. Khung trả lời chung nằm ở SYSTEM_PROMPT (lib/ai/chart-text.ts). */
const TOPIC_PROMPTS: Record<string, string> = {
  overview: `Tổng quan mệnh cách của tôi. Trả lời theo đúng 3 mục:
**Kết luận** — 1–2 câu: tôi là người thế nào, điểm mạnh nhất của lá số.
**Điểm chính** — 3 gạch đầu dòng: cung Mệnh, Tam phương (Tài – Quan – Di), Đại Hạn hiện tại.
**Lời khuyên** — 2 gạch đầu dòng.`,

  love: `Tình cảm, hôn nhân của tôi thế nào? Trả lời theo đúng 3 mục:
**Kết luận** — 1–2 câu về chuyện tình cảm của tôi.
**Điểm chính** — 3 gạch đầu dòng: cung Phu Thê, kiểu người hợp với tôi, giai đoạn thuận lợi/cần lưu ý trong Đại Hạn hiện tại.
**Lời khuyên** — 2 gạch đầu dòng.`,

  career: `Sự nghiệp của tôi thế nào, hợp đi làm hay kinh doanh? Trả lời theo đúng 3 mục:
**Kết luận** — 1–2 câu: hợp hướng nào.
**Điểm chính** — 3 gạch đầu dòng: cung Quan Lộc, ngành nghề phù hợp, vận sự nghiệp trong Đại Hạn hiện tại.
**Lời khuyên** — 2 gạch đầu dòng.`,

  wealth: `Tài lộc của tôi thế nào? Trả lời theo đúng 3 mục:
**Kết luận** — 1–2 câu: kiếm tiền bằng cách nào, giữ tiền tốt không.
**Điểm chính** — 3 gạch đầu dòng: cung Tài Bạch, cung Điền Trạch (tích lũy), tài vận trong Đại Hạn hiện tại.
**Lời khuyên** — 2 gạch đầu dòng.`,

  health: `Sức khỏe của tôi cần lưu ý gì? Trả lời theo đúng 3 mục:
**Kết luận** — 1–2 câu.
**Điểm chính** — 3 gạch đầu dòng: cung Tật Ách, bộ phận/thói quen cần chú ý, giai đoạn cần giữ gìn.
**Lời khuyên** — 2 gạch đầu dòng (dưỡng sinh, khám định kỳ; không chẩn đoán bệnh).`,

  personality: `Tính cách của tôi thế nào? Trả lời theo đúng 3 mục:
**Kết luận** — 1–2 câu tóm tắt con người tôi.
**Điểm chính** — 3 gạch đầu dòng: điểm mạnh, điểm yếu, cách tôi đối xử với người khác.
**Lời khuyên** — 2 gạch đầu dòng.`,
};

const PALACE_ROLES: Record<string, string> = {
  '命宫':   'Bản thân, tính cách, cách cục bẩm sinh',
  '兄弟宫': 'Anh chị em, người hợp tác',
  '夫妻宫': 'Tình cảm, hôn nhân',
  '子女宫': 'Con cái, cấp dưới',
  '财帛宫': 'Nguồn tài lộc, cách kiếm tiền',
  '疾厄宫': 'Sức khỏe, tai nạn',
  '迁移宫': 'Cơ hội khi đi xa, quan hệ xã hội',
  '交友宫': 'Bạn bè, quý nhân, tiểu nhân',
  '官禄宫': 'Thành tựu sự nghiệp, địa vị xã hội',
  '田宅宫': 'Bất động sản, môi trường gia đình',
  '福德宫': 'Đời sống tinh thần, phúc phần nội tâm',
  '父母宫': 'Cha mẹ, giấy tờ hợp đồng',
};

/** Render AI markdown: **【Title】** → gold header, **bold** → strong */
function AiContent({ text, streaming }: { text: string; streaming?: boolean }) {
  const lines = text.split('\n');
  return (
    <div className="space-y-0.5">
      {lines.map((line, i) => {
        // Tiêu đề mục: **[Tiêu đề]**, **【Tiêu đề】**, **Tiêu đề**, hoặc # / ## / ### Tiêu đề
        const sectionMatch = line.trim().match(/^\*\*[\[【](.+?)[\]】]\*\*:?$/)
          || line.trim().match(/^#{1,4}\s+(.+?)\s*$/)
          || line.trim().match(/^\*\*([^*]{2,80})\*\*:?$/);
        if (sectionMatch) {
          const title = sectionMatch[1].replace(/^\*\*|\*\*$/g, '').replace(/^[\[【]|[\]】]$/g, '');
          return (
            <div key={i} className="pt-3 pb-0.5 first:pt-0">
              <span className="text-[12px] font-semibold tracking-wide" style={{ color: 'var(--t-gold)' }}>
                {title}
              </span>
            </div>
          );
        }
        if (line.trim() === '') return <div key={i} className="h-1" />;
        const bullet = line.match(/^\s*(?:[-*•]|\d+[.)])\s+(.*)$/);
        const body = bullet ? bullet[1] : line;
        const parts = body.split(/\*\*(.+?)\*\*/);
        return (
          <div key={i} className={`text-[12px] leading-relaxed${bullet ? ' pl-3 relative' : ''}`} style={{ color: 'var(--t-text2)' }}>
            {bullet && <span className="absolute left-0" style={{ color: 'var(--t-gold)' }}>•</span>}
            {parts.map((part, j) =>
              j % 2 === 0
                ? part
                : <strong key={j} className="font-medium" style={{ color: 'var(--t-text)' }}>{part}</strong>
            )}
          </div>
        );
      })}
      {streaming && (
        <span
          className="inline-block w-1.5 h-3 ml-0.5 animate-pulse rounded-sm align-middle"
          style={{ background: 'var(--t-gold)', opacity: 0.6 }}
        />
      )}
    </div>
  );
}

export default function InsightPanel({ chart, selectedPalace, selectedSiHua }: InsightPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTopic, setActiveTopic] = useState<string>('overview');
  const messagesRef = useRef<Message[]>([]); // always-current copy for closures
  const loadingRef = useRef(false);
  const autoLoaded = useRef(false);
  const lastPalaceBranch = useRef<number | undefined>(undefined);
  const lastSiHuaKey = useRef<string | undefined>(undefined);
  const scrollRef = useRef<HTMLDivElement>(null);
  // Mobile: ô hỏi dính đáy màn hình; sau khi người dùng hỏi thì cuộn trang tới câu trả lời
  const [isMobile, setIsMobile] = useState(false);
  const followRef = useRef(false);
  const lastMsgRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1023px)');
    const on = () => setIsMobile(mq.matches);
    on(); mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);

  // Keep refs in sync
  useEffect(() => { messagesRef.current = messages; }, [messages]);
  useEffect(() => { loadingRef.current = loading; }, [loading]);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);
  useEffect(() => {
    if (!isMobile || !followRef.current) return;
    followRef.current = false;
    lastMsgRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [messages.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-generate 命格总览 on mount
  useEffect(() => {
    if (autoLoaded.current) return;
    autoLoaded.current = true;
    sendMessage(TOPIC_PROMPTS.overview, true);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Inject palace analysis when palace selected
  useEffect(() => {
    if (!selectedPalace || selectedPalace.branch === lastPalaceBranch.current) return;
    lastPalaceBranch.current = selectedPalace.branch;

    const majorStars = selectedPalace.stars.filter(s => s.type === 'major');
    const starDesc = majorStars.length > 0
      ? majorStars.map(s => `${s.name}${s.siHua ? '化' + s.siHua : ''}`).join('、')
      : 'Vô chính diệu (mượn cung đối)';
    const role = PALACE_ROLES[selectedPalace.name] ?? '';

    const prompt = `Luận cung ${selectedPalace.name} của tôi (chủ về: ${role}; chính tinh: ${starDesc}). Trả lời theo đúng 3 mục:
**Kết luận** — 1–2 câu: cung này tốt hay cần lưu ý, ảnh hưởng gì đến tôi.
**Điểm chính** — 2–3 gạch đầu dòng (sao trong cung, Tam phương tứ chính).
**Lời khuyên** — 1–2 gạch đầu dòng.`;

    sendMessage(prompt, true);
  }, [selectedPalace]); // eslint-disable-line react-hooks/exhaustive-deps

  // 注入四化飞化分析
  useEffect(() => {
    if (!selectedSiHua) return;
    const key = `${selectedSiHua.starName}-${selectedSiHua.siHua}-${selectedSiHua.view}`;
    if (key === lastSiHuaKey.current) return;
    lastSiHuaKey.current = key;

    // 找出该星所在宫位
    const palaceOfStar = chart.palaces.find(p =>
      p.stars.some(s => s.name === selectedSiHua.starName)
    );
    const palaceName = palaceOfStar?.name ?? 'Cung chưa rõ';
    const viewLabel = selectedSiHua.view === 'daxian' ? '大限' : '流年';

    const prompt = `${viewLabel}: ${selectedSiHua.starName}化${selectedSiHua.siHua} rơi vào cung ${palaceName}. Điều này ảnh hưởng gì đến tôi? Trả lời theo đúng 3 mục:
**Kết luận** — 1–2 câu.
**Điểm chính** — 2–3 gạch đầu dòng (lĩnh vực bị ảnh hưởng, thời điểm).
**Lời khuyên** — 1–2 gạch đầu dòng.`;

    sendMessage(prompt, true);
  }, [selectedSiHua]); // eslint-disable-line react-hooks/exhaustive-deps

  const streamResponse = async (apiMessages: { role: 'user' | 'assistant'; content: string }[]) => {
    try {
      const res = await fetch('/api/interpret', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chart, messages: apiMessages }),
      });
      if (res.status === 404) throw new Error('api-missing');
      if (!res.ok) throw new Error('Yêu cầu thất bại');
      if (!res.body) throw new Error('Không có dữ liệu phản hồi');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let assistantText = '';

      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        for (const line of chunk.split('\n')) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6);
          if (data === '[DONE]') break;
          try {
            const delta = JSON.parse(data).delta?.text ?? '';
            assistantText += delta;
            setMessages(prev => {
              const updated = [...prev];
              updated[updated.length - 1] = { role: 'assistant', content: assistantText };
              return updated;
            });
          } catch { /* skip */ }
        }
      }
    } catch (e) {
      const missing = e instanceof Error && e.message === 'api-missing';
      setMessages(prev => [...prev, { role: 'assistant', content: missing ? 'Chưa cấu hình AI luận giải. Vui lòng kiểm tra biến môi trường FREELLM_API_KEY trên server.' : 'Luận giải thất bại, vui lòng thử lại sau.' }]);
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  };

  const sendMessage = (text: string, hidden = false) => {
    if (!text.trim() || loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);

    const userMsg: Message = { role: 'user', content: text, hidden };
    // Capture current messages synchronously via ref (avoids stale closure)
    const apiMessages = [...messagesRef.current, userMsg].map(m => ({
      role: m.role,
      content: m.content,
    }));

    if (messagesRef.current.length > 0) followRef.current = true; // không cuộn với phần tổng quan tự chạy lúc đầu
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    streamResponse(apiMessages);
  };

  const handleTopicClick = (topicKey: string) => {
    if (loadingRef.current) return;
    setActiveTopic(topicKey);
    sendMessage(TOPIC_PROMPTS[topicKey], true);
  };

  const handleSend = () => {
    sendMessage(input);
  };

  const inputBar = (
    <div
      className={isMobile ? 'fixed left-0 right-0 bottom-0 z-[70] px-3 pt-2' : 'flex-shrink-0 px-3 pb-3 pt-2'}
      style={isMobile
        ? { background: 'var(--bg-0, #020810)', borderTop: '1px solid rgba(212,168,67,0.35)', paddingBottom: 'calc(10px + env(safe-area-inset-bottom))', boxShadow: '0 -8px 24px rgba(0,0,0,0.45)' }
        : { borderTop: '1px solid var(--t-border)' }}
    >
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
          placeholder={isMobile ? 'Hỏi về lá số của bạn…' : 'Hỏi thêm, ví dụ: Năm nay có nên đổi việc không?'}
          disabled={loading}
          enterKeyHint="send"
          className={`flex-1 min-w-0 rounded-lg px-3 focus:outline-none transition-colors ${isMobile ? 'py-3 text-[16px]' : 'py-2 text-[11px]'}`}
          style={{
            background: isMobile ? 'rgba(255,255,255,0.06)' : 'var(--t-card)',
            border: `1px solid ${isMobile ? 'rgba(212,168,67,0.45)' : 'var(--t-border)'}`,
            color: 'var(--t-text)',
          }}
        />
        <button
          onClick={handleSend}
          disabled={loading || !input.trim()}
          className={`rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed ${isMobile ? 'px-5 text-[15px]' : 'px-3 py-2 text-[11px]'}`}
          style={isMobile
            ? { background: 'linear-gradient(135deg, #b8862e, #e0b553)', color: '#140d02', border: 'none' }
            : { background: 'rgba(212,168,67,0.15)', border: '1px solid rgba(212,168,67,0.25)', color: 'var(--t-gold)' }}
        >
          {loading ? '…' : 'Hỏi'}
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full rounded-xl overflow-hidden card-glass">

      {/* ── Topic buttons ── */}
      <div className="flex-shrink-0 px-2 pt-2.5 pb-2" style={{ borderBottom: '1px solid var(--t-border)' }}>
        <div className="flex gap-1.5 overflow-x-auto lg:grid lg:grid-cols-6 lg:gap-1 lg:overflow-visible" style={{ scrollbarWidth: 'none' }}>
          {TOPICS.map(t => {
            const isActive = activeTopic === t.key;
            return (
              <button
                key={t.key}
                onClick={() => handleTopicClick(t.key)}
                disabled={loading}
                className="flex-shrink-0 px-3 py-2 text-[13px] lg:px-0 lg:py-1.5 lg:text-[10px] whitespace-nowrap font-medium rounded-lg transition-all duration-150 disabled:opacity-40"
                style={{
                  background: isActive ? 'rgba(212,168,67,0.12)' : 'transparent',
                  border: `1px solid ${isActive ? 'rgba(212,168,67,0.3)' : 'var(--t-border)'}`,
                  color: isActive ? 'var(--t-gold)' : 'var(--t-faint)',
                }}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Messages ── */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">

        {/* Loading state before first message */}
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="text-4xl mb-3" style={{ color: 'var(--t-gold)', opacity: 0.1 }}>✦</div>
            <p className="text-[10px] animate-pulse" style={{ color: 'var(--t-faint)' }}>Đang luận giải mệnh cách…</p>
          </div>
        )}

        <AnimatePresence initial={false}>
          {messages.map((msg, i) => {
            if (msg.role === 'user' && msg.hidden) return null;

            if (msg.role === 'user') {
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-end"
                >
                  <div
                    className="max-w-[85%] rounded-xl px-3 py-2 text-[11px]"
                    style={{
                      background: 'rgba(212,168,67,0.08)',
                      border: '1px solid rgba(212,168,67,0.18)',
                      color: 'var(--t-gold)',
                    }}
                  >
                    {msg.content}
                  </div>
                </motion.div>
              );
            }

            // Assistant message
            const isLastMsg = i === messages.length - 1;
            return (
              <motion.div
                key={i}
                ref={isLastMsg ? lastMsgRef : undefined}
                style={{ scrollMarginTop: 16 }}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div
                  className="text-[9px] tracking-widest mb-2 flex items-center gap-1.5"
                  style={{ color: 'var(--t-faint)' }}
                >
                  <span style={{ color: 'var(--t-gold)', opacity: 0.4 }}>✦</span>
                  Luận giải AI · mang tính tham khảo
                </div>
                <AiContent text={msg.content} streaming={loading && isLastMsg} />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* ── Input ── (desktop: trong khung; mobile: thanh dính đáy màn hình) */}
      {isMobile ? (
        <>
          <div style={{ height: 8 }} />
          {typeof document !== 'undefined' && createPortal(inputBar, document.body)}
        </>
      ) : inputBar}

    </div>
  );
}
